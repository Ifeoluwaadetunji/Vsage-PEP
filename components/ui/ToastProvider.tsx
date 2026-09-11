"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import styles from "./ToastBanner.module.css";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toast: (options: Omit<ToastMessage, "id">) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

const ToastBanner = ({
  toast,
  onClose,
}: {
  toast: ToastMessage;
  onClose: (id: string) => void;
}) => {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = React.useCallback(() => {
    setIsClosing(true);
    setTimeout(() => onClose(toast.id), 200); // match animation duration
  }, [onClose, toast.id]);

  React.useEffect(() => {
    if (toast.duration !== 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, toast.duration || 5000);
      return () => clearTimeout(timer);
    }
  }, [toast, handleClose]);

  const getIcon = () => {
    switch (toast.type) {
      case "success": return <CheckCircle className={`${styles.icon} ${styles.iconSuccess}`} />;
      case "error": return <AlertCircle className={`${styles.icon} ${styles.iconError}`} />;
      case "warning": return <AlertTriangle className={`${styles.icon} ${styles.iconWarning}`} />;
      case "info":
      default: return <Info className={`${styles.icon} ${styles.iconInfo}`} />;
    }
  };

  return (
    <div className={`${styles.toast} ${styles[toast.type]} ${isClosing ? styles.closing : ""}`}>
      {getIcon()}
      <div className={styles.content}>
        <div className={styles.title}>{toast.title}</div>
        {toast.message && <div className={styles.message}>{toast.message}</div>}
      </div>
      <button onClick={handleClose} className={styles.closeButton} aria-label="Close toast">
        <X size={16} />
      </button>
      {toast.duration !== 0 && (
        <div
          className={styles.progressBar}
          style={{ animation: `shrink ${toast.duration || 5000}ms linear forwards` }}
        />
      )}
      <style jsx>{`
        @keyframes shrink {
          from { transform: scaleX(1); }
          to { transform: scaleX(0); }
        }
      `}</style>
    </div>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((options: Omit<ToastMessage, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, ...options }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className={styles.toastContainer}>
        {toasts.map((t) => (
          <ToastBanner key={t.id} toast={t} onClose={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};
