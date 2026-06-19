import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ToastProvider, useToast } from '../../components/Toast';

function TestConsumer() {
  const { addToast } = useToast();
  return (
    <div>
      <button onClick={() => addToast('Test message', 'success')}>Show Toast</button>
    </div>
  );
}

describe('Toast component', () => {
  it('renders provider without crashing', () => {
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>
    );
    expect(screen.getByText('Show Toast')).toBeInTheDocument();
  });
});
