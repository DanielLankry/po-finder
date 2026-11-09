#!/usr/bin/env python3
"""Apply the reviewed 74-branch source cleanup atomically. No history rewriting."""
from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import subprocess
import sys
import tempfile

ALLOWED_REPOSITORY = "DanielLankry/po-finder"
ALLOWED_ACTOR = "DanielLankry"
DEFAULT_BRANCH = "master"
REQUEST_ID = "po-finder-privacy-cleanup-2026-11-09-v1"
PAYLOAD_SHA256 = "c3e47c900dd18102fd77c9be08efc1ff7366297b91a3d2aeb8cf07b2a688a594"
DEFAULT_BEFORE = "04318b52a779e054f4299e71e90468b8827fc815"
REQUEST_PATH = ".github/security-branch-fixes-request.json"
PAYLOAD_PATH = ".github/security-branch-fixes-payload.json"
EXPECTED_BRANCH_COUNT = 74
HEX40 = re.compile(r"[0-9a-f]{40}\Z")


class BatchError(RuntimeError):
    """Only constant error codes and non-sensitive metadata reach the action log."""


def require(condition, code):
    if not condition:
        raise BatchError(code)


def run_git(cwd, args, *, data=None, env=None):
    command_env = dict(os.environ)
    command_env["GIT_TERMINAL_PROMPT"] = "0"
    if env:
        command_env.update(env)
    result = subprocess.run(
        ["git", "-C", str(cwd), *args],
        input=data,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        env=command_env,
        check=False,
    )
    if result.returncode:
        raise BatchError("git-" + args[0] + "-failed")
    return result.stdout


def remote_heads(cwd):
    result = {}
    for line in run_git(cwd, ["ls-remote", "--heads", "origin"]).decode().splitlines():
        sha, ref = line.split("\t", 1)
        require(bool(HEX40.fullmatch(sha)), "invalid-remote-object-id")
        require(ref.startswith("refs/heads/"), "unexpected-remote-reference")
        result[ref] = sha
    return result


def validate_path(path):
    require(isinstance(path, str) and path and "\0" not in path, "invalid-path")
    parts = PurePosixPath(path).parts
    require(not path.startswith("/") and ".." not in parts and ".git" not in [part.lower() for part in parts], "unsafe-path")


def blob_id(data):
    return hashlib.sha1(b"blob " + str(len(data)).encode() + b"\0" + data).hexdigest()


def validate_deployment_config(clean_content, original_content=None):
    clean = json.loads(clean_content)
    require(isinstance(clean, dict), "invalid-deployment-config")
    settings = clean.get("git")
    require(isinstance(settings, dict) and settings.get("deploymentEnabled") is False, "git-deployments-not-disabled")
    if original_content is not None:
        original = json.loads(original_content)
        require(isinstance(original, dict), "invalid-original-deployment-config")
        previous_git = original.get("git", {})
        require(isinstance(previous_git, dict), "invalid-original-git-config")
        original["git"] = dict(previous_git, deploymentEnabled=False)
        require(clean == original, "unrelated-deployment-config-change")


def validate_payload(cwd, payload):
    require(payload.get("version") == 1, "unsupported-payload-version")
    require(payload.get("repository") == ALLOWED_REPOSITORY, "wrong-payload-repository")
    require(payload.get("request_id") == REQUEST_ID, "wrong-payload-request")
    branches = payload.get("branches")
    require(isinstance(branches, list) and len(branches) == EXPECTED_BRANCH_COUNT, "wrong-branch-count")
    require(isinstance(payload.get("blobs"), dict), "invalid-blob-table")
    for sha, content in payload["blobs"].items():
        require(isinstance(content, str) and HEX40.fullmatch(sha), "invalid-clean-blob")
        require(blob_id(content.encode("utf-8")) == sha, "clean-blob-hash-mismatch")
    seen = set()
    for branch in branches:
        name = branch.get("branch")
        require(isinstance(name, str) and name not in seen, "duplicate-or-invalid-branch")
        require(name != DEFAULT_BRANCH and not name.startswith("refs/"), "forbidden-branch-target")
        run_git(cwd, ["check-ref-format", "refs/heads/" + name])
        seen.add(name)
        for key in ["expected_head", "base_tree_sha", "expected_tree_sha"]:
            require(bool(HEX40.fullmatch(branch.get(key, ""))), "invalid-pinned-object")
        require(isinstance(branch.get("operations"), list) and branch["operations"], "empty-branch-plan")
        paths = set()
        for operation in branch["operations"]:
            require(operation.get("action") in {"create", "update", "delete"}, "unsupported-operation")
            path = operation.get("new_path") or operation.get("old_path")
            validate_path(path)
            require(path not in paths, "duplicate-operation-path")
            paths.add(path)
            require(operation.get("mode") in {"100644", "100755", "120000"}, "invalid-file-mode")
            if operation["action"] == "create":
                require(operation.get("old_path") is None and operation.get("original_blob") is None, "invalid-create")
            elif operation["action"] == "update":
                require(operation.get("old_path") == operation.get("new_path"), "renames-not-authorized")
                require(bool(HEX40.fullmatch(operation.get("original_blob", ""))), "missing-original-blob")
            else:
                require(operation.get("new_path") is None and operation.get("expected_blob") is None, "invalid-delete")
                require(bool(HEX40.fullmatch(operation.get("original_blob", ""))), "missing-deleted-blob")
            if operation["action"] != "delete":
                require(operation.get("expected_blob") in payload["blobs"], "missing-clean-content")
        deployment_operations = [operation for operation in branch["operations"] if operation.get("new_path") == "vercel.json"]
        require(len(deployment_operations) == 1, "missing-deployment-disable-operation")
        deployment_operation = deployment_operations[0]
        require(deployment_operation["action"] in {"create", "update"}, "invalid-deployment-disable-operation")
        validate_deployment_config(payload["blobs"][deployment_operation["expected_blob"]])


