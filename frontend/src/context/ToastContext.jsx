import { createContext, useContext, useState, useCallback } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(({ title, message, type = 'warning', duration = 4500 }) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 6);
    const newToast = { id, title, message, type, duration };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const toast = {
    warning: (title, message) => showToast({ title, message, type: 'warning' }),
    error: (title, message) => showToast({ title, message, type: 'error' }),
    success: (title, message) => showToast({ title, message, type: 'success' }),
    info: (title, message) => showToast({ title, message, type: 'info' }),
    show: showToast
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast Render Container */}
      <div className="toast-container" role="region" aria-label="Notifications">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    // Return fallback no-op if used outside provider
    return {
      warning: (title, msg) => console.warn(title, msg),
      error: (title, msg) => console.error(title, msg),
      success: (title, msg) => console.log(title, msg),
      info: (title, msg) => console.info(title, msg),
      show: (opts) => console.log(opts)
    };
  }
  return context;
}

function ToastItem({ toast, onClose }) {
  const { title, message, type, duration } = toast;

  const iconMap = {
    warning: <AlertTriangle size={18} className="toast-icon-warning" />,
    error: <AlertCircle size={18} className="toast-icon-error" />,
    success: <CheckCircle2 size={18} className="toast-icon-success" />,
    info: <Info size={18} className="toast-icon-info" />,
  };

  return (
    <div className={`toast-card toast-${type}`} role="alert">
      <div className="toast-icon-wrapper">
        {iconMap[type] || iconMap.info}
      </div>
      <div className="toast-content">
        {title && <div className="toast-title">{title}</div>}
        <div className="toast-message">{message}</div>
      </div>
      <button
        type="button"
        className="toast-close"
        onClick={onClose}
        aria-label="Dismiss notification"
      >
        <X size={14} />
      </button>
      {duration > 0 && (
        <div
          className="toast-progress"
          style={{ animationDuration: `${duration}ms` }}
        />
      )}
    </div>
  );
}
