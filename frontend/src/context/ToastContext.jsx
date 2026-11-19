// Small pop-up messages at the top of the screen.
// Use it in any page:  const toast = useToast();  toast.success("Saved");
import { createContext, useCallback, useContext, useState } from "react";

const ToastContext = createContext(null);

const ICONS = {
  success: "bi-check-circle-fill",
  error: "bi-exclamation-circle-fill",
  info: "bi-info-circle-fill",
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const show = useCallback((message, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts((list) => [...list, { id, message, type }]);
    setTimeout(() => {
      setToasts((list) => list.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const value = {
    success: (msg) => show(msg, "success"),
    error: (msg) => show(msg, "error"),
    info: (msg) => show(msg, "info"),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`app-toast ${t.type}`}>
            <i className={`bi ${ICONS[t.type]}`}></i>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
