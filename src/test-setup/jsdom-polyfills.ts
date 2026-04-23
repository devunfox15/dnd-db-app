// Polyfills for jsdom: several app dependencies (e.g. @dnd-kit/dom) touch
// browser APIs that jsdom does not implement. Keep these as tiny no-op stubs
// so modules can load during tests.

if (typeof globalThis.ResizeObserver === 'undefined') {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  ;(globalThis as unknown as { ResizeObserver: typeof ResizeObserverStub }).ResizeObserver =
    ResizeObserverStub
}
