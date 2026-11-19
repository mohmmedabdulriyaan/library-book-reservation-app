// Grey shapes shown while data is loading

export function SkeletonBlock({ width = "100%", height = 14, className = "", style }) {
  return <div className={`skeleton ${className}`} style={{ width, height, ...style }}></div>;
}

// A list of card-shaped placeholders
export function SkeletonList({ count = 4, grid = false }) {
  const items = Array.from({ length: count });
  const card = (i) => (
    <div key={i} className={grid ? "col-12 col-md-6 col-xl-4" : ""}>
      <div className="app-card p-3 d-flex gap-3 align-items-center">
        <SkeletonBlock width={60} height={80} style={{ borderRadius: 10, flexShrink: 0 }} />
        <div className="flex-grow-1">
          <SkeletonBlock width="70%" height={16} className="mb-2" />
          <SkeletonBlock width="45%" height={12} className="mb-3" />
          <SkeletonBlock width="35%" height={20} style={{ borderRadius: 999 }} />
        </div>
      </div>
    </div>
  );
  return grid ? <div className="row g-3">{items.map((_, i) => card(i))}</div> : <div className="d-flex flex-column gap-3">{items.map((_, i) => card(i))}</div>;
}

export function SkeletonStats({ count = 3, col = "col-4" }) {
  return (
    <div className="row g-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={col}>
          <div className="app-card stat-card">
            <SkeletonBlock width={40} height={40} className="mb-3" style={{ borderRadius: 12 }} />
            <SkeletonBlock width="50%" height={22} className="mb-2" />
            <SkeletonBlock width="70%" height={12} />
          </div>
        </div>
      ))}
    </div>
  );
}
