import { Behavior } from "./behavior";
import { Future } from "./future";
import { Stream } from "./stream";

export interface Listener<A> {
  notify(value: A): void;
}

export interface ListenerTarget<A> {
  subscribe(listener: Listener<A>): void;

  unsubscribe(listener: Listener<A>): void;
}

export type Reactive<A> = Behavior<A> | Future<A> | Stream<A>;

export type Id<T extends object> = {} & { [P in keyof T]: T[P] };
export type Remap<
  A extends Record<string, any>,
  B extends Record<string, keyof A>
> = Id<{ [K in keyof B]: A[B[K]] }>;

