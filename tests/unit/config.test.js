import {
  DEFAULT_CONTACT_ENDPOINT,
  DEFAULT_GEOCODING_ORIGIN,
  DEFAULT_TOOLS_ORIGIN,
  DEFAULT_WEATHER_ORIGIN,
  readConfig,
} from "../../src/lib/config.js";

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

  it("defaults the tools origin to the production portfolio and strips trailing slashes", () => {
    expect(readConfig({}).toolsOrigin).toBe("https://portfolio.faysalahmed.ca");
    expect(readConfig({ PUBLIC_TOOLS_ORIGIN: "" }).toolsOrigin).toBe(DEFAULT_TOOLS_ORIGIN);
    expect(readConfig({ PUBLIC_TOOLS_ORIGIN: " https://tools.test// " }).toolsOrigin).toBe("https://tools.test");
  });

  it("defaults the weather origins to Open-Meteo and strips trailing slashes", () => {
    expect(readConfig({}).weatherOrigin).toBe("https://api.open-meteo.com");
    expect(readConfig({}).geocodingOrigin).toBe("https://geocoding-api.open-meteo.com");
    expect(readConfig({ PUBLIC_WEATHER_ORIGIN: " " }).weatherOrigin).toBe(DEFAULT_WEATHER_ORIGIN);
    expect(readConfig({ PUBLIC_GEOCODING_ORIGIN: "" }).geocodingOrigin).toBe(DEFAULT_GEOCODING_ORIGIN);
    expect(readConfig({ PUBLIC_WEATHER_ORIGIN: " https://w.test// " }).weatherOrigin).toBe("https://w.test");
    expect(readConfig({ PUBLIC_GEOCODING_ORIGIN: "https://g.test/" }).geocodingOrigin).toBe("https://g.test");
  });
});
