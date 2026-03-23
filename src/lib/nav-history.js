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
    navigate(-1);
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
    // Push a sentinel state so the first back press fires popstate instead of
    // immediately closing the app / going to the browser's previous page.
    window.history.pushState({ navGuard: true }, "");

    const handler = () => {
      if (canGoBack()) {
        // Navigate within the app and re-push the sentinel so the next press
        // is also caught.
        goBack(navigate);
        window.history.pushState({ navGuard: true }, "");
      }
      // If no history in stack, let the OS handle it (app minimise / exit).
    };

    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, [navigate]);
}