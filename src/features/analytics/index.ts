/**
 * The single analytics adapter (D-023): a permanent no-op in the beta.
 *
 * The beta collects no usage data and asks for no usage consent, so there is
 * no provider, no consent state and no way to switch sending on. Call sites
 * keep calling `track(...)`; it does nothing. Bringing analytics back needs a
 * new Board decision, a privacy-notice change and a new adapter.
 */
import type { EventName, EventProps } from "./events";

export type { EventName, EventProps } from "./events";

export interface AnalyticsAdapter {
  send(name: EventName, payload: unknown): void;
}

export const noopAdapter: AnalyticsAdapter = { send() {} };

export const track: <K extends EventName>(name: K, props: EventProps[K]) => void = () => {
  /* intentionally empty: nothing is sent (D-023) */
};
