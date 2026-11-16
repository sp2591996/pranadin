"use client";

import { useEffect, useState } from "react";

/**
 * Read a value that exists only on the device (localStorage, URL, clock)
 * after hydration. The static HTML renders `initial`; the first client
 * effect swaps in the real value. This is the one place we set state from
 * an effect on purpose: the source is outside React and has no subscription.
 */
export function useDeviceValue<T>(read: () => T, initial: T): [T, (v: T) => void] {
  const [v, setV] = useState<T>(initial);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from device storage once (see above)
    setV(read());
    // eslint-disable-next-line react-hooks/exhaustive-deps -- read once on mount
  }, []);
  return [v, setV];
}
