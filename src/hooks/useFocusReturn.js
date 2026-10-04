import { useEffect, useState } from "react";

/**
 * Focus handoff for dialogs (WCAG 2.4.3), the React analog of focusModal/unfocusModal.
 * When the user opens a dialog from a control, focus moves into the dialog (unless something
 * inside already took it) and returns to that control when the dialog closes, provided the
 * control is still on the page. A dialog that mounts with nothing focused (the windows that
 * are open at page load) leaves focus alone.
 * @param {React.RefObject<HTMLElement | null>} containerRef the dialog element; it needs tabIndex={-1}
 */
export function useFocusReturn(containerRef) {
  // Read during the first render, before any child effect or autofocus can move focus.
  const [opener] = useState(() => {
    if (typeof document === "undefined") return null;
    const active = document.activeElement;
    return active instanceof HTMLElement && active !== document.body ? active : null;
  });

  useEffect(() => {
    if (!opener) return undefined;
    const container = containerRef.current;
    if (container && !container.contains(document.activeElement)) container.focus();
    return () => {
      if (opener.isConnected) opener.focus();
    };
  }, [containerRef, opener]);
}
