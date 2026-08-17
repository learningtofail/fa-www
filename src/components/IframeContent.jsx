export default function IframeContent({ url, label }) {
  return (
    <iframe
      src={url}
      title={label}
      style={{ width: "100%", height: "100%", border: "none", display: "block" }}
    />
  );
}
