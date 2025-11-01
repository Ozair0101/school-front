import React from 'react';
import { render, screen } from '@testing-library/react';
import Timer from '../components/Timer';

describe('Timer', () => {
  it('renders without crashing', () => {
    render(<Timer initialTime={60} />);
    expect(screen.getByText('01:00')).toBeInTheDocument();
  });

  it('formats time correctly', () => {
    const { rerender } = render(<Timer initialTime={3661} />);
    expect(screen.getByText('01:01:01')).toBeInTheDocument();
    
    rerender(<Timer initialTime={125} />);
    expect(screen.getByText('02:05')).toBeInTheDocument();
  });
});