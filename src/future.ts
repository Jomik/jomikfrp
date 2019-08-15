import { Listener } from "./common";

type MapFutureArray<A> = { [k in keyof A]: Future<A[k]> };
const unresolved = Symbol("unresolved_future");
type Unresolved = typeof unresolved;

export class Future<A> {
  private children: Listener<A>[] = [];
  private _value: A | Unresolved = unresolved;
  get value() {
    return this._value;
  }

  subscribe(child: Listener<A>) {
    if (this.value !== unresolved) {
      child.notify(this.value);
    } else if (!this.children.includes(child)) {
      this.children.push(child);
    }
  }

  protected resolve(value: A) {
    if (this.value !== unresolved) {
      throw new Error(
        `A future can not be resolved twice! Already resolved with ${this.value} and now resolved with ${value}.`
      );
    }

    this._value = value;
    this.children.forEach((child) => child.notify(value));
    this.children = [];
  }

  static of<A>(value: A): Future<A> {
    return new ConstantFuture(value);
  }

  map<B>(fn: (a: A) => B): Future<B> {
    return new MapFuture(this, fn);
  }

  flatten<B>(this: Future<Future<B>>): Future<B> {
    return new FlattenFuture(this);
  }

  static from<A>(cb: (resolve: (value: A) => void) => void): Future<A> {
    const future = new Future<A>();
    cb(future.resolve.bind(future));
    return future;
  }

  flatMap<B>(fn: (a: A) => Future<B>): Future<B> {
    return this.map(fn).flatten();
  }

  ap<B>(fn: Future<(a: A) => B>): Future<B> {
    return this.flatMap((value) => fn.map((f) => f(value)));
  }

  static lift<A extends any[], B>(
    fn: (...args: A) => B,
    ...args: MapFutureArray<A>
  ): Future<B> {
    return args
      .reduce(
        (previous, current) =>
          previous.flatMap((p) => current.map((c) => [...p, c])),
        Future.of([])
      )
      .map((a) => fn(...a));
  }
}

class ConstantFuture<A> extends Future<A> {
  constructor(value: A) {
    super();
    this.resolve(value);
  }
}

class MapFuture<A, B> extends Future<B> implements Listener<A> {
  constructor(
    private readonly parent: Future<A>,
    private readonly fn: (a: A) => B
  ) {
    super();
    this.parent.subscribe(this);
  }

  notify(value: A): void {
    this.resolve(this.fn(value));
  }
}

class FlattenFuture<A> extends Future<A> implements Listener<A> {
  private readonly outer: Listener<Future<A>> = {
    notify: (value) => value.subscribe(this)
  };

  constructor(private readonly parent: Future<Future<A>>) {
    super();
    this.parent.subscribe(this.outer);
  }

  notify(value: A): void {
    this.resolve(value);
  }
}

