// QR code + short code the student shows at the library counter.
// Tap it to show the QR full screen (big and bright, easy for the
// librarian's camera to scan).
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { QRCodeSVG } from "qrcode.react";
import { formatDate } from "../utils/format";

function FullScreenQr({ code, pickupBy, bookTitle, onClose }) {
  useEffect(() => {
    // Close with Escape / the phone's back gesture, and stop the page behind from scrolling
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";

    // Keep the screen on while the QR is showing (supported on most phones)
    let wakeLock = null;
    if (navigator.wakeLock) {
      navigator.wakeLock.request("screen").then((lock) => (wakeLock = lock)).catch(() => {});
    }

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      if (wakeLock) wakeLock.release().catch(() => {});
    };
  }, [onClose]);

  return createPortal(
    <div className="qr-fullscreen" role="dialog" aria-label="Pickup QR code" onClick={onClose}>
      <button className="qr-fullscreen-close" onClick={onClose} aria-label="Close">
        <i className="bi bi-x-lg"></i>
      </button>

      <div className="qr-fullscreen-body" onClick={(e) => e.stopPropagation()}>
        {bookTitle && <div className="qr-fullscreen-title">{bookTitle}</div>}
        <div className="qr-fullscreen-code-box">
          <QRCodeSVG value={code} size={512} level="M" marginSize={2} style={{ width: "100%", height: "auto" }} />
        </div>
        <div className="qr-fullscreen-code">{code}</div>
        <div className="qr-fullscreen-hint">
          Show this to the librarian
          {pickupBy && <> · Collect by {formatDate(pickupBy)}</>}
        </div>
        <div className="qr-fullscreen-tip">
          <i className="bi bi-brightness-high me-1"></i>Turn your screen brightness up for a quick scan
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function PickupCode({ code, pickupBy, bookTitle }) {
  const [open, setOpen] = useState(false);
  if (!code) return null;

  return (
    <>
      <button type="button" className="pickup-box w-100 text-start" onClick={() => setOpen(true)} aria-label="Show QR code full screen">
        <div className="qr">
          <QRCodeSVG value={code} size={64} />
        </div>
        <div className="flex-grow-1">
          <div className="small text-secondary">Show this at the counter</div>
          <div className="pickup-code">{code}</div>
          {pickupBy && <div className="small text-secondary">Collect by {formatDate(pickupBy)}</div>}
        </div>
        <div className="pickup-enlarge">
          <i className="bi bi-arrows-fullscreen"></i>
          <span>Tap to show</span>
        </div>
      </button>

      {open && <FullScreenQr code={code} pickupBy={pickupBy} bookTitle={bookTitle} onClose={() => setOpen(false)} />}
    </>
  );
}
