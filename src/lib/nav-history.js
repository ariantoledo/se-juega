import { useState, useEffect } from "react";

// ─── Navigation Stack ────────────────────────────────────────────────────────
// Module-level singleton — no Context/Provider needed.
let _stack = [];           // array of full path strings (pathname + search)
let _direction = "forward";
const _listeners = new Set();

function emit() {
  _listeners.forEach((fn) => fn(_direction));
}

/** Push a path onto the stack. Called automatically by the Layout on location changes. */
export function pushPath(fullPath) {
  if (_stack[_stack.length - 1] !== fullPath) {
    _stack.push(fullPath);
  }
}

/** Returns true if there is at least one previous entry to go back to. */
export function canGoBack() {
  return _stack.length > 1;
}

/**
 * Navigate back using the internal stack.
 * Falls back to navigate(-1) if stack is empty (e.g. app opened mid-deep-link).
 */
export function goBack(navigate) {
  _direction = "back";
  emit();
  if (canGoBack()) {
    _stack.pop();
    navigate(_stack[_stack.length - 1], { replace: true });
  } else {
    // Never use navigate(-1) — it would load a stale cached browser entry.
    // Instead go home, which is always the current updated version.
    navigate("/", { replace: true });
  }
}

/**
 * Navigate forward — pushes to browser history and direction stack.
 * Use this instead of navigate(path) when you want the forward slide animation.
 */
export function goForward(navigate, path) {
  _direction = "forward";
  emit();
  navigate(path);
}

/** React hook — returns the current navigation direction ("forward" | "back"). */
export function useNavDirection() {
  const [direction, setDirection] = useState(_direction);
  useEffect(() => {
    _listeners.add(setDirection);
    return () => _listeners.delete(setDirection);
  }, []);
  return direction;
}

/**
 * Hook that intercepts the Android hardware back button (and browser back gesture).
 * When the internal stack has history, it navigates within the app instead of
 * exiting. When at the root with no history, the default OS behavior runs (app exit).
 *
 * Call once in the root Layout component.
 */
export function useAndroidBackHandler(navigate) {
  useEffect(() => {
    // Ensure the browser history stack has exactly one entry at the current URL.
    // This collapses any stale history entries (old cached pages) so the physical
    // back button can never reach them.
    if (window.history.length > 1) {
      window.history.replaceState({ __sejuega: true }, "", window.location.href);
    }
    // Push a sentinel entry so we can catch the popstate before it leaves the app.
    window.history.pushState({ __sejuega: true }, "", window.location.href);

    const handlePopState = (e) => {
      // Immediately push another sentinel so the browser never actually navigates away.
      window.history.pushState({ __sejuega: true }, "", window.location.href);
      // Use our internal stack to go back within the SPA.
      goBack(navigate);
    };

    // Legacy custom event (kept for compatibility)
    const handleCustomBack = () => goBack(navigate);

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("androidBackPressed", handleCustomBack);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("androidBackPressed", handleCustomBack);
    };
  }, [navigate]);
}