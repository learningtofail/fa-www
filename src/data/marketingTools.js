import { config } from "../lib/config.js";

// The 21 marketing tools. Each is a standalone page vendored in fa-portfolio under /marketing/<slug>.html
// (decision 0007 there) and shown here as its own app. The list mirrors the files by hand, like tools.js.
// `name` is the tool's full title (window title, tooltips); `label` is the short tile caption.

/** Origin that serves the pages (the portfolio origin; see `PUBLIC_TOOLS_ORIGIN`). */
export const MARKETING_ORIGIN = config.toolsOrigin;

/** @param {string} slug @returns {string} */
export function marketingUrl(slug) {
  return `${MARKETING_ORIGIN}/marketing/${slug}.html`;
}

/**
 * Groups follow the source project's own grouping. `tone` names an `--app-tone-*` token, so every tool in a
 * group shares a color and each tool has its own glyph.
 * @type {readonly { id: string, heading: string, tone: string, tools: readonly { slug: string, name: string, label: string, glyph: string }[] }[]}
 */
export const MARKETING_GROUPS = Object.freeze([
  {
    id: "measurement",
    heading: "Experimentation and measurement",
    tone: "mkt-measure",
    tools: [
      {
        slug: "experiment-analyzer",
        name: "A/B, Multivariate & Campaign Experiment Analyzer",
        label: "Experiment Analyzer",
        glyph: "\u{1F9EA}",
      },
      {
        slug: "brand-incrementality",
        name: "Paid Search Brand Incrementality Estimator",
        label: "Brand Incrementality",
        glyph: "\u{1F4C8}",
      },
      {
        slug: "attribution-window-normalizer",
        name: "Attribution Window Normalizer",
        label: "Attribution Windows",
        glyph: "\u{1FA9F}",
      },
      {
        slug: "traffic-reconciler",
        name: "Reported-to-Verified Traffic Reconciler",
        label: "Traffic Reconciler",
        glyph: "\u{2696}",
      },
    ],
  },
  {
    id: "economics",
    heading: "Unit economics and planning",
    tone: "mkt-economics",
    tools: [
      { slug: "cac-payback-modeler", name: "CAC, Margin & Payback Modeler", label: "CAC Payback", glyph: "\u{1F4B0}" },
      {
        slug: "affiliate-margin-calculator",
        name: "Affiliate Commission & Margin Viability Calculator",
        label: "Affiliate Margin",
        glyph: "\u{1F9FE}",
      },
      {
        slug: "affiliate-concentration-analyzer",
        name: "Affiliate Revenue Concentration Risk Analyzer",
        label: "Affiliate Risk",
        glyph: "\u{1F9E9}",
      },
      {
        slug: "promo-capacity-checker",
        name: "Promotional Capacity Sanity-Checker",
        label: "Promo Capacity",
        glyph: "\u{1F3F7}",
      },
      {
        slug: "demand-capacity-guardrail",
        name: "Demand Forecasting & Inventory Capacity Guardrail",
        label: "Capacity Guardrail",
        glyph: "\u{1F4E6}",
      },
      { slug: "seo-equivalent-value", name: "SEO Equivalent Value Translator", label: "SEO Value", glyph: "\u{1F4B1}" },
    ],
  },
  {
    id: "paid",
    heading: "Paid search, social and acquisition",
    tone: "mkt-paid",
    tools: [
      {
        slug: "sqr-negative-keywords",
        name: "Search Query Report Bleed & Negative Keyword Extractor",
        label: "Negative Keywords",
        glyph: "\u{1F6AB}",
      },
      {
        slug: "creative-decay-monitor",
        name: "Paid Social Creative & Frequency Decay Monitor",
        label: "Creative Decay",
        glyph: "\u{1F4C9}",
      },
      {
        slug: "seasonality-visualizer",
        name: "Paid Search Seasonality Demand Curve Visualizer",
        label: "Seasonality",
        glyph: "\u{1F4C5}",
      },
      {
        slug: "quality-score-scorer",
        name: "Paid Ad Quality Score & Landing Page Checklist Scorer",
        label: "Quality Score",
        glyph: "\u{2705}",
      },
    ],
  },
  {
    id: "governance",
    heading: "Data governance, tracking and tagging",
    tone: "mkt-governance",
    tools: [
      { slug: "utm-governance-auditor", name: "UTM Governance Auditor", label: "UTM Governance", glyph: "\u{1F517}" },
      { slug: "gtm-container-auditor", name: "GTM Container Auditor", label: "GTM Container", glyph: "\u{1F3F7}" },
      {
        slug: "scv-gap-calculator",
        name: "Single Customer View Gap Calculator",
        label: "Customer View Gap",
        glyph: "\u{1F464}",
      },
      {
        slug: "bot-traffic-screener",
        name: "Web Traffic Quality & Bot Anomaly Screener",
        label: "Bot Screener",
        glyph: "\u{1F916}",
      },
    ],
  },
  {
    id: "seo",
    heading: "Technical SEO",
    tone: "mkt-seo",
    tools: [
      {
        slug: "redirect-mapper",
        name: "Bulk Redirect Mapper & Loop Validator",
        label: "Redirect Mapper",
        glyph: "\u{1F500}",
      },
    ],
  },
  {
    id: "messaging",
    heading: "Messaging and compliance",
    tone: "mkt-messaging",
    tools: [
      {
        slug: "feature-messaging-gap",
        name: "Feature-to-Messaging Gap Analyzer",
        label: "Messaging Gap",
        glyph: "\u{1F4AC}",
      },
      {
        slug: "ad-claims-flagger",
        name: "Ad Claims Substantiation & Compliance Flagger",
        label: "Ad Claims Flagger",
        glyph: "\u{1F6A9}",
      },
    ],
  },
]);

/** Every tool, flattened, with its group tone and page URL. */
export const MARKETING_TOOLS = Object.freeze(
  MARKETING_GROUPS.flatMap((group) =>
    group.tools.map((tool) => Object.freeze({ ...tool, tone: group.tone, url: marketingUrl(tool.slug) })),
  ),
);

const BY_SLUG = new Map(MARKETING_TOOLS.map((tool) => [tool.slug, tool]));

/** @param {string} slug @returns {boolean} */
export const isMarketingTool = (slug) => BY_SLUG.has(slug);

/** @param {string} slug @returns {{ glyph: string, tone: string } | undefined} */
export function marketingIcon(slug) {
  const tool = BY_SLUG.get(slug);
  return tool && { glyph: tool.glyph, tone: tool.tone };
}
