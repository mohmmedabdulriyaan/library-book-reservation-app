import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { getErrorMessage } from "../../api/axios";
import { useToast } from "../../context/ToastContext";
import BookCover from "../../components/BookCover";
import StatusBadge from "../../components/StatusBadge";
import EmptyState from "../../components/EmptyState";
import PickupCode from "../../components/PickupCode";
import { SkeletonList } from "../../components/Skeleton";
import { daysUntil, dueText, formatDate } from "../../utils/format";


export default function MyReservations() {
  const toast = useToast();
  const [reservations, setReservations] = useState([]);
  const [waitlist, setWaitlist] = useState([]);
  const [totalFineDue, setTotalFineDue] = useState(0);
  const [limit, setLimit] = useState(3); // books this student can hold (set by the admin for each batch)
  const [tab, setTab] = useState("current");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmId, setConfirmId] = useState(null); // which card is asking "Cancel?"
  const [busyId, setBusyId] = useState(null);

  const load = () => {
    Promise.all([api.get("/reservations/my"), api.get("/waitlist/my")])
      .then(([resRes, waitRes]) => {
        setReservations(resRes.data.reservations);
        setTotalFineDue(resRes.data.totalFineDue);
        if (resRes.data.limit) setLimit(resRes.data.limit);
        setWaitlist(waitRes.data.waitlist);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  // Runs an action (cancel / renew / leave) and reloads the list
  const runAction = async (id, request, successMessage) => {
    setBusyId(id);
    try {
      const { data } = await request();
      toast.success(successMessage || data.message);
      setConfirmId(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const current = reservations.filter((r) => r.status === "reserved" || r.status === "issued");
  const history = reservations.filter((r) => !["reserved", "issued"].includes(r.status));

  const tabs = [
    { key: "current", label: "Current", count: current.length },
    { key: "waitlist", label: "Waitlist", count: waitlist.length },
    { key: "history", label: "History", count: history.length },
  ];

  const renderReservation = (r) => (
    <div key={r._id} className="app-card p-3">
      <div className="d-flex gap-3">
        {r.book ? (
          <Link to={`/books/${r.book._id}`}>
            <BookCover book={r.book} style={{ width: 60, fontSize: "1.3rem" }} />
          </Link>
        ) : (
          <div className="book-cover" style={{ width: 60, background: "#9ca3af" }}>
            <i className="bi bi-book"></i>
          </div>
        )}

        <div className="flex-grow-1 overflow-hidden">
          <div className="d-flex align-items-start justify-content-between gap-2">
            <div className="fw-semibold text-truncate-2">{r.book ? r.book.title : "Book removed"}</div>
            <StatusBadge status={r.status} overdue={r.isOverdue} />
          </div>
          {r.book && <div className="small text-secondary text-truncate">{r.book.author}</div>}

          <div className="small mt-2">
            {r.status === "reserved" && (
              <span className={daysUntil(r.pickupBy) <= 0 ? "text-warning fw-semibold" : "text-secondary"}>
                <i className="bi bi-clock me-1"></i>
                Collect by {formatDate(r.pickupBy)}, or it will be released
              </span>
            )}
            {r.status === "issued" && (
              <span
                className={
                  r.isOverdue ? "text-danger fw-semibold" : daysUntil(r.dueDate) <= 2 ? "text-warning fw-semibold" : "text-secondary"
                }
              >
                <i className="bi bi-calendar-event me-1"></i>
                {dueText(r.dueDate)} · return by {formatDate(r.dueDate)}
              </span>
            )}
            {r.status === "returned" && <span className="text-secondary">Returned on {formatDate(r.returnedAt)}</span>}
            {r.status === "cancelled" && <span className="text-secondary">Cancelled on {formatDate(r.cancelledAt)}</span>}
            {r.status === "expired" && (
              <span className="text-secondary">Not collected in time · expired on {formatDate(r.expiredAt)}</span>
            )}
          </div>

          {r.fine > 0 && (
            <div className={`small mt-1 fw-semibold ${r.fineDue > 0 ? "text-danger" : "text-success"}`}>
              <i className="bi bi-cash-coin me-1"></i>
              {r.fineDue > 0 ? `Fine: Rs ${r.fine}${r.status === "issued" ? " (growing daily)" : " (pay at library)"}` : `Fine Rs ${r.fine} paid`}
            </div>
          )}
        </div>
      </div>

      {r.status === "reserved" && (
        <div className="mt-3">
          <PickupCode code={r.pickupCode} pickupBy={r.pickupBy} bookTitle={r.book ? r.book.title : ""} />
        </div>
      )}

      {r.status === "reserved" && (
        <div className="mt-3 pt-3 border-top">
          {confirmId === r._id ? (
            <div className="d-flex align-items-center gap-2">
              <span className="small fw-semibold me-auto">Cancel it?</span>
              <button className="btn btn-light btn-sm text-nowrap" onClick={() => setConfirmId(null)}>
                Keep it
              </button>
              <button
                className="btn btn-danger btn-sm text-nowrap"
                disabled={busyId === r._id}
                onClick={() => runAction(r._id, () => api.put(`/reservations/${r._id}/cancel`), "Reservation cancelled")}
              >
                {busyId === r._id ? <span className="spinner-border spinner-border-sm"></span> : "Yes, cancel"}
              </button>
            </div>
          ) : (
            <button className="btn btn-light btn-sm text-danger w-100" onClick={() => setConfirmId(r._id)}>
              <i className="bi bi-x-circle me-1"></i>Cancel reservation
            </button>
          )}
        </div>
      )}

      {r.status === "issued" && (
        <div className="mt-3 pt-3 border-top">
          {r.canRenew ? (
            <button
              className="btn btn-soft btn-sm w-100"
              disabled={busyId === r._id}
              onClick={() => runAction(r._id, () => api.put(`/reservations/${r._id}/renew`))}
            >
              {busyId === r._id ? (
                <span className="spinner-border spinner-border-sm"></span>
              ) : (
                <>
                  <i className="bi bi-arrow-repeat me-1"></i>Renew for 7 more days
                </>
              )}
            </button>
          ) : (
            <div className="small text-secondary text-center">
              <i className="bi bi-info-circle me-1"></i>
              {r.isOverdue
                ? "Overdue books cannot be renewed. Please return it."
                : r.renewCount > 0
                ? "Already renewed once"
                : "Cannot renew: other students are waiting for this book"}
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderWait = (w) => (
    <div key={w._id} className="app-card p-3 d-flex gap-3 align-items-center">
      {w.book && (
        <Link to={`/books/${w.book._id}`}>
          <BookCover book={w.book} style={{ width: 52, fontSize: "1.1rem" }} />
        </Link>
      )}
      <div className="flex-grow-1 overflow-hidden">
        <div className="fw-semibold text-truncate">{w.book ? w.book.title : "Book removed"}</div>
        <div className="small text-secondary">
          You are <strong>#{w.position}</strong> in line · joined {formatDate(w.createdAt)}
        </div>
      </div>
      <button
        className="btn btn-light btn-sm text-danger text-nowrap"
        disabled={busyId === w._id}
        onClick={() => runAction(w._id, () => api.delete(`/waitlist/${w._id}`), "Removed from the waitlist")}
      >
        Leave
      </button>
    </div>
  );

  const list = tab === "current" ? current : tab === "history" ? history : waitlist;

  return (
    <div className="mx-auto" style={{ maxWidth: 720 }}>
      <h1 className="page-title">My books</h1>
      <p className="page-sub">
        You are holding <strong>{current.length}</strong> of {limit} books.
      </p>

      {totalFineDue > 0 && (
        <div className="alert alert-danger d-flex align-items-center gap-2 py-2">
          <i className="bi bi-cash-coin"></i>
          <span>
            You have <strong>Rs {totalFineDue}</strong> in late fines. Please pay at the library.
          </span>
        </div>
      )}

      <div className="seg mb-3">
        {tabs.map((t) => (
          <button key={t.key} className={tab === t.key ? "active" : ""} onClick={() => setTab(t.key)}>
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {loading ? (
        <SkeletonList count={3} />
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : list.length === 0 ? (
        tab === "current" ? (
          <EmptyState icon="bi-bookmark" title="No books right now" text="Find a book you like and reserve it.">
            <Link to="/search" className="btn btn-primary btn-sm">
              Browse books
            </Link>
          </EmptyState>
        ) : tab === "waitlist" ? (
          <EmptyState
            icon="bi-hourglass-split"
            tint="tint-warning"
            title="Not waiting for any book"
            text="When a book has no copies left, tap Join waitlist on its page."
          />
        ) : (
          <EmptyState icon="bi-clock-history" tint="tint-info" title="No history yet" text="Returned, cancelled and expired books show here." />
        )
      ) : (
        <div className="d-flex flex-column gap-3">{tab === "waitlist" ? list.map(renderWait) : list.map(renderReservation)}</div>
      )}
    </div>
  );
}
