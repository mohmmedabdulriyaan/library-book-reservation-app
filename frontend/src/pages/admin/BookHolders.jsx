// "Who has this book?" — shown inside a Modal on the Books screen
import { useEffect, useState } from "react";
import api, { getErrorMessage } from "../../api/axios";
import StatusBadge from "../../components/StatusBadge";
import Loader from "../../components/Loader";
import { formatDate } from "../../utils/format";

const StudentLine = ({ student }) =>
  student ? (
    <>
      <div className="fw-semibold">{student.name}</div>
      <div className="small text-secondary">
        {student.rollNumber} · Batch {student.batch}
      </div>
    </>
  ) : (
    <div className="text-secondary">Deleted student</div>
  );

export default function BookHolders({ bookId }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/admin/books/${bookId}/reservations`)
      .then(({ data }) => setData(data))
      .catch((err) => setError(getErrorMessage(err)));
  }, [bookId]);

  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!data) return <Loader />;

  return (
    <>
      <p className="text-secondary small">
        {data.book.availableCopies} of {data.book.totalCopies} copies on the shelf
      </p>

      <h3 className="h6 fw-bold">Has it now ({data.current.length})</h3>
      {data.current.length === 0 ? (
        <p className="small text-secondary">Nobody has reserved or taken this book.</p>
      ) : (
        <div className="app-card mb-3">
          {data.current.map((r) => (
            <div key={r._id} className="list-row">
              <div className="flex-grow-1">
                <StudentLine student={r.student} />
                <div className="small text-secondary">
                  {r.status === "issued" ? `Due ${formatDate(r.dueDate)}` : `Code ${r.pickupCode || "-"} · collect by ${formatDate(r.pickupBy)}`}
                </div>
              </div>
              <StatusBadge status={r.status} overdue={r.isOverdue} />
            </div>
          ))}
        </div>
      )}

      <h3 className="h6 fw-bold">Waitlist ({data.waitlist.length})</h3>
      {data.waitlist.length === 0 ? (
        <p className="small text-secondary">No one is waiting.</p>
      ) : (
        <div className="app-card mb-3">
          {data.waitlist.map((w, i) => (
            <div key={w._id} className="list-row">
              <span className="avatar">{i + 1}</span>
              <div className="flex-grow-1">
                <StudentLine student={w.student} />
              </div>
              <span className="small text-secondary">{formatDate(w.createdAt)}</span>
            </div>
          ))}
        </div>
      )}

      <h3 className="h6 fw-bold">History ({data.history.length})</h3>
      {data.history.length === 0 ? (
        <p className="small text-secondary mb-0">No past reservations.</p>
      ) : (
        <div className="app-card">
          {data.history.slice(0, 10).map((r) => (
            <div key={r._id} className="list-row">
              <div className="flex-grow-1">
                <StudentLine student={r.student} />
              </div>
              <StatusBadge status={r.status} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
