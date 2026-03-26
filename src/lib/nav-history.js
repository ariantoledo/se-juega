import { useState, useEffect } from "react";

// ─── Navigation Stack ────────────────────────────────────────────────────────
// Module-level singleton — no Context/Provider needed.
// Restored from sessionStorage on load so context survives page reloads.
const STORAGE_KEY = "__sejuega_nav_stack";

function loadStack() {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveStack(stack) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stack));
  } catch {}
}

let _stack = loadStack();
let _direction = "forward";
const _listeners = new Set();

function emit() {
  _listeners.forEach((fn) => fn(_direction));
}

/** Push a path onto the stack. Called automatically by the Layout on location changes. */
export function pushPath(fullPath) {
  if (_stack[_stack.length - 1] !== fullPath) {
    _stack.push(fullPath);
    saveStack(_stack);
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
    saveStack(_stack);
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
 *
 * Strategy:
 * - A sentinel history entry is pushed and continuously re-pushed after every
 *   popstate so the browser can NEVER exit the SPA.
 * - When our internal stack has history we navigate back within the app.
 * - When already at the root ("/") with no back-stack we silently stay — the
 *   app is never exited, not even via a navigate("/") call.
 * - React Router creates new browser-history entries on every navigate(); we
 *   re-push the sentinel inside each popstate handler so it always sits on top.
 *
 * Call once in the root Layout component.
 */
export function useAndroidBackHandler(navigate) {
  useEffect(() => {
    // Detect if we're returning from an external redirect (e.g. payment gateway).
    // External pages won't have our __sejuega state marker, so we restore gracefully.
    const currentState = window.history.state;
    const isExternalReturn = !currentState?.__sejuega;

    if (isExternalReturn) {
      // Clear the stale nav stack — external pages break our history chain.
      _stack = [window.location.pathname + window.location.search];
      saveStack(_stack);
    }

    // Replace any stale entry with a tagged one, then push our sentinel on top.
    // Result: [tagged-current, sentinel]  — popstate from sentinel lands on tagged-current.
    window.history.replaceState({ __sejuega: true }, "", window.location.href);
    window.history.pushState({ __sejuega: true, sentinel: true }, "", window.location.href);

    // Guard against re-entrant popstate calls (can happen after external redirects).
    let _handling = false;

    const handlePopState = () => {
      if (_handling) return;
      _handling = true;

      // Immediately restore the sentinel so the browser never navigates further back.
      window.history.pushState({ __sejuega: true, sentinel: true }, "", window.location.href);

      const isAtRoot = window.location.pathname === "/" && !window.location.search;

      if (canGoBack()) {
        goBack(navigate);
      } else if (!isAtRoot) {
        _direction = "back";
        emit();
        _stack = ["/"];
        saveStack(_stack);
        navigate("/", { replace: true });
      }
      // If already at root with no history: do nothing — stay silently on home.

      setTimeout(() => { _handling = false; }, 100);
    };

    // Legacy custom event (Capacitor / WebView bridge)
    const handleCustomBack = () => handlePopState();

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("androidBackPressed", handleCustomBack);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("androidBackPressed", handleCustomBack);
    };
  }, [navigate]);
}