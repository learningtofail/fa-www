import { renderHook, act } from "@testing-library/react";
import { useIsMobile } from "../../src/hooks/useIsMobile.js";

/** Minimal matchMedia double whose `matches` can be flipped to fire change listeners. */
function installMatchMedia(initialMatches) {
  const listeners = new Set();
  const mql = {
    matches: initialMatches,
    addEventListener: (_event, fn) => listeners.add(fn),
    removeEventListener: (_event, fn) => listeners.delete(fn),
  };
  window.matchMedia = /** @type {any} */ (vi.fn(() => mql));
  return {
    set(matches) {
      mql.matches = matches;
      listeners.forEach((fn) => fn({ matches }));
    },
    listenerCount: () => listeners.size,
  };
}

describe("useIsMobile", () => {
  it("reads the viewport on first render", () => {
    installMatchMedia(true);
    expect(renderHook(() => useIsMobile()).result.current).toBe(true);
  });

  it("follows the viewport live across the breakpoint", () => {
    const media = installMatchMedia(false);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
    act(() => media.set(true));
    expect(result.current).toBe(true);
    act(() => media.set(false));
    expect(result.current).toBe(false);
  });

  it("removes its listener on unmount", () => {
    const media = installMatchMedia(false);
    const { unmount } = renderHook(() => useIsMobile());
    expect(media.listenerCount()).toBe(1);
    unmount();
    expect(media.listenerCount()).toBe(0);
  });
});
