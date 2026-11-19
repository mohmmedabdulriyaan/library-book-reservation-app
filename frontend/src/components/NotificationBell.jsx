// Bell icon with a red number of unread alerts. Checks every minute.
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import api from "../api/axios";

export default function NotificationBell({ to }) {
  const [unread, setUnread] = useState(0);
  const location = useLocation();

  useEffect(() => {
    const load = () =>
      api
        .get("/notifications/unread-count")
        .then(({ data }) => setUnread(data.unread))
        .catch(() => {});
    load();
    const timer = setInterval(load, 60 * 1000);
    return () => clearInterval(timer);
  }, [location.pathname]); // also refresh when the page changes

  return (
    <Link to={to} className="icon-btn" aria-label={`Notifications (${unread} unread)`}>
      <i className="bi bi-bell"></i>
      {unread > 0 && <span className="dot">{unread > 9 ? "9+" : unread}</span>}
    </Link>
  );
}
