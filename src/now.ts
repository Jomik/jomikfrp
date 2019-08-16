type MapNowArray<A> = { [k in keyof A]: Now<A[k]> };

export abstract class Now<A> {
  abstract run(): A;

  static of<A>(value: A): Now<A> {
    return new ConstantNow(value);
  }

  map<B>(fn: (a: A) => B): Now<B> {
    return new MapNow(this, fn);
  }

  flatten<B>(this: Now<Now<B>>): Now<B> {
    return new FlattenNow(this);
  }

  flatMap<B>(fn: (a: A) => Now<B>): Now<B> {
    return this.map(fn).flatten();
  }

  ap<B>(fn: Now<(a: A) => B>): Now<B> {
    return this.flatMap((a) => fn.map((f) => f(a)));
  }

  static lift<A extends any[], B>(
    fn: (...args: A) => B,
    ...args: MapNowArray<A>
  ): Now<B> {
    return args
      .reduce(
        (previous, current) =>
          previous.flatMap((p) => current.map((c) => [...p, c])),
        Now.of([])
      )
      .map((a) => fn(...a));
  }
}

class ConstantNow<A> extends Now<A> {
  constructor(private readonly value: A) {
    super();
  }

  run(): A {
    return this.value;
  }
}

class MapNow<A, B> extends Now<B> {
  constructor(
    private readonly parent: Now<A>,
    private readonly fn: (a: A) => B
  ) {
    super();
  }

  run(): B {
    return this.fn(this.parent.run());
  }
}

class FlattenNow<A> extends Now<A> {
  constructor(private readonly parent: Now<Now<A>>) {
    super();
  }

  run(): A {
    return this.parent.run().run();
  }
}