def assert_leases(cwd, branches, expected_default_head):
    heads = remote_heads(cwd)
    require(heads.get("refs/heads/" + DEFAULT_BRANCH) == expected_default_head, "default-branch-drift")
    for branch in branches:
        require(heads.get("refs/heads/" + branch["branch"]) == branch["expected_head"], "target-branch-drift")
    return heads


def execute_batch(cwd, payload, *, expected_remote, expected_default_head):
    """Core is also exercised against isolated local remotes; production pins inputs below."""
    cwd = Path(cwd)
    actual_remote = run_git(cwd, ["remote", "get-url", "origin"]).decode().strip()
    require(actual_remote == expected_remote, "unexpected-origin")
    validate_payload(cwd, payload)
    branches = payload["branches"]
    assert_leases(cwd, branches, expected_default_head)
    # Fetch into a private local namespace. No checked-out branch or remote ref is changed.
    run_git(cwd, ["fetch", "--no-tags", "origin", "+refs/heads/*:refs/security-cleanup-base/*"])
    for branch in branches:
        fetched = run_git(cwd, ["rev-parse", "refs/security-cleanup-base/" + branch["branch"]]).decode().strip()
        require(fetched == branch["expected_head"], "target-drift-during-fetch")
    updates = []
    for branch in branches:
        old = branch["expected_head"]
        base_tree = run_git(cwd, ["rev-parse", old + "^{tree}"]).decode().strip()
        require(base_tree == branch["base_tree_sha"], "base-tree-mismatch")
        with tempfile.TemporaryDirectory(prefix="security-cleanup-index-") as directory:
            index_env = {"GIT_INDEX_FILE": str(Path(directory) / "index")}
            run_git(cwd, ["read-tree", base_tree], env=index_env)
            for operation in branch["operations"]:
                path = operation.get("new_path") or operation["old_path"]
                entry = run_git(cwd, ["ls-tree", "-z", base_tree, "--", path])
                if operation["action"] == "create":
                    require(not entry, "create-path-already-exists")
                else:
                    records = [record for record in entry.split(b"\0") if record]
                    require(len(records) == 1, "original-path-missing")
                    metadata, found_path = records[0].split(b"\t", 1)
                    mode, kind, old_blob = metadata.decode().split()
                    require(kind == "blob" and found_path.decode() == path, "unexpected-original-type")
                    require(old_blob == operation["original_blob"] and mode == operation["mode"], "original-file-mismatch")
                if operation["action"] == "delete":
                    run_git(cwd, ["update-index", "--force-remove", "--", path], env=index_env)
                else:
                    data = payload["blobs"][operation["expected_blob"]].encode("utf-8")
                    if path == "vercel.json":
                        original = run_git(cwd, ["cat-file", "blob", operation["original_blob"]]) if operation["action"] == "update" else b"{}"
                        validate_deployment_config(data, original)
                    sha = run_git(cwd, ["hash-object", "-w", "--stdin"], data=data).decode().strip()
                    require(sha == operation["expected_blob"], "written-blob-mismatch")
                    run_git(cwd, ["update-index", "--add", "--cacheinfo", operation["mode"] + "," + sha + "," + path], env=index_env)
            tree = run_git(cwd, ["write-tree"], env=index_env).decode().strip()
            require(tree == branch["expected_tree_sha"], "prepared-tree-mismatch")
        identity = {
            "GIT_AUTHOR_NAME": "github-actions[bot]",
            "GIT_AUTHOR_EMAIL": "41898282+github-actions[bot]@users.noreply.github.com",
            "GIT_COMMITTER_NAME": "github-actions[bot]",
            "GIT_COMMITTER_EMAIL": "41898282+github-actions[bot]@users.noreply.github.com",
        }
        commit = run_git(cwd, ["commit-tree", tree, "-p", old], data=b"fix(security): remove private contact and cache; disable snapshot deployments\n", env=identity).decode().strip()
        parents = run_git(cwd, ["rev-list", "--parents", "-n", "1", commit]).decode().split()
        require(parents == [commit, old], "new-commit-is-not-a-single-fast-forward")
        run_git(cwd, ["merge-base", "--is-ancestor", old, commit])
        updates.append({"branch": branch["branch"], "old_head": old, "new_head": commit, "tree": tree})
    # Stop on any observed drift before a single atomic publication attempt.
    assert_leases(cwd, branches, expected_default_head)
    args = ["push", "--atomic", "--porcelain"]
    args.extend("--force-with-lease=refs/heads/" + update["branch"] + ":" + update["old_head"] for update in updates)
    args.append("origin")
    args.extend(update["new_head"] + ":refs/heads/" + update["branch"] for update in updates)
    # Every refspec is a verified fast-forward; leases are not permission to rewrite history.
    # If permissions/protections/leases/atomic support reject the push, there is no fallback.
    run_git(cwd, args)
    after = remote_heads(cwd)
    require(after.get("refs/heads/" + DEFAULT_BRANCH) == expected_default_head, "default-changed-during-publication")
    for update in updates:
        require(after.get("refs/heads/" + update["branch"]) == update["new_head"], "published-head-verification-failed")
    return {"status": "complete", "request_id": REQUEST_ID, "branches_updated": len(updates), "updates": updates}


