import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface TooltipProps {
  content: React.ReactNode;
  children?: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  maxWidth?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  maxWidth = '280px',
}) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <span 
      className="tooltip-wrapper"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
      onClick={() => setIsVisible(!isVisible)}
      role="tooltip"
    >
      {children || (
        <span className="tooltip-trigger-icon" aria-label="Help Information">
          <HelpCircle size={14} />
        </span>
      )}

      {isVisible && (
        <span 
          className={`tooltip-bubble tooltip-${position}`}
          style={{ maxWidth }}
        >
          {content}
          <span className="tooltip-arrow" />
        </span>
      )}
    </span>
  );
};
