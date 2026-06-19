import '@testing-library/jest-dom';

vi.mock('next/router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
    events: { on: vi.fn(), off: vi.fn(), emit: vi.fn() },
  }),
}));