def validate_github_context(cwd, environment):
    require(environment.get("GITHUB_REPOSITORY") == ALLOWED_REPOSITORY, "wrong-action-repository")
    require(environment.get("GITHUB_ACTOR") == ALLOWED_ACTOR, "wrong-action-actor")
    require(environment.get("GITHUB_TRIGGERING_ACTOR") == ALLOWED_ACTOR, "wrong-triggering-actor")
    require(environment.get("GITHUB_EVENT_NAME") == "push", "wrong-event")
    require(environment.get("GITHUB_REF") == "refs/heads/" + DEFAULT_BRANCH, "wrong-trigger-ref")
    event = json.loads(Path(environment["GITHUB_EVENT_PATH"]).read_text())
    require(event.get("ref") == "refs/heads/" + DEFAULT_BRANCH and not event.get("deleted") and not event.get("forced"), "invalid-push-event")
    require(event.get("sender", {}).get("login") == ALLOWED_ACTOR, "wrong-event-sender")
    require(event.get("before") == DEFAULT_BEFORE, "unexpected-trigger-base")
    after = event.get("after", "")
    require(bool(HEX40.fullmatch(after)) and after == environment.get("GITHUB_SHA"), "unexpected-trigger-head")
    require(run_git(cwd, ["rev-parse", "HEAD"]).decode().strip() == after, "checkout-is-not-trigger-head")
    changed = run_git(cwd, ["diff", "--name-only", event["before"], after, "--", REQUEST_PATH]).decode().splitlines()
    require(changed == [REQUEST_PATH], "request-file-did-not-change")
    return after


def main():
    try:
        cwd = Path.cwd()
        after = validate_github_context(cwd, os.environ)
        request = json.loads((cwd / REQUEST_PATH).read_text())
        require(request.get("execute") is True, "request-not-enabled")
        require(request.get("request_id") == REQUEST_ID, "wrong-request-id")
        require(request.get("repository") == ALLOWED_REPOSITORY and request.get("actor") == ALLOWED_ACTOR, "wrong-request-owner")
        require(request.get("expected_default_before") == DEFAULT_BEFORE, "wrong-request-default-base")
        raw = (cwd / PAYLOAD_PATH).read_bytes()
        require(request.get("payload_sha256") == PAYLOAD_SHA256 and hashlib.sha256(raw).hexdigest() == PAYLOAD_SHA256, "payload-digest-mismatch")
        payload = json.loads(raw)
        remote = run_git(cwd, ["remote", "get-url", "origin"]).decode().strip()
        canonical = "https://github.com/" + ALLOWED_REPOSITORY
        require(remote in {canonical, canonical + ".git"}, "unexpected-origin")
        result = execute_batch(cwd, payload, expected_remote=remote, expected_default_head=after)
        print(json.dumps(result))
        return 0
    except BatchError as error:
        print(json.dumps({"status": "stopped", "code": str(error), "automatic_retry": False}))
        return 1
    except Exception:
        print(json.dumps({"status": "stopped", "code": "unexpected-error", "source_values_printed": False, "automatic_retry": False}))
        return 1


if __name__ == "__main__":
    sys.exit(main())
