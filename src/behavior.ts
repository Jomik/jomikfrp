type MapBehaviorArray<A> = { [k in keyof A]: Behavior<A[k]> };

export abstract class Behavior<A> {
  abstract at(): A;

  static of<A>(value: A): Behavior<A> {
    return new ConstantBehavior(value);
  }

  map<B>(fn: (a: A) => B): Behavior<B> {
    return new MapBehavior(this, fn);
  }

  flatten<B>(this: Behavior<Behavior<B>>): Behavior<B> {
    return new FlattenBehavior(this);
  }

  static from<A>(fn: () => A): Behavior<A> {
    return Behavior.of<A>(undefined).map(fn);
  }

  flatMap<B>(fn: (a: A) => Behavior<B>): Behavior<B> {
    return this.map(fn).flatten();
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
}

class ConstantBehavior<A> extends Behavior<A> {
  constructor(private readonly value: A) {
    super();
  }

  at(): A {
    return this.value;
  }
}

class MapBehavior<A, B> extends Behavior<B> {
  constructor(
    private readonly parent: Behavior<A>,
    private readonly fn: (a: A) => B
  ) {
    super();
  }
  at(): B {
    return this.fn(this.parent.at());
  }
}

class FlattenBehavior<A> extends Behavior<A> {
  constructor(private readonly parent: Behavior<Behavior<A>>) {
    super();
  }

  at(): A {
    return this.parent.at().at();
  }
}

