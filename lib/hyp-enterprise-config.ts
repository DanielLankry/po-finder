export type HypEnterpriseConfig = {
  relayUrl: string;
  user: string;
  password: string;
  terminalNumber: string;
};

type Environment = Record<string, string | undefined>;

function requireConfig(env: Environment, name: string): string {
  const value = env[name]?.trim();
  if (!value) throw new Error(`Missing env: ${name}`);
  return value;
}

export function getHypEnterpriseConfig(
  env: Environment = process.env,
): HypEnterpriseConfig {
  const relayUrl =
    env.HYP_ENTERPRISE_RELAY_URL?.trim() || env.HYP_ENTERPRISE_URL?.trim();
  if (!relayUrl) {
    throw new Error("Missing env: HYP_ENTERPRISE_RELAY_URL");
  }

  let parsedRelayUrl: URL;
  try {
    parsedRelayUrl = new URL(relayUrl);
  } catch {
    throw new Error("Invalid env: HYP_ENTERPRISE_RELAY_URL");
  }
  if (parsedRelayUrl.protocol !== "https:") {
    throw new Error("Invalid env: HYP_ENTERPRISE_RELAY_URL must use HTTPS");
  }

  return {
    relayUrl: parsedRelayUrl.toString(),
    user: requireConfig(env, "HYP_ENTERPRISE_USER"),
    password: requireConfig(env, "HYP_ENTERPRISE_PASSWORD"),
    terminalNumber: requireConfig(env, "HYP_TERMINAL_NUMBER"),
  };
}
