// A simple pop-up. On phones it slides up from the bottom like an app sheet.
import { useEffect } from "react";

export default function Modal({ title, onClose, children, width }) {
  // Close with the Escape key and stop the page behind from scrolling
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="modal-backdrop-custom" onClick={onClose}>
      <div className="modal-sheet" style={width ? { maxWidth: width } : undefined} onClick={(e) => e.stopPropagation()}>
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h2 className="h5 fw-bold mb-0">{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
