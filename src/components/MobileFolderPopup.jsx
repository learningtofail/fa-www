import { useRef } from "react";
import ToolsFolderContent from "./ToolsFolderContent.jsx";
import { useFocusReturn } from "../hooks/useFocusReturn.js";

/**
 * The Tools folder as a popup. Escape or a tap on the backdrop closes it, and focus returns to
 * the folder icon. Unchanged from the original MobileShell.
 * @param {{ onClose: () => void, onOpenTool: (slug: string, name: string, url: string) => void }} props
 */
export default function MobileFolderPopup({ onClose, onOpenTool }) {
  const popupRef = useRef(null);
  useFocusReturn(popupRef);
  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- backdrop tap dismisses; the keyboard path is Escape on the dialog and the tool buttons inside
    <div className="folder-backdrop" onClick={onClose}>
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- stops backdrop dismissal on taps inside, and closes on Escape */}
      <div
        ref={popupRef}
        className="folder-popup"
        role="dialog"
        aria-label="Tools"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
      >
        <p className="folder-popup-title">Tools</p>
        <ToolsFolderContent onOpenTool={onOpenTool} dense />
      </div>
    </div>
  );
}
