import { Listener } from "./common";

const unresolved = Symbol("unresolved_future");

export class Future<A> {
  private children: Listener<A>[] = [];
  private _value: A | typeof unresolved = unresolved;
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

  static from<B>(cb: (resolve: (value: B) => void) => void): Future<B> {
    const future = new Future<B>();
    cb(future.resolve.bind(future));
    return future;
  }

  static lift<A extends any[], B>(
    fn: (...args: A) => B,
    ...args: MapFutureArray<A>
  ): Future<B> {
    return new LiftFuture(fn, args);
  }

  ap<B>(fn: Future<(a: A) => B>): Future<B> {
    return this.map((value) => fn.map((f) => f(value))).flatten();
  }

  map<B>(fn: (a: A) => B): Future<B> {
    return new MapFuture(this, fn);
  }

  flatten<B>(this: Future<Future<B>>): Future<B> {
    return new FlattenFuture(this);
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

type MapFutureArray<A> = { [k in keyof A]: Future<A[k]> };

class LiftFuture<A extends any[], B> extends Future<B>
  implements Listener<void> {
  private remaining: number;

  constructor(
    private readonly fn: (...args: A) => B,
    private readonly parents: MapFutureArray<A>
  ) {
    super();
    this.remaining = this.parents.length;
    this.parents.forEach((parent) => parent.subscribe(this));
  }

  notify(): void {
    --this.remaining;
    if (this.remaining === 0) {
      this.resolve(
        this.fn(...(this.parents.map((parent) => parent.value) as any))
      );
    }
  }
}
