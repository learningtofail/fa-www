/** Contact API used when `PUBLIC_CONTACT_ENDPOINT` is not set at build time. */
export const DEFAULT_CONTACT_ENDPOINT = "https://contact-api.jrflab.dev/contact";

/** Origin that serves the tool pages when `PUBLIC_TOOLS_ORIGIN` is not set at build time. */
export const DEFAULT_TOOLS_ORIGIN = "https://portfolio.faysalahmed.ca";

/**
 * Reads build-time configuration. `env` is injected so tests do not need to mutate `import.meta.env`.
 * @param {{ PUBLIC_CONTACT_ENDPOINT?: string, PUBLIC_TOOLS_ORIGIN?: string }} env
 * @returns {{ contactEndpoint: string, toolsOrigin: string }}
 */
export function readConfig(env) {
  return {
    contactEndpoint: env.PUBLIC_CONTACT_ENDPOINT?.trim() || DEFAULT_CONTACT_ENDPOINT,
    toolsOrigin: (env.PUBLIC_TOOLS_ORIGIN?.trim() || DEFAULT_TOOLS_ORIGIN).replace(/\/+$/, ""),
  };
}

export const config = readConfig(import.meta.env);
