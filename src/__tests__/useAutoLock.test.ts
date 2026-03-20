import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useAutoLock } from "../hooks/useAutoLock";

describe("useAutoLock", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("calls onLock after the timeout expires", () => {
    const onLock = vi.fn();
    renderHook(() => useAutoLock(1000, onLock));

    vi.advanceTimersByTime(1000);

    expect(onLock).toHaveBeenCalledTimes(1);
  });

  it("does not call onLock before the timeout", () => {
    const onLock = vi.fn();
    renderHook(() => useAutoLock(1000, onLock));

    vi.advanceTimersByTime(999);

    expect(onLock).not.toHaveBeenCalled();
  });

  it("resets the timer when user activity occurs", () => {
    const onLock = vi.fn();
    renderHook(() => useAutoLock(1000, onLock));

    vi.advanceTimersByTime(800);
    window.dispatchEvent(new MouseEvent("mousemove"));

    vi.advanceTimersByTime(800);
    expect(onLock).not.toHaveBeenCalled();

    vi.advanceTimersByTime(200);
    expect(onLock).toHaveBeenCalledTimes(1);
  });

  it("clears the timer and listeners on unmount", () => {
    const onLock = vi.fn();
    const { unmount } = renderHook(() => useAutoLock(1000, onLock));

    unmount();
    vi.advanceTimersByTime(1000);

    expect(onLock).not.toHaveBeenCalled();
  });
});
