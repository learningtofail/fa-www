import "../styles/content.css";

export default function IframeContent({ url, label }) {
  return <iframe className="iframe-content" src={url} title={label} />;
}
