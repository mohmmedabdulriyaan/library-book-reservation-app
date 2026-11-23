// Star rating: <Stars value={4.5} /> shows the stars,
// <StarPicker value={rating} onChange={setRating} /> lets a student pick 1-5.

export default function Stars({ value = 0, className = "" }) {
  return (
    <span className={`stars ${className}`} aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const icon = value >= n ? "bi-star-fill" : value >= n - 0.5 ? "bi-star-half" : "bi-star";
        return <i key={n} className={`bi ${icon}`}></i>;
      })}
    </span>
  );
}

const LABELS = ["", "Poor", "Okay", "Good", "Very good", "Excellent"];

export function StarPicker({ value, onChange }) {
  return (
    <div className="d-flex align-items-center gap-2">
      <div className="star-picker" role="radiogroup" aria-label="Your rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            type="button"
            key={n}
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            className={value >= n ? "on" : ""}
            onClick={() => onChange(n)}
          >
            <i className={`bi ${value >= n ? "bi-star-fill" : "bi-star"}`}></i>
          </button>
        ))}
      </div>
      {value > 0 && <span className="small text-secondary">{LABELS[value]}</span>}
    </div>
  );
}
