import React from "react";
import styles from "./Spinner.module.css";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = "md", className = "" }) => {
  return (
    <span className={`${styles.spinner} ${styles[size]} ${className}`} aria-label="Loading..." />
  );
};
