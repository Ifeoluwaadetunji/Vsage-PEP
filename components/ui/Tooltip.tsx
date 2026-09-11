import React from "react";
import styles from "./Tooltip.module.css";

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({ 
  children, 
  content, 
  position = "top",
  className = "" 
}) => {
  return (
    <div className={`${styles.tooltipContainer} ${className}`}>
      {children}
      <div className={`${styles.tooltip} ${styles[position]}`} role="tooltip">
        {content}
      </div>
    </div>
  );
};
