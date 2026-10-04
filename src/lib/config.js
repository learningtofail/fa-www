/** Contact API used when `PUBLIC_CONTACT_ENDPOINT` is not set at build time. */
export const DEFAULT_CONTACT_ENDPOINT = "https://contact-api.jrflab.dev/contact";

/**
 * Reads build-time configuration. `env` is injected so tests do not need to mutate `import.meta.env`.
 * @param {{ PUBLIC_CONTACT_ENDPOINT?: string }} env
 * @returns {{ contactEndpoint: string }}
 */
export function readConfig(env) {
  return { contactEndpoint: env.PUBLIC_CONTACT_ENDPOINT?.trim() || DEFAULT_CONTACT_ENDPOINT };
}

export const config = readConfig(import.meta.env);
