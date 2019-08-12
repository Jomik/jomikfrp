export interface Listener<A> {
  notify(value: A): void;
}

