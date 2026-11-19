// QR code + short code the student shows at the library counter
import { QRCodeSVG } from "qrcode.react";
import { formatDate } from "../utils/format";

export default function PickupCode({ code, pickupBy }) {
  if (!code) return null;
  return (
    <div className="pickup-box">
      <div className="qr">
        <QRCodeSVG value={code} size={64} />
      </div>
      <div>
        <div className="small text-secondary">Show this at the counter</div>
        <div className="pickup-code">{code}</div>
        {pickupBy && <div className="small text-secondary">Collect by {formatDate(pickupBy)}</div>}
      </div>
    </div>
  );
}
