// Light / dark mode. The choice is saved so it stays after a refresh.
export const getTheme = () => {
  try {
    const saved = localStorage.getItem("theme");
    if (saved) return saved;
  } catch (e) {
    // localStorage not available
  }
  return "dark"; // the app starts in the premium dark theme
};

export const applyTheme = (theme) => {
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.setAttribute("data-bs-theme", theme); // Bootstrap's own dark mode
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", theme === "dark" ? "#0f1118" : "#ffffff");
  try {
    localStorage.setItem("theme", theme);
  } catch (e) {
    // ignore
  }
};
