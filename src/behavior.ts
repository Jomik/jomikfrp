export abstract class Behavior<A> {
  abstract at(): A;

  static of<A>(value: A): Behavior<A> {
    return new ConstantBehavior(value);
  }

  static from<A>(fn: () => A): Behavior<A> {
    return new FunctionBehavior(fn);
  }

  static lift<A extends any[], B>(
    fn: (...args: A) => B,
    ...args: MapBehaviorArray<A>
  ): Behavior<B> {
    return new LiftBehavior(fn, args);
  }

  ap<B>(fn: Behavior<(a: A) => B>): Behavior<B> {
    return new ApBehavior<A, B>(this, fn);
  }

  map<B>(fn: (a: A) => B): Behavior<B> {
    return this.ap(Behavior.of(fn));
  }

  flatten<B>(this: Behavior<Behavior<B>>): Behavior<B> {
    return new FlattenBehavior(this);
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

class FunctionBehavior<A> extends Behavior<A> {
  constructor(private readonly fn: () => A) {
    super();
  }

  at() {
    return this.fn();
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

class ApBehavior<A, B> extends Behavior<B> {
  constructor(
    private readonly parent: Behavior<A>,
    private readonly fn: Behavior<(a: A) => B>
  ) {
    super();
  }

  at(): B {
    return this.fn.at()(this.parent.at());
  }
}

type MapBehaviorArray<A> = { [k in keyof A]: Behavior<A[k]> };

class LiftBehavior<A extends any[], B> extends Behavior<B> {
  constructor(
    private readonly fn: (...args: A) => B,
    private readonly parents: MapBehaviorArray<A>
  ) {
    super();
  }

  at(): B {
    return this.fn(...(this.parents.map((parent) => parent.at()) as any));
  }
}
