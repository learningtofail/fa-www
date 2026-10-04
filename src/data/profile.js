/**
 * Single source for the bio and contact copy. About, Contact, the terminal filesystem and the
 * <noscript> fallback all read from here, so the years figure and the links cannot drift apart.
 * The portfolio holds the full resume; no phone number or address belongs in this repo.
 */

/** Year the career started; the "years" figure is computed from it. */
export const CAREER_START_YEAR = 2004;

export const PROFILE = Object.freeze({
  name: "Faysal Ahmed",
  email: "contactfaysal@gmail.com",
  linkedin: Object.freeze({ url: "https://linkedin.com/in/faysalahmed", label: "linkedin.com/in/faysalahmed" }),
  portfolio: Object.freeze({ url: "https://portfolio.faysalahmed.ca", label: "portfolio.faysalahmed.ca" }),
  status: "looking for the next thing to fix",
});

/**
 * @param {Date} [now]
 * @returns {number} whole calendar years since the career started
 */
export function yearsActive(now = new Date()) {
  return now.getFullYear() - CAREER_START_YEAR;
}

/**
 * @param {Date} [now]
 * @returns {string} for example "22 years making Google behave."
 */
export function tagline(now = new Date()) {
  return `${yearsActive(now)} years making Google behave.`;
}

export const ROLE_PREFIX = "Currently VP-track:";
export const ROLE_DETAIL = "SEO, organic growth, the occasional turnaround.";

/**
 * @param {Date} [now]
 * @returns {string} the one-line summary shown in About and in about.txt
 */
export function summary(now = new Date()) {
  return `${tagline(now)} ${ROLE_PREFIX} ${ROLE_DETAIL}`;
}

/** Sentence that follows the portfolio link in About and in about.txt. */
export const PORTFOLIO_BLURB = "this is the version of the site that doesn't take itself as seriously.";

export const TERMINAL_HINT = "There's a terminal around here somewhere. Try it.";
