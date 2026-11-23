// Ratings and reviews of one book (shown on the book page).
// Students who returned the book can rate it and write a short review.
import { useEffect, useState } from "react";
import api, { getErrorMessage } from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import Stars, { StarPicker } from "./Stars";
import { formatDate } from "../utils/format";

export default function BookReviews({ bookId, canReview, onRatingChange }) {
  const { user } = useAuth();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [editing, setEditing] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () =>
    api
      .get(`/books/${bookId}/reviews`)
      .then(({ data }) => {
        setData(data);
        onRatingChange && onRatingChange(data.ratingAvg, data.ratingCount);
      })
      .catch(() => setData({ ratingAvg: 0, ratingCount: 0, breakdown: [], reviews: [] }));

  useEffect(() => {
    load();
  }, [bookId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!data) return null;

  const isAdmin = user && user.role === "admin";
  const myReview = !isAdmin && data.reviews.find((r) => r.student && r.student._id === user._id);
  const others = data.reviews.filter((r) => r !== myReview);

  const startEditing = () => {
    setRating(myReview ? myReview.rating : 0);
    setComment(myReview ? myReview.comment : "");
    setEditing(true);
  };

  const save = async (e) => {
    e.preventDefault();
    if (!rating) return toast.error("Tap the stars to pick a rating");
    setSaving(true);
    try {
      const res = await api.post(`/books/${bookId}/reviews`, { rating, comment });
      toast.success(res.data.message);
      setEditing(false);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (review) => {
    if (!window.confirm(isAdmin ? "Delete this review?" : "Delete your review?")) return;
    try {
      await api.delete(`/books/${bookId}/reviews/${review._id}`);
      toast.info("Review deleted");
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const ReviewItem = ({ review, mine }) => (
    <div className="list-row align-items-start">
      <span className="avatar">{review.student ? review.student.name[0].toUpperCase() : "?"}</span>
      <div className="flex-grow-1 overflow-hidden">
        <div className="d-flex align-items-center justify-content-between gap-2">
          <span className="fw-semibold text-truncate">
            {mine ? "You" : review.student ? review.student.name : "Student"}
            {review.student && !mine && <span className="small text-secondary fw-normal"> · Batch {review.student.batch}</span>}
          </span>
          <span className="small text-secondary text-nowrap">{formatDate(review.updatedAt)}</span>
        </div>
        <Stars value={review.rating} className="small" />
        {review.comment && <p className="mb-0 mt-1 small">{review.comment}</p>}
        {(mine || isAdmin) && (
          <div className="mt-1 d-flex gap-3">
            {mine && (
              <button className="btn btn-link btn-sm p-0 text-decoration-none" onClick={startEditing}>
                Edit
              </button>
            )}
            <button className="btn btn-link btn-sm p-0 text-danger text-decoration-none" onClick={() => remove(review)}>
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const max = Math.max(...data.breakdown.map((b) => b.count), 1);

  return (
    <div className="mt-4">
      <h2 className="h6 fw-bold mb-3">Ratings and reviews</h2>

      {data.ratingCount > 0 && (
        <div className="app-card p-3 mb-3 d-flex gap-4 align-items-center">
          <div className="text-center">
            <div className="display-6 fw-bold lh-1">{data.ratingAvg.toFixed(1)}</div>
            <Stars value={data.ratingAvg} className="small" />
            <div className="small text-secondary">
              {data.ratingCount} review{data.ratingCount > 1 ? "s" : ""}
            </div>
          </div>
          <div className="flex-grow-1">
            {data.breakdown.map((b) => (
              <div key={b.stars} className="d-flex align-items-center gap-2 small">
                <span style={{ width: 10 }}>{b.stars}</span>
                <div className="bar-track flex-grow-1" style={{ height: 6 }}>
                  <div className="bar-fill" style={{ width: `${(b.count / max) * 100}%`, background: "var(--star)" }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Write / edit my review */}
      {!isAdmin &&
        (editing ? (
          <form className="app-card p-3 mb-3" onSubmit={save}>
            <div className="fw-semibold mb-2">{myReview ? "Edit your review" : "Rate this book"}</div>
            <StarPicker value={rating} onChange={setRating} />
            <textarea
              className="form-control mt-2"
              rows={3}
              maxLength={500}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What did you like? Was it useful for your studies? (optional)"
            />
            <div className="d-flex gap-2 mt-2">
              <button className="btn btn-primary" disabled={saving}>
                {saving ? <span className="spinner-border spinner-border-sm"></span> : "Post review"}
              </button>
              <button type="button" className="btn btn-light" onClick={() => setEditing(false)}>
                Cancel
              </button>
            </div>
          </form>
        ) : myReview ? null : canReview ? (
          <button className="btn btn-soft w-100 mb-3" onClick={startEditing}>
            <i className="bi bi-star me-2"></i>Rate and review this book
          </button>
        ) : (
          <p className="small text-secondary">You can rate this book after you borrow and return it.</p>
        ))}

      {data.reviews.length === 0 ? (
        <p className="small text-secondary mb-0">No reviews yet.</p>
      ) : (
        <div className="app-card">
          {myReview && !editing && <ReviewItem review={myReview} mine />}
          {others.map((r) => (
            <ReviewItem key={r._id} review={r} />
          ))}
        </div>
      )}
    </div>
  );
}
