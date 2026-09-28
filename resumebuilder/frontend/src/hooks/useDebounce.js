/**
 * Developer context for resumebuilder/frontend/src/hooks/useDebounce.js.
 * Purpose: encapsulate the reusable Resume Builder use Debounce state/effect behavior.
 * Why here: product-specific interaction logic stays in the product; check active imports before treating a hook as a runtime path.
 */
import { useState, useEffect } from "react";

export function useDebounce(value, delay = 300) {
  // Keep returning the previous stable value until the user has stopped
  // changing `value` for the requested delay.
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Each new value resets the timer; cleanup prevents an older timer from
    // publishing stale input after a newer change has arrived.
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
