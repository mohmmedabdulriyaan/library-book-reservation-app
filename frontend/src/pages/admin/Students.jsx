import { useEffect, useState } from "react";
import api, { getErrorMessage } from "../../api/axios";
import EmptyState from "../../components/EmptyState";
import Modal from "../../components/Modal";
import Loader from "../../components/Loader";
import StatusBadge from "../../components/StatusBadge";
import { SkeletonList } from "../../components/Skeleton";
import { getInitials } from "../../layouts/AppLayout";
import { formatDate } from "../../utils/format";

// One student's details and history (inside a Modal)
function StudentDetails({ id }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/admin/students/${id}`)
      .then(({ data }) => setData(data))
      .catch((err) => setError(getErrorMessage(err)));
  }, [id]);

  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!data) return <Loader />;

  const { student, reservations, totalFineDue } = data;
  return (
    <>
      <div className="d-flex align-items-center gap-3 mb-3">
        <span className="avatar lg" style={{ width: 56, height: 56, fontSize: "1.2rem" }}>
          {getInitials(student.name)}
        </span>
        <div>
          <div className="fw-bold">{student.name}</div>
          <div className="small text-secondary">
            {student.rollNumber} · Batch {student.batch}
          </div>
          {student.email && <div className="small text-secondary">{student.email}</div>}
        </div>
      </div>

      <div className="app-card info-grid py-3 mb-3">
        <div>
          <div className="val">{reservations.filter((r) => ["reserved", "issued"].includes(r.status)).length}</div>
          <div className="lbl">Holding now</div>
        </div>
        <div>
          <div className="val">{reservations.filter((r) => ["issued", "returned"].includes(r.status)).length}</div>
          <div className="lbl">Borrowed</div>
        </div>
        <div>
          <div className={`val ${totalFineDue > 0 ? "text-danger" : ""}`}>Rs {totalFineDue}</div>
          <div className="lbl">Fine due</div>
        </div>
      </div>

      <h3 className="h6 fw-bold">History</h3>
      {reservations.length === 0 ? (
        <p className="small text-secondary mb-0">This student has not reserved any book yet.</p>
      ) : (
        <div className="app-card">
          {reservations.map((r) => (
            <div key={r._id} className="list-row">
              <div className="flex-grow-1 overflow-hidden">
                <div className="fw-semibold text-truncate">{r.book ? r.book.title : "Deleted book"}</div>
                <div className="small text-secondary">
                  Reserved {formatDate(r.reservedAt)}
                  {r.dueDate && ` · due ${formatDate(r.dueDate)}`}
                </div>
              </div>
              <StatusBadge status={r.status} overdue={r.isOverdue} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default function Students() {
  const [students, setStudents] = useState([]);
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");
  const [batch, setBatch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(text.trim()), 300);
    return () => clearTimeout(timer);
  }, [text]);

  useEffect(() => {
    const params = {};
    if (search) params.search = search;
    if (batch) params.batch = batch;
    api
      .get("/admin/students", { params })
      .then(({ data }) => setStudents(data.students))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [search, batch]);

  return (
    <>
      <h1 className="page-title">Students</h1>
      <p className="page-sub">{students.length} students signed up.</p>

      <div className="row g-2 mb-3">
        <div className="col-9">
          <div className="search-box">
            <i className="bi bi-search"></i>
            <input className="form-control" value={text} onChange={(e) => setText(e.target.value)} placeholder="Name or roll no." />
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
      ) : students.length === 0 ? (
        <EmptyState icon="bi-people" title="No students found" text="Students appear here after they sign up in the app." />
      ) : (
        <div className="row g-3">
          {students.map((s) => (
            <div key={s._id} className="col-12 col-md-6 col-xl-4">
              <button className="app-card book-row w-100 border-0 text-start" onClick={() => setOpenId(s._id)}>
                <span className="avatar">{getInitials(s.name)}</span>
                <div className="flex-grow-1 overflow-hidden">
                  <div className="fw-semibold text-truncate">{s.name}</div>
                  <div className="small text-secondary">
                    {s.rollNumber} · Batch {s.batch}
                  </div>
                  <div className="small mt-1">
                    <span className={s.activeBooks > 0 ? "text-primary fw-semibold" : "text-secondary"}>
                      {s.activeBooks} holding
                    </span>
                    <span className="text-secondary"> · {s.totalBorrowed} borrowed</span>
                  </div>
                </div>
                <i className="bi bi-chevron-right text-secondary"></i>
              </button>
            </div>
          ))}
        </div>
      )}

      {openId && (
        <Modal title="Student details" onClose={() => setOpenId(null)}>
          <StudentDetails id={openId} />
        </Modal>
      )}
    </>
  );
}
