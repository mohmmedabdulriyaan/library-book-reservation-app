import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { getErrorMessage } from "../../api/axios";
import StatCard from "../../components/StatCard";
import QuickLinks from "../../components/QuickLinks";
import StatusBadge from "../../components/StatusBadge";
import EmptyState from "../../components/EmptyState";
import { SkeletonStats } from "../../components/Skeleton";
import MonthlyReport from "../../components/MonthlyReport";

// Simple horizontal bar chart made with plain HTML/CSS
function BarChart({ items, emptyText }) {
  if (items.length === 0) return <p className="small text-secondary mb-0">{emptyText}</p>;
  const max = Math.max(...items.map((i) => i.value), 1);
  return items.map((item) => (
    <div key={item.label} className="bar-row">
      <div className="d-flex justify-content-between small mb-1">
        <span className="text-truncate me-2">{item.label}</span>
        <span className="fw-semibold">{item.value}</span>
      </div>
      <div className="bar-track">
        <div className="bar-fill" style={{ width: `${(item.value / max) * 100}%`, background: item.color }}></div>
      </div>
    </div>
  ));
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.get("/admin/stats"), api.get("/admin/reservations")])
      .then(([statsRes, resRes]) => {
        setStats(statsRes.data);
        setRecent(resRes.data.reservations.slice(0, 6));
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <>
        <h1 className="page-title">Dashboard</h1>
        <p className="page-sub">Today at a glance.</p>
        <SkeletonStats count={8} col="col-6 col-md-3" />
      </>
    );
  }
  if (error) return <div className="alert alert-danger">{error}</div>;

  const cards = [
    { icon: "bi-journal-bookmark", tint: "tint-primary", value: stats.totalBooks, label: "Book titles", to: "/admin/books" },
    { icon: "bi-stack", tint: "tint-info", value: `${stats.availableCopies}/${stats.totalCopies}`, label: "Copies on shelf", to: "/admin/books" },
    { icon: "bi-people", tint: "tint-success", value: stats.totalStudents, label: "Students", to: "/admin/students" },
    { icon: "bi-bookmark", tint: "tint-primary", value: stats.reserved, label: "Waiting to collect", to: "/admin/reservations?status=reserved" },
    { icon: "bi-journal-check", tint: "tint-success", value: stats.issued, label: "Issued now", to: "/admin/reservations?status=issued" },
    { icon: "bi-alarm", tint: "tint-danger", value: stats.overdue, label: "Overdue", to: "/admin/reservations?status=overdue" },
    { icon: "bi-hourglass-split", tint: "tint-warning", value: stats.waiting, label: "In waitlists", to: "/admin/books" },
    { icon: "bi-cash-coin", tint: "tint-danger", value: `Rs ${stats.finesDue}`, label: "Fines to collect", to: "/admin/reservations?status=fines" },
  ];

  return (
    <>
      <h1 className="page-title">Dashboard</h1>
      <p className="page-sub">Today at a glance.</p>

      <QuickLinks
        links={[
          { to: "/admin/requests", label: "Requests", icon: "bi-lightbulb", tint: "tint-warning", count: stats.pendingRequests },
          { to: "/admin/library", label: "E-Library", icon: "bi-file-earmark-pdf", tint: "tint-danger" },
          { to: "/admin/announcements", label: "Notices", icon: "bi-megaphone", tint: "tint-info" },
          { to: "/admin/books", label: "Import", icon: "bi-filetype-csv", tint: "tint-success" },
          { to: "/admin/settings", label: "Limits", icon: "bi-sliders", tint: "tint-primary" },
        ]}
      />

      <div className="row g-3">
        {cards.map(({ to, ...card }) => (
          <div key={card.label} className="col-6 col-md-3">
            <Link to={to} className="text-decoration-none text-reset">
              <StatCard {...card} />
            </Link>
          </div>
        ))}
      </div>

      <div className="mt-3">
        <MonthlyReport />
      </div>

      <div className="row g-3 mt-1">
        <div className="col-md-6">
          <div className="app-card p-3 h-100">
            <h2 className="h6 fw-bold mb-3">Most borrowed books</h2>
            <BarChart
              items={stats.topBooks.map((b) => ({ label: b.title, value: b.count, color: b.coverColor }))}
              emptyText="No books have been issued yet."
            />
          </div>
        </div>
        <div className="col-md-6">
          <div className="app-card p-3 h-100">
            <h2 className="h6 fw-bold mb-3">Books borrowed by batch</h2>
            <BarChart items={stats.byBatch.map((b) => ({ label: `Batch ${b.batch}`, value: b.count }))} emptyText="No reservations yet." />
          </div>
        </div>
      </div>

      <div className="section-head">
        <h2>Latest reservations</h2>
        <Link to="/admin/reservations" className="small fw-semibold text-decoration-none">
          See all
        </Link>
      </div>

      {recent.length === 0 ? (
        <EmptyState icon="bi-clipboard" title="No reservations yet" text="When a student reserves a book it will show up here." />
      ) : (
        <div className="app-card">
          {recent.map((r) => (
            <div key={r._id} className="list-row">
              <span className="avatar">{r.student ? r.student.name[0].toUpperCase() : "?"}</span>
              <div className="flex-grow-1 overflow-hidden">
                <div className="fw-semibold text-truncate">{r.book ? r.book.title : "Deleted book"}</div>
                {r.student ? (
                  <>
                    <div className="small text-truncate">{r.student.name}</div>
                    <div className="small text-secondary">
                      {r.student.rollNumber} · Batch {r.student.batch}
                    </div>
                  </>
                ) : (
                  <div className="small text-secondary">Unknown student</div>
                )}
              </div>
              <StatusBadge status={r.status} overdue={r.isOverdue} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
