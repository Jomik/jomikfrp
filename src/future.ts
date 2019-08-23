import { Listener, Target } from "./common";
import { Behavior } from "./behavior";
import { Stream } from "./stream";

type MapFutureArray<A> = { [k in keyof A]: Future<A[k]> };
const unresolved = Symbol("unresolved_future");
type Unresolved = typeof unresolved;

export class Future<A> extends Target<A> {
  private _value: A | Unresolved = unresolved;
  get value() {
    return this._value;
  }

  subscribe(listener: Listener<A>) {
    if (this.value !== unresolved) {
      listener.notify(this.value);
    } else {
      super.subscribe(listener);
    }
  }

  protected resolve(value: A) {
    if (this.value !== unresolved) {
      throw new Error(
        `A future can not be resolved twice! Already resolved with ${this.value} and now resolved with ${value}.`
      );
    }

    this._value = value;
    super.notifyChildren(value);
    this.listeners.clear();
  }

  static of<A>(value: A): Future<A> {
    return new ImmediateFuture(value);
  }

  flatMap<B>(fn: (a: A) => Future<B>): Future<B> {
    return new FlatMapFuture(this, fn);
  }

  map<B>(fn: (a: A) => B): Future<B> {
    return this.flatMap((a) => Future.of(fn(a)));
  }

  flatten<B>(this: Future<Future<B>>): Future<B> {
    return this.flatMap((a) => a);
  }

  static from<A>(cb: (resolve: (value: A) => void) => void): Future<A> {
    const future = new Future<A>();
    cb(future.resolve.bind(future));
    return future;
  }

  static fromPromise<A>(promise: Promise<A>): Future<A> {
    return Future.from(promise.then.bind(promise));
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

  combine<B>(future: Future<B>): Future<A | B> {
    return new CombineFuture(this, future);
  }

  static nextFromStream<A>(stream: Stream<A>): Behavior<Future<A>> {
    return Behavior.from(() => new NextFromStreamFuture(stream));
  }
}

class ImmediateFuture<A> extends Future<A> {
  constructor(value: A) {
    super();
    this.resolve(value);
  }
}

class FlatMapFuture<A, B> extends Future<B> implements Listener<B> {
  constructor(
    private readonly parent: Future<A>,
    private readonly fn: (a: A) => Future<B>
  ) {
    super();
    this.parent.subscribe({
      notify: (value) => this.fn(value).subscribe(this)
    });
  }

  notify(value: B): void {
    this.resolve(value);
  }
}

class CombineFuture<A, B> extends Future<A | B> implements Listener<A | B> {
  constructor(private readonly f1: Future<A>, private readonly f2: Future<B>) {
    super();
    this.f1.subscribe(this);
    this.f2.subscribe(this);
  }

  notify(value: A | B): void {
    this.f1.unsubscribe(this);
    this.f2.unsubscribe(this);
    if (this.value === unresolved) {
      this.resolve(value);
    }
  }
}

class NextFromStreamFuture<A> extends Future<A> implements Listener<A> {
  constructor(private readonly parent: Stream<A>) {
    super();
    this.parent.subscribe(this);
  }

  notify(value: A): void {
    this.parent.unsubscribe(this);
    this.resolve(value);
  }
}
