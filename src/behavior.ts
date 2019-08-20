import { Listener } from "./common";
import { Stream } from "./stream";

type MapBehaviorArray<A> = { [k in keyof A]: Behavior<A[k]> };

export abstract class Behavior<A> {
  abstract at(): A;

  static of<A>(value: A): Behavior<A> {
    return new ConstantBehavior(value);
  }

  flatMap<B>(fn: (a: A) => Behavior<B>): Behavior<B> {
    return new FlatMapBehavior(this, fn);
  }

  map<B>(fn: (a: A) => B): Behavior<B> {
    return this.flatMap((a) => Behavior.of(fn(a)));
  }

  flatten<B>(this: Behavior<Behavior<B>>): Behavior<B> {
    return this.flatMap((a) => a);
  }

  static from<A>(fn: () => A): Behavior<A> {
    return Behavior.of<A>(undefined as any).map(fn);
  }

  ap<B>(fn: Behavior<(a: A) => B>): Behavior<B> {
    return this.flatMap((a) => fn.map((f) => f(a)));
  }

  static lift<A extends any[], B>(
    fn: (...args: A) => B,
    ...args: MapBehaviorArray<A>
  ): Behavior<B> {
    return args
      .reduce(
        (previous, current) =>
          previous.flatMap((p) => current.map((c) => [...p, c])),
        Behavior.of([])
      )
      .map((a) => fn(...a));
  }

  static accumulateFromStream<A, B>(
    stream: Stream<A>,
    fn: (accum: B, current: A) => B,
    initial: B
  ): Behavior<Behavior<B>> {
    return Behavior.from(
      () => new AccumulateFromStreamBehavior(stream, fn, initial)
    );
  }
}

class ConstantBehavior<A> extends Behavior<A> {
  constructor(private readonly value: A) {
    super();
  }

  at(): A {
    return this.value;
  }
}

class FlatMapBehavior<A, B> extends Behavior<B> {
  constructor(
    private readonly parent: Behavior<A>,
    private readonly fn: (a: A) => Behavior<B>
  ) {
    super();
  }
  at(): B {
    return this.fn(this.parent.at()).at();
  }
}

class AccumulateFromStreamBehavior<A, B> extends Behavior<B>
  implements Listener<A> {
  private last: B;

  constructor(
    private readonly parent: Stream<A>,
    private readonly fn: (accum: B, current: A) => B,
    initial: B
  ) {
    super();
    this.last = initial;
    this.parent.subscribe(this);
  }

  notify(value: A): void {
    this.last = this.fn(this.last, value);
  }

  at(): B {
    return this.last;
  }
}

