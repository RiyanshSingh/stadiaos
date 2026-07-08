import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { MobileFrame } from '../MobileFrame';
import { describe, it, expect } from 'vitest';

describe('MobileFrame', () => {
  it('renders children within the frame', () => {
    render(
      <BrowserRouter>
        <MobileFrame>
          <div data-testid="test-child">Test Content</div>
        </MobileFrame>
      </BrowserRouter>
    );
    
    expect(screen.getByTestId('test-child')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });
});
