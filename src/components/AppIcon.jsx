import "../styles/app-icon.css";

// Shared icon glyph used by desktop icons, the dock, the mobile home grid, and
// the Marketing folder grid: one visual language across every navigation surface.
/**
 * @param {{ glyph: string, tone: string, size?: "xs" | "sm" | "md" | "lg" | "xl" }} props
 * `tone` names an `--app-tone-*` token, `size` an `--icon-size-*` token.
 */
export default function AppIcon({ glyph, tone, size = "lg" }) {
  return (
    <div className={`app-icon app-icon--${size} app-icon--${tone}`} aria-hidden="true">
      {glyph}
    </div>
  );
}
