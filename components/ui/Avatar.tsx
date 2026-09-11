import React from "react";
import styles from "./Avatar.module.css";
import { User } from "lucide-react";

interface AvatarProps {
  src?: string | null;
  fallback?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ src, fallback, size = "md", className = "" }) => {
  const [error, setError] = React.useState(false);
  
  return (
    <div className={`${styles.avatar} ${styles[size]} ${className}`}>
      {src && !error ? (
        <img src={src} alt="Avatar" onError={() => setError(true)} />
      ) : fallback ? (
        <span className={styles.fallback}>{fallback.substring(0, 2).toUpperCase()}</span>
      ) : (
        <User size={size === "sm" ? 14 : size === "md" ? 20 : 24} />
      )}
    </div>
  );
};
