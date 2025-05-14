import { useEffect, useCallback, RefObject } from 'react';

type KeyHandler = (event: KeyboardEvent) => void;

interface KeyConfig {
  [key: string]: KeyHandler;
}

/**
 * A hook to manage keyboard navigation and shortcuts
 * 
 * @param keyConfig - Object mapping key names to handler functions
 * @param ref - Optional ref to element that should receive the keyboard events
 * @param deps - Dependencies array for the effect
 * @param active - Whether the keyboard navigation is active
 */
function useKeyboardNavigation(
  keyConfig: KeyConfig,
  ref?: RefObject<HTMLElement>,
  deps: React.DependencyList = [],
  active: boolean = true
): void {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't capture key events when inside inputs/textareas unless specifically enabled for that element
    if (
      !active ||
      ((!ref || !ref.current || !ref.current.contains(event.target as Node)) &&
        ['INPUT', 'TEXTAREA', 'SELECT'].includes((event.target as HTMLElement).tagName))
    ) {
      return;
    }

    const key = event.key.toLowerCase();
    const handler = keyConfig[key];

    if (handler) {
      // Only call handler if no modifier keys are pressed (unless the handler needs them)
      // This is to avoid conflicts with browser shortcuts
      handler(event);
    }
  }, [keyConfig, ref, active]);

  useEffect(() => {
    if (!active) return;

    // If a ref is provided, add the listener to that element
    // Otherwise add it to the document
    const targetElement = ref?.current || document;
    
    targetElement.addEventListener('keydown', handleKeyDown as EventListener);
    
    return () => {
      targetElement.removeEventListener('keydown', handleKeyDown as EventListener);
    };
  }, [handleKeyDown, ref, active, ...deps]);
}

/**
 * A hook specifically for handling arrow key navigation within a collection of elements
 * 
 * @param containerRef - Reference to the container element
 * @param selector - CSS selector for the focusable items
 * @param active - Whether the navigation is active
 * @param onEscape - Optional callback for when Escape key is pressed
 * @param onSelect - Optional callback for when Enter key is pressed
 */
export function useArrowKeyNavigation(
  containerRef: RefObject<HTMLElement>,
  selector: string = 'button, [href], [tabindex]:not([tabindex="-1"])',
  active: boolean = true,
  onEscape?: () => void,
  onSelect?: (element: HTMLElement) => void
): void {
  const handleNav = useCallback((event: KeyboardEvent) => {
    if (!containerRef.current) return;
    
    const focusableElements = Array.from(
      containerRef.current.querySelectorAll<HTMLElement>(selector)
    ).filter(el => el.tabIndex !== -1 && !el.hasAttribute('disabled'));
    
    if (focusableElements.length === 0) return;
    
    // Find the index of the currently focused element
    const currentIndex = focusableElements.findIndex(
      el => el === document.activeElement
    );
    
    let nextIndex: number;
    
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % focusableElements.length;
        focusableElements[nextIndex].focus();
        break;
        
      case 'ArrowUp':
        event.preventDefault();
        nextIndex = currentIndex < 0 ? focusableElements.length - 1 : 
          (currentIndex - 1 + focusableElements.length) % focusableElements.length;
        focusableElements[nextIndex].focus();
        break;
        
      case 'Home':
        event.preventDefault();
        focusableElements[0].focus();
        break;
        
      case 'End':
        event.preventDefault();
        focusableElements[focusableElements.length - 1].focus();
        break;
        
      case 'Escape':
        if (onEscape) {
          event.preventDefault();
          onEscape();
        }
        break;
        
      case 'Enter':
      case ' ':
        if (onSelect && document.activeElement && focusableElements.includes(document.activeElement as HTMLElement)) {
          event.preventDefault();
          onSelect(document.activeElement as HTMLElement);
        }
        break;
        
      default:
        // Handle typeahead - finding items that start with the pressed character
        if (event.key.length === 1 && /[a-z0-9]/i.test(event.key)) {
          const char = event.key.toLowerCase();
          const matchingElements = focusableElements.filter(el => {
            const text = el.textContent?.trim().toLowerCase() || '';
            return text.startsWith(char);
          });
          
          if (matchingElements.length > 0) {
            // Find the first matching element after the current one
            const startIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % focusableElements.length;
            let matchIndex = -1;
            
            // Try to find a match after the current position
            for (let i = startIndex; i < focusableElements.length; i++) {
              if (matchingElements.includes(focusableElements[i])) {
                matchIndex = i;
                break;
              }
            }
            
            // If no match found after current position, start from beginning
            if (matchIndex === -1 && startIndex > 0) {
              for (let i = 0; i < startIndex; i++) {
                if (matchingElements.includes(focusableElements[i])) {
                  matchIndex = i;
                  break;
                }
              }
            }
            
            if (matchIndex !== -1) {
              event.preventDefault();
              focusableElements[matchIndex].focus();
            }
          }
        }
        break;
    }
  }, [containerRef, selector, onEscape, onSelect]);

  useKeyboardNavigation(
    {
      arrowdown: handleNav,
      arrowup: handleNav,
      home: handleNav,
      end: handleNav,
      escape: handleNav,
      enter: handleNav,
      ' ': handleNav,
      // All alphanumeric keys for typeahead
      ...Object.fromEntries(
        'abcdefghijklmnopqrstuvwxyz0123456789'.split('').map(
          char => [char, handleNav]
        )
      )
    },
    containerRef,
    [handleNav],
    active
  );
}

export default useKeyboardNavigation; 