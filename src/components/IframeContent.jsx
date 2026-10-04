import { useEffect, useState } from "react";
import "../styles/content.css";
import { TOOL_FRAME } from "../data/tools.js";

/**
 * A tool page in a sandboxed frame. The frame cannot tell us whether a header such as
 * X-Frame-Options blocked it, so a plain link to open the tool in a new tab is always shown,
 * and a frame that has not loaded in time gets an explicit fallback notice.
 * @param {{ url: string, label: string }} props
 */
export default function IframeContent({ url, label }) {
  const [status, setStatus] = useState("loading"); // loading | loaded | failed

  useEffect(() => {
    const timer = setTimeout(() => setStatus((s) => (s === "loading" ? "failed" : s)), TOOL_FRAME.loadTimeoutMs);
    return () => clearTimeout(timer);
  }, [url]);

  return (
    <div className="iframe-content">
      <p className="iframe-content__bar">
        <a href={url} target="_blank" rel="noopener noreferrer">
          Open {label} in a new tab
        </a>
      </p>
      {status === "failed" && (
        <p className="iframe-content__fallback" role="alert">
          This tool did not load in the window. Use the link above to open it in its own tab.
        </p>
      )}
      <iframe
        className="iframe-content__frame"
        src={url}
        title={label}
        sandbox={TOOL_FRAME.sandbox}
        loading="lazy"
        referrerPolicy={TOOL_FRAME.referrerPolicy}
        onLoad={() => setStatus("loaded")}
      />
    </div>
  );
}
