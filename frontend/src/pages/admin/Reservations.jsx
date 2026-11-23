import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api, { getErrorMessage } from "../../api/axios";
import { useToast } from "../../context/ToastContext";
import StatusBadge from "../../components/StatusBadge";
import EmptyState from "../../components/EmptyState";
import { SkeletonList } from "../../components/Skeleton";
import Modal from "../../components/Modal";
import QrScanner from "../../components/QrScanner";
import { downloadCsv } from "../../utils/csv";
import { formatDate } from "../../utils/format";

const FILTERS = [
  { key: "", label: "All" },
  { key: "reserved", label: "To collect" },
  { key: "issued", label: "Issued" },
  { key: "overdue", label: "Overdue" },
  { key: "fines", label: "Fines" },
  { key: "returned", label: "Returned" },
  { key: "cancelled", label: "Cancelled" },
  { key: "expired", label: "Expired" },
];

// The important date for each status
const dateInfo = (r) => {
  if (r.status === "reserved") return `Collect by ${formatDate(r.pickupBy)}`;
  if (r.status === "issued") return `Due ${formatDate(r.dueDate)}`;
  if (r.status === "returned") return `Returned ${formatDate(r.returnedAt)}`;
  if (r.status === "cancelled") return `Cancelled ${formatDate(r.cancelledAt)}`;
  if (r.status === "expired") return `Expired ${formatDate(r.expiredAt)}`;
  return "";
};

