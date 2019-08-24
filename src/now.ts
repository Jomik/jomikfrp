type MapNowArray<A> = { [k in keyof A]: Now<A[k]> };

const nowType = Symbol("now");

export abstract class Now<A> {
  abstract run(): A;

  frpType = nowType;

  static is(obj: any): obj is Now<any> {
    return "frpType" in obj && obj.frpType === nowType;
  }

  static of<A>(value: A): Now<A> {
    return new ConstantNow(value);
  }

  flatMap<B>(fn: (a: A) => Now<B>): Now<B> {
    return new FlatMapNow(this, fn);
  }

  map<B>(fn: (a: A) => B): Now<B> {
    return this.flatMap((a) => Now.of(fn(a)));
  }

  flatten<B>(this: Now<Now<B>>): Now<B> {
    return this.flatMap((a) => a);
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

class FlatMapNow<A, B> extends Now<B> {
  constructor(
    private readonly parent: Now<A>,
    private readonly fn: (a: A) => Now<B>
  ) {
    super();
  }

  run(): B {
    return this.fn(this.parent.run()).run();
  }
}

