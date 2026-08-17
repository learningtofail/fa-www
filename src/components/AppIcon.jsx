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
        color: "#fff",
        flexShrink: 0,
        boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
      }}
      aria-hidden="true"
    >
      {glyph}
    </div>
  );
}
