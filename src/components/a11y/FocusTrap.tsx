import React, { useEffect, useRef } from 'react';

interface FocusTrapProps {
  children: React.ReactNode;
  isActive?: boolean;
  focusFirst?: boolean;
  returnFocus?: boolean;
  /**
   * CSS selector for elements that should be focusable.
   * Default selects common interactive elements.
   */
  focusableSelector?: string;
}

/**
 * FocusTrap component for managing focus within a modal or dialog
 * 
 * This component ensures keyboard navigation is trapped within the component when active
 * and manages focus restoration when the component is unmounted.
 */
const FocusTrap: React.FC<FocusTrapProps> = ({
  children,
  isActive = true,
  focusFirst = true,
  returnFocus = true,
  focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Store the previously focused element when component mounts
  useEffect(() => {
    if (isActive && returnFocus) {
      previousActiveElement.current = document.activeElement as HTMLElement;
    }
    
    return () => {
      // Return focus to the element that had focus before the trap was activated
      if (isActive && returnFocus && previousActiveElement.current) {
        try {
          previousActiveElement.current.focus();
        } catch (e) {
          console.warn('Failed to return focus:', e);
        }
      }
    };
  }, [isActive, returnFocus]);

  // Focus on first element when component mounts
  useEffect(() => {
    if (!isActive || !focusFirst || !containerRef.current) return;
    
    const focusableElements = containerRef.current.querySelectorAll<HTMLElement>(focusableSelector);
    
    if (focusableElements.length > 0) {
      // Focus the first element that should receive focus
      requestAnimationFrame(() => {
        focusableElements[0].focus();
      });
    } else {
      // If no focusable elements, set focus to the container itself
      containerRef.current.focus();
    }
  }, [isActive, focusFirst, focusableSelector]);

  // Handle keyboard trap
  useEffect(() => {
    if (!isActive || !containerRef.current) return;
    
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      
      const focusableElements = Array.from(
        containerRef.current?.querySelectorAll<HTMLElement>(focusableSelector) || []
      ).filter(el => el.tabIndex !== -1);
      
      if (focusableElements.length === 0) return;
      
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      
      // Shift + Tab: going backwards
      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          event.preventDefault();
        }
      } 
      // Tab: going forwards
      else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          event.preventDefault();
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive, focusableSelector]);

  return (
    <div 
      ref={containerRef} 
      tabIndex={-1} 
      aria-modal={isActive}
      role="dialog"
      style={{ outline: 'none' }}
    >
      {children}
    </div>
  );
};

export default FocusTrap; 