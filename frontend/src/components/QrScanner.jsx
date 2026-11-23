// Camera QR scanner (used by the admin to scan a student's pickup QR code).
// Works on the phone (back camera) and on a laptop webcam.
// The scanner library (html5-qrcode) is loaded only when this opens,
// so the rest of the app stays fast.
import { useEffect, useRef, useState } from "react";

export default function QrScanner({ onScan }) {
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(true);
  const doneRef = useRef(false); // stop after the first good scan
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;
  const boxId = "qr-reader-box";

  useEffect(() => {
    let scanner = null;
    let stopped = false;

    import("html5-qrcode")
      .then(({ Html5Qrcode }) => {
        if (stopped) return;
        scanner = new Html5Qrcode(boxId, { verbose: false });
        return scanner.start(
          { facingMode: "environment" }, // back camera on phones
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (text) => {
            if (doneRef.current) return;
            doneRef.current = true;
            if (navigator.vibrate) navigator.vibrate(80);
            onScanRef.current(text.trim());
          },
          () => {} // "no QR in this frame" - happens all the time, ignore
        );
      })
      .then(() => setStarting(false))
      .catch((err) => {
        setStarting(false);
        const message = String(err && (err.message || err));
        if (/permission|denied|notallowed/i.test(message)) setError("Camera permission was blocked. Allow the camera for this site and try again.");
        else if (/notfound|no camera|devices/i.test(message)) setError("No camera found on this device.");
        else setError("Could not start the camera. " + message);
      });

    // Turn the camera off when the scanner closes
    return () => {
      stopped = true;
      if (scanner && scanner.isScanning) scanner.stop().then(() => scanner.clear()).catch(() => {});
    };
  }, []);

  return (
    <div>
      <div id={boxId} className="qr-reader"></div>
      {starting && !error && (
        <p className="small text-secondary text-center mt-2 mb-0">
          <span className="spinner-border spinner-border-sm me-2"></span>Starting camera...
        </p>
      )}
      {error ? (
        <div className="alert alert-warning small mt-2 mb-0">{error}</div>
      ) : (
        !starting && <p className="small text-secondary text-center mt-2 mb-0">Point the camera at the QR code in the student's app.</p>
      )}
    </div>
  );
}
