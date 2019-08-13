export abstract class Behavior<A> {
  abstract at(): A;

  static of<A>(value: A): Behavior<A> {
    return new ConstantBehavior(value);
  }

  static from<A>(fn: () => A): Behavior<A> {
    return new FunctionBehavior(fn);
  }

  map<B>(fn: (a: A) => B): Behavior<B> {
    return new MapBehavior(this, fn);
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

class MapBehavior<A, B> extends Behavior<B> {
  constructor(
    private readonly parent: Behavior<A>,
    private readonly fn: (a: A) => B
  ) {
    super();
  }

  at() {
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

