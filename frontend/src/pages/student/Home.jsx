import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { getErrorMessage } from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import BookTile from "../../components/BookTile";
import QuickLinks from "../../components/QuickLinks";
import { SkeletonBlock } from "../../components/Skeleton";

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

export default function Home() {
  const { user } = useAuth();
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [myReservations, setMyReservations] = useState([]);
  const [notice, setNotice] = useState(null); // newest announcement (if it is recent)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api.get("/books", { params: { sort: "newest" } }),
      api.get("/books/categories"),
      api.get("/reservations/my"),
    ])
      .then(([booksRes, catRes, myRes]) => {
        setBooks(booksRes.data.books);
        setCategories(catRes.data.categories);
        setMyReservations(myRes.data.reservations);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));

    // Newest library notice from the last 7 days (the page still works if this fails)
    api
      .get("/announcements")
      .then(({ data }) => {
        const latest = data.announcements[0];
        if (latest && Date.now() - new Date(latest.createdAt) < 7 * 24 * 60 * 60 * 1000) setNotice(latest);
      })
      .catch(() => {});
  }, []);

  const reserved = myReservations.filter((r) => r.status === "reserved").length;
  const issued = myReservations.filter((r) => r.status === "issued").length;
  const overdue = myReservations.filter((r) => r.isOverdue).length;
  const availableNow = books.filter((b) => b.availableCopies > 0);

  const stats = [
    { icon: "bi-bookmark", value: reserved, label: "Reserved" },
    { icon: "bi-journal-check", value: issued, label: "With me" },
    { icon: "bi-alarm", value: overdue, label: "Overdue" },
  ];

  return (
    <>
      {/* Greeting + my numbers */}
      <div className="home-hero mb-3">
        <div className="hello">{greeting()},</div>
        <div className="name">{user.name.split(" ")[0]} 👋</div>
        <div className="hero-stats">
          {stats.map((s) => (
            <Link key={s.label} to="/reservations" className="hero-stat">
              <i className={`bi ${s.icon}`}></i>
              <div>
                <div className="v">{loading ? "-" : s.value}</div>
                <div className="l">{s.label}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {notice && (
        <Link to="/announcements" className={`notice-strip mb-3 ${notice.important ? "important" : ""}`}>
          <i className={`bi ${notice.important ? "bi-exclamation-octagon" : "bi-megaphone"}`}></i>
          <span className="flex-grow-1 text-truncate">
            <strong>{notice.title}</strong>
            <span className="d-none d-sm-inline"> · {notice.message}</span>
          </span>
          <i className="bi bi-chevron-right"></i>
        </Link>
      )}

      <QuickLinks
        links={[
          { to: "/library", label: "E-Library", icon: "bi-file-earmark-pdf", tint: "tint-danger" },
          { to: "/wishlist", label: "Wishlist", icon: "bi-heart", tint: "tint-danger" },
          { to: "/stats", label: "My stats", icon: "bi-bar-chart-line", tint: "tint-success" },
          { to: "/requests", label: "Request", icon: "bi-lightbulb", tint: "tint-warning" },
          { to: "/announcements", label: "Notices", icon: "bi-megaphone", tint: "tint-info" },
        ]}
      />

      <Link to="/search" className="app-card d-flex align-items-center gap-2 px-3 py-3 text-decoration-none text-secondary mb-3">
        <i className="bi bi-search"></i>
        <span>Search by title, author or ISBN</span>
      </Link>

      {loading ? (
        <>
          <SkeletonBlock width={140} height={18} className="mt-4 mb-3" />
          <div className="book-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i}>
                <SkeletonBlock height={0} style={{ aspectRatio: "3 / 4", height: "auto", borderRadius: 12 }} />
                <SkeletonBlock width="80%" height={12} className="mt-2" />
              </div>
            ))}
          </div>
        </>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : (
        <>
          <div className="chip-scroll mb-2">
            {categories.map((c) => (
              <Link key={c} to={`/search?category=${encodeURIComponent(c)}`} className="chip text-decoration-none">
                {c}
              </Link>
            ))}
          </div>

          <div className="section-head">
            <h2>New in the library</h2>
            <Link to="/search" className="small fw-semibold text-decoration-none">
              See all
            </Link>
          </div>
          <div className="book-grid">
            {books.slice(0, 12).map((book, i) => (
              <BookTile key={book._id} book={book} eager={i < 9} />
            ))}
          </div>

          <div className="section-head">
            <h2>Available right now</h2>
            <Link to="/search" className="small fw-semibold text-decoration-none">
              See all
            </Link>
          </div>
          <div className="book-grid">
            {availableNow
              .slice()
              .sort((a, b) => b.availableCopies - a.availableCopies)
              .slice(0, 6)
              .map((book) => (
                <BookTile key={book._id} book={book} />
              ))}
          </div>
        </>
      )}
    </>
  );
}
