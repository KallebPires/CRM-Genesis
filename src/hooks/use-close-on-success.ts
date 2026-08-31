import { useState } from "react";

/**
 * Closes a dialog once a pending form submission settles without errors.
 * Uses the React-sanctioned "adjust state during render" pattern instead of
 * an effect (setState-in-effect and ref access during render are both
 * flagged by the hooks linter).
 */
export function useCloseOnSuccess(pending: boolean, hasErrors: boolean, close: () => void) {
  const [submitted, setSubmitted] = useState(false);
  const [prevPending, setPrevPending] = useState(pending);

  if (pending !== prevPending) {
    setPrevPending(pending);
    if (!pending && submitted) {
      setSubmitted(false);
      if (!hasErrors) close();
    }
  }

  return { notifySubmitted: () => setSubmitted(true) };
}
