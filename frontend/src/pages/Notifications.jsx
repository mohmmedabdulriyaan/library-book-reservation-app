// The alerts list (same screen for students and admin)
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { getErrorMessage } from "../api/axios";
import EmptyState from "../components/EmptyState";
import { SkeletonBlock } from "../components/Skeleton";

const ICONS = {
  ready: { icon: "bi-bookmark-check", tint: "tint-success" },
  waitlist: { icon: "bi-hourglass-split", tint: "tint-success" },
  due_soon: { icon: "bi-calendar-event", tint: "tint-warning" },
  overdue: { icon: "bi-alarm", tint: "tint-danger" },
  expired: { icon: "bi-x-circle", tint: "tint-warning" },
  new_reservation: { icon: "bi-bookmark-plus", tint: "tint-primary" },
  info: { icon: "bi-info-circle", tint: "tint-info" },
  announcement: { icon: "bi-megaphone", tint: "tint-info" },
  request: { icon: "bi-lightbulb", tint: "tint-warning" },
};

// "5 min ago", "2 h ago", "3 days ago"
const timeAgo = (date) => {
  const minutes = Math.floor((Date.now() - new Date(date)) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
};

export default function Notifications() {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/notifications")
      .then(({ data }) => setList(data.notifications))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const openOne = async (n) => {
    if (!n.read) {
      setList((items) => items.map((x) => (x._id === n._id ? { ...x, read: true } : x)));
      api.put(`/notifications/${n._id}/read`).catch(() => {});
    }
    if (n.link) navigate(n.link);
  };

  const markAll = async () => {
    await api.put("/notifications/read-all");
    setList((items) => items.map((x) => ({ ...x, read: true })));
  };

  const unread = list.filter((n) => !n.read).length;

  return (
    <div className="mx-auto" style={{ maxWidth: 640 }}>
      <div className="d-flex align-items-center justify-content-between">
        <h1 className="page-title">Notifications</h1>
        {unread > 0 && (
          <button className="btn btn-soft btn-sm" onClick={markAll}>
            Mark all read
          </button>
        )}
      </div>
      <p className="page-sub">{unread > 0 ? `${unread} unread` : "You're all caught up."}</p>

      {loading ? (
        <div className="app-card p-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="d-flex gap-3 mb-3">
              <SkeletonBlock width={40} height={40} style={{ borderRadius: 12 }} />
              <div className="flex-grow-1">
                <SkeletonBlock width="50%" className="mb-2" />
                <SkeletonBlock width="90%" height={12} />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : list.length === 0 ? (
        <EmptyState icon="bi-bell" title="No notifications" text="Alerts about your books will show up here." />
      ) : (
        <div className="app-card overflow-hidden">
          {list.map((n) => {
            const style = ICONS[n.type] || ICONS.info;
            return (
              <button key={n._id} className={`notif-row ${n.read ? "" : "unread"}`} onClick={() => openOne(n)}>
                <span className={`stat-icon mb-0 ${style.tint}`} style={{ flexShrink: 0 }}>
                  <i className={`bi ${style.icon}`}></i>
                </span>
                <span className="flex-grow-1">
                  <span className="d-flex justify-content-between gap-2">
                    <span className="fw-semibold">{n.title}</span>
                    <span className="small text-secondary text-nowrap">{timeAgo(n.createdAt)}</span>
                  </span>
                  <span className="d-block small text-secondary">{n.message}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
