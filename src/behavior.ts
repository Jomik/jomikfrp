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
    return Behavior.of<A>(undefined).map(fn);
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

  static latestFromStream<A>(
    stream: Stream<A>,
    initial: A
  ): Behavior<Behavior<A>> {
    return Behavior.from(() => new LatestFromStreamBehavior(stream, initial));
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

class LatestFromStreamBehavior<A> extends Behavior<A> implements Listener<A> {
  private last: A;

  constructor(private readonly parent: Stream<A>, initial: A) {
    super();
    this.last = initial;
    this.parent.subscribe(this);
  }

  notify(value: A): void {
    this.last = value;
  }

  at(): A {
    return this.last;
  }
}
