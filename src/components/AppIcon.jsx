// Shared icon glyph used by desktop icons, the dock, the mobile home grid, and
// the tools folder grid — one visual language across every navigation surface.
export default function AppIcon({ glyph, color, size = 44, fontSize }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.24,
        background: color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: fontSize || size * 0.5,
        color: "var(--white)",
        flexShrink: 0,
        boxShadow: "var(--app-tile-shadow)",
      }}
      aria-hidden="true"
    >
      {glyph}
    </div>
  );
}
