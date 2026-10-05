/** The ways a weather or place lookup can fail. `kind` picks the message the UI shows. */
export class WeatherError extends Error {
  /**
   * @param {"network" | "http" | "data"} kind
   * @param {string} message
   * @param {number} [status] HTTP status for `kind === "http"`
   */
  constructor(kind, message, status) {
    super(message);
    this.name = "WeatherError";
    this.kind = kind;
    this.status = status;
  }
}

/**
 * @param {unknown} error
 * @returns {string} a sentence for the person looking at the app
 */
export function describeError(error) {
  if (!(error instanceof WeatherError)) return "Something went wrong. Try again.";
  if (error.kind === "network") return "Could not reach the weather service. Check your connection and try again.";
  if (error.kind === "data") return "The weather service sent data this app could not read.";
  if (error.status === 429) return "The weather service is busy. Try again in a minute.";
  return `The weather service had a problem (status ${error.status}). Try again later.`;
}
