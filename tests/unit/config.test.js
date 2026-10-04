import { DEFAULT_CONTACT_ENDPOINT, readConfig } from "../../src/lib/config.js";

describe("readConfig", () => {
  it("defaults to the production contact API", () => {
    expect(readConfig({}).contactEndpoint).toBe("https://contact-api.jrflab.dev/contact");
    expect(readConfig({ PUBLIC_CONTACT_ENDPOINT: "  " }).contactEndpoint).toBe(DEFAULT_CONTACT_ENDPOINT);
  });

  it("uses PUBLIC_CONTACT_ENDPOINT when set", () => {
    expect(readConfig({ PUBLIC_CONTACT_ENDPOINT: " https://example.test/c " }).contactEndpoint).toBe(
      "https://example.test/c",
    );
  });
});
