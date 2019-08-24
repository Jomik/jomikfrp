import { Behavior } from "./behavior";
import { Future } from "./future";
import { Stream } from "./stream";

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

export type Reactive<A> = Behavior<A> | Future<A> | Stream<A>;

export type Id<T extends object> = {} & { [P in keyof T]: T[P] };
export type Remap<
  A extends Record<string, any>,
  B extends Record<string, keyof A>
> = Id<{ [K in keyof B]: A[B[K]] }>;

