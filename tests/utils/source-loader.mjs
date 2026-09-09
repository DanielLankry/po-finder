import { registerHooks } from "node:module";
import { existsSync } from "node:fs";

// Run the actual TypeScript modules with Node's type stripping and Next-style imports.
const root = new URL("../../", import.meta.url);
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("next/") && !specifier.startsWith("next/dist/") && !specifier.endsWith(".js")) specifier += ".js";
    if (specifier.startsWith("@/")) specifier = new URL(specifier.slice(2), root).href;
    const url = specifier.startsWith(".") ? new URL(specifier, context.parentURL).href : specifier;
    if (url.startsWith("file:") && existsSync(new URL(url + ".ts"))) {
      return nextResolve(url + ".ts", context);
    }
    return nextResolve(specifier, context);
  },
});
