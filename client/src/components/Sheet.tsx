import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
}

export const Sheet: React.FC<SheetProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = '480px',
}) => {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="sheet-portal">
      {/* Backdrop */}
      <div 
        className="sheet-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet Content Panel */}
      <div 
        className="sheet-panel"
        style={{ '--sheet-max-width': maxWidth } as React.CSSProperties}
        role="dialog"
        aria-modal="true"
      >
        {/* Mobile Pull Handle Indicator */}
        <div className="sheet-drag-handle-wrap" onClick={onClose}>
          <div className="sheet-drag-handle-pill" />
        </div>

        {/* Sheet Header */}
        <div className="sheet-header">
          <div className="sheet-header-text">
            {title && <h3 className="sheet-title">{title}</h3>}
            {description && <p className="sheet-description">{description}</p>}
          </div>
          <button 
            type="button" 
            className="sheet-close-btn"
            onClick={onClose}
            aria-label="Close Sheet"
          >
            <X size={18} />
          </button>
        </div>

        {/* Sheet Scrollable Body */}
        <div className="sheet-body">
          {children}
        </div>

        {/* Sheet Footer (Optional) */}
        {footer && (
          <div className="sheet-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
