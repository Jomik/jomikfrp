import { Listener } from "./common";

const unresolved = Symbol("unresolved_future");

export class Future<A> {
  private children: Listener<A>[] = [];
  private value: A | typeof unresolved = unresolved;

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

    this.value = value;
    this.children.forEach((child) => child.notify(value));
    this.children = [];
  }

  static from<B>(cb: (resolve: (value: B) => void) => void): Future<B> {
    const future = new Future<B>();
    cb(future.resolve.bind(future));
    return future;
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

