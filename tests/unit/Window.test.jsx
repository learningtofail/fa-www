import { fireEvent, render, screen } from "@testing-library/react";
import Window from "../../src/components/Window.jsx";

function setup(overrides = {}) {
  const handlers = {
    onFocus: vi.fn(),
    onClose: vi.fn(),
    onMinimize: vi.fn(),
    onMaximize: vi.fn(),
    onMove: vi.fn(),
    onResize: vi.fn(),
  };
  const view = render(
    <Window
      id="w"
      title="demo"
      x={100}
      y={80}
      width={400}
      height={300}
      zIndex={1}
      noPadding={false}
      {...handlers}
      {...overrides}
    >
      <p>body</p>
    </Window>,
  );
  const titlebar = /** @type {HTMLElement} */ (view.container.querySelector(".win-titlebar"));
  const handle = /** @type {HTMLElement} */ (view.container.querySelector(".win-resize-handle"));
  return { ...handlers, titlebar, handle, ...view };
}

const pointer = (type, init) => ({ pointerId: 1, pointerType: "touch", button: 0, ...init, type });

describe("Window pointer interaction (D7)", () => {
  beforeEach(() => {
    vi.stubGlobal("innerWidth", 1000);
    vi.stubGlobal("innerHeight", 600);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("drags with pointer events, including touch, and focuses the window", () => {
    const { titlebar, onMove, onFocus } = setup();
    fireEvent.pointerDown(titlebar, pointer("pointerdown", { clientX: 10, clientY: 10 }));
    fireEvent.pointerMove(titlebar, pointer("pointermove", { clientX: 60, clientY: 40 }));
    expect(onFocus).toHaveBeenCalledWith("w");
    expect(onMove).toHaveBeenLastCalledWith("w", 150, 110);
  });

  it("clamps a drag to the viewport", () => {
    const { titlebar, onMove } = setup();
    fireEvent.pointerDown(titlebar, pointer("pointerdown", { clientX: 0, clientY: 0 }));
    fireEvent.pointerMove(titlebar, pointer("pointermove", { clientX: 9000, clientY: 9000 }));
    expect(onMove).toHaveBeenLastCalledWith("w", 600, 300);
    fireEvent.pointerMove(titlebar, pointer("pointermove", { clientX: -9000, clientY: -9000 }));
    expect(onMove).toHaveBeenLastCalledWith("w", 0, 0);
  });

  it("stops moving after pointer up and ignores other pointers", () => {
    const { titlebar, onMove } = setup();
    fireEvent.pointerDown(titlebar, pointer("pointerdown", { clientX: 0, clientY: 0 }));
    fireEvent.pointerMove(titlebar, pointer("pointermove", { pointerId: 2, clientX: 50, clientY: 50 }));
    expect(onMove).not.toHaveBeenCalled();
    fireEvent.pointerUp(titlebar, pointer("pointerup", { clientX: 5, clientY: 5 }));
    fireEvent.pointerMove(titlebar, pointer("pointermove", { clientX: 50, clientY: 50 }));
    expect(onMove).not.toHaveBeenCalled();
  });

  it("does not start a drag from the control buttons or a secondary button", () => {
    const { titlebar, onMove } = setup();
    const close = screen.getByRole("button", { name: "Close demo" });
    fireEvent.pointerDown(close, pointer("pointerdown", { clientX: 0, clientY: 0 }));
    fireEvent.pointerMove(titlebar, pointer("pointermove", { clientX: 50, clientY: 50 }));
    fireEvent.pointerDown(titlebar, pointer("pointerdown", { button: 2, clientX: 0, clientY: 0 }));
    fireEvent.pointerMove(titlebar, pointer("pointermove", { clientX: 50, clientY: 50 }));
    expect(onMove).not.toHaveBeenCalled();
  });

  it("resizes from the handle with the minimum size and viewport limit applied", () => {
    const { handle, onResize, onMove } = setup();
    fireEvent.pointerDown(handle, pointer("pointerdown", { clientX: 0, clientY: 0 }));
    fireEvent.pointerMove(handle, pointer("pointermove", { clientX: 50, clientY: 20 }));
    expect(onResize).toHaveBeenLastCalledWith("w", 450, 320);
    fireEvent.pointerMove(handle, pointer("pointermove", { clientX: -900, clientY: -900 }));
    expect(onResize).toHaveBeenLastCalledWith("w", 240, 160);
    fireEvent.pointerMove(handle, pointer("pointermove", { clientX: 9000, clientY: 9000 }));
    expect(onResize).toHaveBeenLastCalledWith("w", 900, 520);
    expect(onMove).not.toHaveBeenCalled();
  });

  it("registers no listeners on window, so unmounting mid-drag leaks nothing", () => {
    const add = vi.spyOn(window, "addEventListener");
    const { titlebar, unmount, onMove } = setup();
    fireEvent.pointerDown(titlebar, pointer("pointerdown", { clientX: 0, clientY: 0 }));
    unmount();
    fireEvent.pointerMove(window, pointer("pointermove", { clientX: 50, clientY: 50 }));
    expect(onMove).not.toHaveBeenCalled();
    expect(add.mock.calls.filter(([type]) => /pointer|mouse/.test(String(type)))).toEqual([]);
    add.mockRestore();
  });

  it("captures the pointer on drag start when the browser supports it", () => {
    const { titlebar } = setup();
    titlebar.setPointerCapture = vi.fn();
    fireEvent.pointerDown(titlebar, pointer("pointerdown", { clientX: 0, clientY: 0 }));
    expect(titlebar.setPointerCapture).toHaveBeenCalledWith(1);
  });
});
