import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../utils/test-utils';

// Simple button component for testing
const Button = ({ 
  onClick, 
  disabled = false, 
  children 
}: { 
  onClick: () => void; 
  disabled?: boolean; 
  children: React.ReactNode 
}) => {
  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      data-testid="test-button"
    >
      {children}
    </button>
  );
};

describe('Button Component', () => {
  it('renders correctly with children', () => {
    render(<Button onClick={() => {}}>Click Me</Button>);
    
    expect(screen.getByTestId('test-button')).toBeInTheDocument();
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);
    
    fireEvent.click(screen.getByTestId('test-button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('respects disabled state', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick} disabled={true}>Click Me</Button>);
    
    const button = screen.getByTestId('test-button');
    expect(button).toBeDisabled();
    
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });
}); 