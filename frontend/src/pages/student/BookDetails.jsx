import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api, { getErrorMessage } from "../../api/axios";
import { useToast } from "../../context/ToastContext";
import BookCover from "../../components/BookCover";
import StatusBadge from "../../components/StatusBadge";
import Loader from "../../components/Loader";
import PickupCode from "../../components/PickupCode";
import BookReviews from "../../components/BookReviews";
import BookRow from "../../components/BookRow";
import Stars from "../../components/Stars";
import { dueText, formatDate } from "../../utils/format";

export default function BookDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [book, setBook] = useState(null);
  const [myReservation, setMyReservation] = useState(null); // active reservation of this book, if any
  const [myWait, setMyWait] = useState(null); // my waitlist entry for this book, if any
  const [saved, setSaved] = useState(false); // is this book in my wishlist?
  const [hasReturned, setHasReturned] = useState(false); // borrowed and returned before? (then I can review it)
  const [similar, setSimilar] = useState([]); // "You may also like"
  const [loading, setLoading] = useState(true);
  const [reserving, setReserving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.get(`/books/${id}`), api.get("/reservations/my"), api.get("/waitlist/my"), api.get("/wishlist")])
      .then(([bookRes, myRes, waitRes, wishRes]) => {
        setSaved(wishRes.data.books.some((b) => b._id === id));
        setMyWait(waitRes.data.waitlist.find((w) => w.book && w.book._id === id) || null);
        setBook(bookRes.data.book);
        const active = myRes.data.reservations.find(
          (r) => r.book && r.book._id === id && (r.status === "reserved" || r.status === "issued")
        );
        setMyReservation(active || null);
        setHasReturned(myRes.data.reservations.some((r) => r.book && r.book._id === id && r.status === "returned"));
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));

    // Suggestions load on their own (the page still works if this fails)
    setSimilar([]);
    api
      .get(`/books/${id}/similar`)
      .then(({ data }) => setSimilar(data.books))
      .catch(() => {});
  }, [id]);

  const handleReserve = async () => {
    setReserving(true);
    try {
      const { data } = await api.post("/reservations", { bookId: id });
      toast.success(data.message);
      setMyReservation(data.reservation);
      setBook({ ...book, availableCopies: book.availableCopies - 1 });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setReserving(false);
    }
  };

  const handleJoinWaitlist = async () => {
    setReserving(true);
    try {
      const { data } = await api.post("/waitlist", { bookId: id });
      toast.success(data.message);
      setMyWait(data.entry);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setReserving(false);
    }
  };

  const handleLeaveWaitlist = async () => {
    try {
      await api.delete(`/waitlist/${myWait._id}`);
      toast.info("Removed from the waitlist");
      setMyWait(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const toggleWishlist = async () => {
    try {
      if (saved) {
        await api.delete(`/wishlist/${id}`);
        setSaved(false);
        toast.info("Removed from your wishlist");
      } else {
        const { data } = await api.post("/wishlist", { bookId: id });
        setSaved(true);
        toast.success(data.message);
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (loading) return <Loader />;
  if (error) return <div className="alert alert-danger">{error}</div>;

  const available = book.availableCopies > 0;

  return (
    <div className="mx-auto" style={{ maxWidth: 720 }}>
      <button className="back-link btn btn-link p-0" onClick={() => navigate(-1)}>
        <i className="bi bi-arrow-left"></i> Back
      </button>

      <div className="row g-4 align-items-start">
        <div className="col-md-4 text-center">
          <BookCover book={book} className="detail-cover" eager />
        </div>

        <div className="col-md-8">
          <div className="d-flex align-items-center justify-content-between gap-2">
            <span className="badge-soft tint-primary">{book.category}</span>
            <button
              className={`btn btn-sm wish-btn ${saved ? "saved" : ""}`}
              onClick={toggleWishlist}
              aria-pressed={saved}
            >
              <i className={`bi ${saved ? "bi-heart-fill" : "bi-heart"} me-1`}></i>
              {saved ? "Saved" : "Save"}
            </button>
          </div>
          <h1 className="h4 fw-bold mt-2 mb-1">{book.title}</h1>
          <p className="text-secondary mb-2">{book.author}</p>
          {book.ratingCount > 0 ? (
            <a href="#reviews" className="d-inline-flex align-items-center gap-2 small text-decoration-none mb-3">
              <Stars value={book.ratingAvg} />
              <span className="fw-semibold text-body">{book.ratingAvg.toFixed(1)}</span>
              <span className="text-secondary">
                ({book.ratingCount} review{book.ratingCount > 1 ? "s" : ""})
              </span>
            </a>
          ) : (
            <div className="small text-secondary mb-3">No ratings yet</div>
          )}

          <div className="app-card info-grid py-3 mb-3">
            <div>
              <div className={`val ${available ? "text-success" : "text-danger"}`}>{book.availableCopies}</div>
              <div className="lbl">Available</div>
            </div>
            <div>
              <div className="val">{book.totalCopies}</div>
              <div className="lbl">Total copies</div>
            </div>
            <div>
              <div className="val">{book.totalCopies - book.availableCopies}</div>
              <div className="lbl">Borrowed</div>
            </div>
          </div>

          {book.description && (
            <>
              <h2 className="h6 fw-bold">About this book</h2>
              <p className="text-secondary">{book.description}</p>
            </>
          )}

          {book.isbn && (
            <p className="small text-secondary">
              ISBN <span className="fw-semibold text-body">{book.isbn}</span>
            </p>
          )}

          <div className="sticky-action mt-4">
            {myReservation ? (
              <>
              <div className="app-card p-3 d-flex align-items-center gap-3">
                <span className="stat-icon tint-success mb-0">
                  <i className="bi bi-check2-circle"></i>
                </span>
                <div className="flex-grow-1">
                  <div className="d-flex align-items-center gap-2">
                    <span className="fw-semibold">Your book</span>
                    <StatusBadge status={myReservation.status} overdue={myReservation.isOverdue} />
                  </div>
                  <div className="small text-secondary">
                    {myReservation.status === "issued"
                      ? dueText(myReservation.dueDate)
                      : `Reserved on ${formatDate(myReservation.reservedAt)}`}
                  </div>
                </div>
                <Link to="/reservations" className="btn btn-soft btn-sm text-nowrap">
                  My books
                </Link>
              </div>
              {myReservation.status === "reserved" && (
                <div className="mt-3">
                  <PickupCode code={myReservation.pickupCode} pickupBy={myReservation.pickupBy} bookTitle={book.title} />
                </div>
              )}
              </>
            ) : available ? (
              <button className="btn btn-primary w-100 py-3" disabled={reserving} onClick={handleReserve}>
                {reserving ? (
                  <span className="spinner-border spinner-border-sm"></span>
                ) : (
                  <>
                    <i className="bi bi-bookmark-plus me-2"></i>Reserve this book
                  </>
                )}
              </button>
            ) : myWait ? (
              <div className="app-card p-3 d-flex align-items-center gap-3">
                <span className="stat-icon tint-warning mb-0">
                  <i className="bi bi-hourglass-split"></i>
                </span>
                <div className="flex-grow-1">
                  <div className="fw-semibold">You are #{myWait.position} in the waitlist</div>
                  <div className="small text-secondary">We will reserve it for you when a copy comes back.</div>
                </div>
                <button className="btn btn-light btn-sm text-danger text-nowrap" onClick={handleLeaveWaitlist}>
                  Leave
                </button>
              </div>
            ) : (
              <>
                <button className="btn btn-dark w-100 py-3" disabled={reserving} onClick={handleJoinWaitlist}>
                  {reserving ? (
                    <span className="spinner-border spinner-border-sm"></span>
                  ) : (
                    <>
                      <i className="bi bi-bell me-2"></i>Join waitlist
                    </>
                  )}
                </button>
                <p className="small text-secondary text-center mt-2 mb-0">
                  All copies are taken. Join the waitlist and it will be reserved for you automatically.
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      <div id="reviews">
        <BookReviews
          bookId={id}
          canReview={hasReturned}
          onRatingChange={(ratingAvg, ratingCount) =>
            setBook((b) => (b && (b.ratingAvg !== ratingAvg || b.ratingCount !== ratingCount) ? { ...b, ratingAvg, ratingCount } : b))
          }
        />
      </div>

      {similar.length > 0 && (
        <>
          <div className="section-head">
            <h2>You may also like</h2>
          </div>
          <BookRow books={similar} />
        </>
      )}
    </div>
  );
}
