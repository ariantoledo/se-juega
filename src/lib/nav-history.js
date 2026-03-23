import { useState, useEffect } from "react";

// Module-level singleton — tracks navigation direction without a Provider/Context pattern.
let _direction = "forward";
const _listeners = new Set();

function emit() {
  _listeners.forEach((fn) => fn(_direction));
}

/** Call instead of navigate(-1) to trigger a "back" slide transition. */
export function goBack(navigate) {
  _direction = "back";
  emit();
  navigate(-1);
}

/** Call instead of navigate(path) to trigger a "forward" slide transition. */
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