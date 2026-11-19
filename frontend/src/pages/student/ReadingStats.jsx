// Reading stats: how much the student reads, favourite category, streak and badge
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { getErrorMessage } from "../../api/axios";
import { SkeletonStats } from "../../components/Skeleton";
import { formatDate } from "../../utils/format";

const LEVELS = {
  Beginner: { icon: "bi-emoji-smile", text: "Borrow 3 books to become a Bookworm." },
  Bookworm: { icon: "bi-book-half", text: "Borrow 10 books to become a Scholar." },
  Scholar: { icon: "bi-mortarboard", text: "Top reader! Keep the streak going." },
};

export default function ReadingStats() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/reservations/stats")
      .then(({ data }) => setStats(data))
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  if (error) return <div className="alert alert-danger">{error}</div>;

  const maxMonth = stats ? Math.max(1, ...stats.months.map((m) => m.count)) : 1;
  const maxCat = stats && stats.categories[0] ? stats.categories[0].count : 1;
  const level = stats ? LEVELS[stats.level] : null;

  return (
    <div className="mx-auto" style={{ maxWidth: 720 }}>
      <h1 className="page-title">Reading stats</h1>
      <p className="page-sub">Your reading journey at the library.</p>

      {!stats ? (
        <SkeletonStats count={4} col="col-6" />
      ) : (
        <>
          {/* Level badge */}
          <div className="home-hero mb-3">
            <div className="d-flex align-items-center gap-3">
              <span className="level-badge">
                <i className={`bi ${level.icon}`}></i>
              </span>
              <div>
                <div className="small opacity-75">Your reader level</div>
                <div className="h4 fw-bold mb-0">{stats.level}</div>
                <div className="small opacity-75">{level.text}</div>
              </div>
            </div>
          </div>

          <div className="row g-2 g-md-3 mb-3">
            {[
              { label: "Books borrowed", value: stats.totalBorrowed, icon: "bi-journal-bookmark", tint: "tint-primary" },
              { label: `Read in ${new Date().getFullYear()}`, value: stats.readThisYear, icon: "bi-check2-circle", tint: "tint-success" },
              { label: "Month streak", value: `${stats.streak} 🔥`, icon: "bi-lightning", tint: "tint-warning" },
              { label: "Returned on time", value: `${stats.onTimeRate}%`, icon: "bi-clock-history", tint: "tint-info" },
            ].map((s) => (
              <div key={s.label} className="col-6 col-md-3">
                <div className="app-card stat-card h-100">
                  <span className={`stat-icon ${s.tint}`}>
                    <i className={`bi ${s.icon}`}></i>
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div className="stat-value">{s.value}</div>
                    <div className="stat-label">{s.label}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="row g-3">
            {/* Last 6 months */}
            <div className="col-md-6">
              <div className="app-card p-3 h-100">
                <h2 className="h6 fw-bold mb-3">Books borrowed (last 6 months)</h2>
                <div className="month-chart">
                  {stats.months.map((m) => (
                    <div key={m.label} className="month-col">
                      <span className="month-val">{m.count || ""}</span>
                      <div className="month-bar" style={{ height: `${(m.count / maxMonth) * 100}%` }}></div>
                      <span className="month-label">{m.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Categories */}
            <div className="col-md-6">
              <div className="app-card p-3 h-100">
                <h2 className="h6 fw-bold mb-1">Favourite category</h2>
                <p className="text-primary fw-semibold mb-3">{stats.favouriteCategory || "Borrow a book to find out"}</p>
                {stats.categories.slice(0, 5).map((c) => (
                  <div key={c.category} className="mb-2">
                    <div className="d-flex justify-content-between small">
                      <span>{c.category}</span>
                      <span className="fw-semibold">{c.count}</span>
                    </div>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${(c.count / maxCat) * 100}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recently finished */}
          <div className="app-card mt-3">
            <div className="p-3 pb-2 d-flex justify-content-between align-items-center">
              <h2 className="h6 fw-bold mb-0">Recently finished</h2>
              {stats.finesPaid > 0 && <span className="small text-secondary">Fines paid: Rs {stats.finesPaid}</span>}
            </div>
            {stats.recent.length === 0 ? (
              <p className="text-secondary small px-3 pb-3 mb-0">
                Books you return will show here. <Link to="/search">Find a book</Link>
              </p>
            ) : (
              stats.recent.map((r) => (
                <div key={r._id} className="list-row">
                  <i className="bi bi-check2-circle text-success"></i>
                  <span className="flex-grow-1 text-truncate">{r.title}</span>
                  <span className="small text-secondary text-nowrap">{formatDate(r.returnedAt)}</span>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
