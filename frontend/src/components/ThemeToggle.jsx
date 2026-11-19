// Dark mode switch (used on the Profile screens)
import { useState } from "react";
import { applyTheme, getTheme } from "../utils/theme";

export default function ThemeToggle() {
  const [theme, setTheme] = useState(getTheme());

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    applyTheme(next);
    setTheme(next);
  };

  return (
    <div className="list-row">
      <i className={`bi ${theme === "dark" ? "bi-moon-stars-fill" : "bi-sun"} text-primary`}></i>
      <span className="fw-semibold">Dark mode</span>
      <div className="form-check form-switch ms-auto mb-0">
        <input
          className="form-check-input"
          type="checkbox"
          role="switch"
          checked={theme === "dark"}
          onChange={toggle}
          aria-label="Dark mode"
        />
      </div>
    </div>
  );
}
