// Admin: download the monthly library report as a PDF
import { useState } from "react";
import api, { getErrorMessage } from "../api/axios";
import { useToast } from "../context/ToastContext";

// "2026-11" for the current month
const thisMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export default function MonthlyReport() {
  const toast = useToast();
  const [month, setMonth] = useState(thisMonth());
  const [busy, setBusy] = useState(false);

  const download = async () => {
    setBusy(true);
    try {
      const { data } = await api.get("/admin/report", { params: { month }, responseType: "blob" });
      // Save the PDF: make a temporary link to the file and click it
      const url = URL.createObjectURL(new Blob([data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `library-report-${month}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      toast.success("Report downloaded");
    } catch (err) {
      // Errors also come back as a file, so read the message out of it
      let message = getErrorMessage(err);
      if (err.response && err.response.data instanceof Blob) {
        try {
          message = JSON.parse(await err.response.data.text()).message || message;
        } catch {
          // keep the first message
        }
      }
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="app-card p-3 d-flex flex-wrap align-items-center gap-3">
      <span className="stat-icon tint-danger mb-0">
        <i className="bi bi-file-earmark-pdf"></i>
      </span>
      <div className="flex-grow-1" style={{ minWidth: 180 }}>
        <div className="fw-semibold">Monthly report</div>
        <div className="small text-secondary">Loans, returns, fines, overdue books and top readers as a PDF.</div>
      </div>
      <div className="d-flex gap-2">
        <input
          type="month"
          className="form-control"
          value={month}
          max={thisMonth()}
          onChange={(e) => setMonth(e.target.value || thisMonth())}
          aria-label="Report month"
        />
        <button className="btn btn-primary text-nowrap" onClick={download} disabled={busy}>
          {busy ? (
            <span className="spinner-border spinner-border-sm"></span>
          ) : (
            <>
              <i className="bi bi-download me-1"></i>PDF
            </>
          )}
        </button>
      </div>
    </div>
  );
}