export default function Reservations() {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get("status") || "";

  const [reservations, setReservations] = useState([]);
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");
  const [batch, setBatch] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [scanning, setScanning] = useState(false); // camera QR scanner open?

  useEffect(() => {
    const timer = setTimeout(() => setSearch(text.trim()), 300);
    return () => clearTimeout(timer);
  }, [text]);

  const load = () => {
    const params = {};
    if (status) params.status = status;
    if (search) params.search = search;
    if (batch) params.batch = batch;
    api
      .get("/admin/reservations", { params })
      .then(({ data }) => setReservations(data.reservations))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [status, search, batch]);

  // Issue / Return / Cancel / Fine paid
  const runAction = async (r, action) => {
    setBusyId(r._id);
    try {
      const { data } = await api.put(`/admin/reservations/${r._id}/${action}`);
      toast.success(data.message);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  // Typed code or scanned QR code -> issue the book
  const issueCode = async (value) => {
    if (!value.trim()) return;
    setBusyId("code");
    try {
      const { data } = await api.post("/admin/reservations/issue-by-code", { code: value.trim() });
      toast.success(data.message);
      setCode("");
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const issueByCode = (e) => {
    e.preventDefault();
    issueCode(code);
  };

  const handleScan = (text) => {
    setScanning(false);
    setCode(text.toUpperCase());
    issueCode(text);
  };

  const exportCsv = () => {
    const rows = reservations.map((r) => [
      r.student ? r.student.name : "",
      r.student ? r.student.rollNumber : "",
      r.student ? r.student.batch : "",
      r.book ? r.book.title : "",
      r.isOverdue ? "overdue" : r.status,
      formatDate(r.reservedAt),
      r.issuedAt ? formatDate(r.issuedAt) : "",
      r.dueDate ? formatDate(r.dueDate) : "",
      r.returnedAt ? formatDate(r.returnedAt) : "",
      r.fine || 0,
      r.fine > 0 ? (r.fineDue > 0 ? "No" : "Yes") : "",
    ]);
    downloadCsv(
      `reservations-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Student", "Roll number", "Batch", "Book", "Status", "Reserved", "Issued", "Due", "Returned", "Fine (Rs)", "Fine paid"],
      rows
    );
  };

  // Buttons for one reservation
  const actions = (r) => {
    const busy = busyId === r._id;
    if (r.status === "reserved") {
      return (
        <>
          <button className="btn btn-primary btn-sm text-nowrap" disabled={busy} onClick={() => runAction(r, "issue")}>
            Issue
          </button>
          <button className="btn btn-light btn-sm text-danger" disabled={busy} onClick={() => runAction(r, "cancel")}>
            Cancel
          </button>
        </>
      );
    }
    if (r.status === "issued") {
      return (
        <button className="btn btn-success btn-sm text-nowrap" disabled={busy} onClick={() => runAction(r, "return")}>
          Mark returned
        </button>
      );
    }
    if (r.status === "returned" && r.fineDue > 0) {
      return (
        <button className="btn btn-warning btn-sm text-nowrap" disabled={busy} onClick={() => runAction(r, "fine-paid")}>
          Fine paid
        </button>
      );
    }
    return null;
  };

  const fineText = (r) => (r.fine > 0 ? (r.fineDue > 0 ? `Rs ${r.fine} due` : `Rs ${r.fine} paid`) : "");

  return (
    <>
      <div className="d-flex align-items-start justify-content-between gap-2">
        <div>
          <h1 className="page-title">Reservations</h1>
          <p className="page-sub">Who reserved or took each book.</p>
        </div>
        <button className="btn btn-light text-nowrap" onClick={exportCsv} disabled={reservations.length === 0}>
          <i className="bi bi-download me-1"></i>
          <span className="d-none d-sm-inline">Export </span>CSV
        </button>
      </div>

      {/* Issue by pickup code */}
      <form className="app-card p-3 mb-3 d-flex gap-2 align-items-center" onSubmit={issueByCode}>
        <span className="stat-icon tint-primary mb-0 d-none d-sm-flex">
          <i className="bi bi-qr-code-scan"></i>
        </span>
        <input
          className="form-control text-uppercase fw-semibold"
          style={{ letterSpacing: "0.15em" }}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Pickup code"
          maxLength={6}
          aria-label="Pickup code"
        />
        <button type="button" className="btn btn-soft text-nowrap" onClick={() => setScanning(true)} title="Scan the student's QR code">
          <i className="bi bi-camera"></i>
          <span className="d-none d-sm-inline ms-1">Scan</span>
        </button>
        <button className="btn btn-primary text-nowrap" disabled={busyId === "code"}>
          {busyId === "code" ? <span className="spinner-border spinner-border-sm"></span> : "Issue book"}
        </button>
      </form>

      {scanning && (
        <Modal title="Scan pickup QR" onClose={() => setScanning(false)} width={420}>
          <QrScanner onScan={handleScan} />
        </Modal>
      )}

      <div className="chip-scroll mb-3">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={`chip ${status === f.key ? "active" : ""}`}
            onClick={() => setSearchParams(f.key ? { status: f.key } : {})}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="row g-2 mb-3">
        <div className="col-9">
          <div className="search-box">
            <i className="bi bi-search"></i>
            <input className="form-control" value={text} onChange={(e) => setText(e.target.value)} placeholder="Name, roll no., book, code" />
          </div>
        </div>
        <div className="col-3">
          <input
            type="number"
            min={1}
            className="form-control h-100"
            value={batch}
            onChange={(e) => setBatch(e.target.value)}
            placeholder="Batch"
            aria-label="Batch"
          />
        </div>
      </div>

      {loading ? (
        <SkeletonList count={5} />
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : reservations.length === 0 ? (
        <EmptyState icon="bi-clipboard" title="No reservations" text="Nothing matches these filters." />
      ) : (
        <>
          <p className="small text-secondary mb-2">{reservations.length} results</p>

          {/* Laptop: table */}
          <div className="app-card d-none d-md-block overflow-hidden">
            <div className="table-responsive">
              <table className="table admin-table mb-0">
                <thead>
                  <tr>
                    <th className="ps-3">Student</th>
                    <th>Book</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Fine</th>
                    <th className="text-end pe-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.map((r) => (
                    <tr key={r._id}>
                      <td className="ps-3">
                        <div className="fw-semibold">{r.student ? r.student.name : "Deleted student"}</div>
                        {r.student && (
                          <div className="small text-secondary">
                            {r.student.rollNumber} · Batch {r.student.batch}
                          </div>
                        )}
                      </td>
                      <td style={{ maxWidth: 260 }}>
                        <div className="text-truncate">{r.book ? r.book.title : "Deleted book"}</div>
                        {r.status === "reserved" && r.pickupCode && <div className="small text-secondary">Code {r.pickupCode}</div>}
                      </td>
                      <td>
                        <StatusBadge status={r.status} overdue={r.isOverdue} />
                      </td>
                      <td className="small text-secondary text-nowrap">{dateInfo(r)}</td>
                      <td className={`small fw-semibold ${r.fineDue > 0 ? "text-danger" : "text-success"}`}>{fineText(r)}</td>
                      <td className="text-end pe-3">
                        <div className="d-inline-flex gap-2">{actions(r)}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Phone: cards */}
          <div className="d-md-none d-flex flex-column gap-3">
            {reservations.map((r) => (
              <div key={r._id} className="app-card p-3">
                <div className="d-flex justify-content-between align-items-start gap-2">
                  <div className="overflow-hidden">
                    <div className="fw-semibold text-truncate">{r.book ? r.book.title : "Deleted book"}</div>
                    <div className="small">{r.student ? r.student.name : "Deleted student"}</div>
                    {r.student && (
                      <div className="small text-secondary">
                        {r.student.rollNumber} · Batch {r.student.batch}
                      </div>
                    )}
                  </div>
                  <StatusBadge status={r.status} overdue={r.isOverdue} />
                </div>
                <div className="small text-secondary mt-2">
                  {dateInfo(r)}
                  {r.status === "reserved" && r.pickupCode && ` · Code ${r.pickupCode}`}
                  {fineText(r) && <span className={`fw-semibold ms-1 ${r.fineDue > 0 ? "text-danger" : "text-success"}`}>· Fine {fineText(r)}</span>}
                </div>
                {actions(r) && <div className="d-flex gap-2 mt-3">{actions(r)}</div>}
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
