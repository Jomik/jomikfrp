export interface Listener<A> {
  notify(value: A): void;
}

export abstract class Target<A> {
  protected listeners: Set<Listener<A>> = new Set();

  subscribe(listener: Listener<A>) {
    this.listeners.add(listener);
  }

  unsubscribe(listener: Listener<A>): void {
    this.listeners.delete(listener);
  }

  protected notifyChildren(value: A) {
    this.listeners.forEach((l) => l.notify(value));
  }
}

