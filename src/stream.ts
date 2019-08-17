import { Listener, Target } from "./common";
import { Behavior } from ".";

export abstract class Stream<A> extends Target<A> {
  map<B>(fn: (a: A) => B): Stream<B> {
    return new MapStream(this, fn);
  }

  filter(fn: (a: A) => boolean): Stream<A> {
    return new FilterStream(this, fn);
  }

  combine<B>(stream: Stream<A | B>): Stream<A | B> {
    return new CombineStream(this, stream);
  }

  scan<B>(fn: (accum: B, current: A) => B, initial: B): Stream<B> {
    return new ScanStream(this, fn, initial);
  }

  accum<B>(fn: (accum: B, current: A) => B, initial: B): Behavior<Behavior<B>> {
    return Behavior.accum(fn, initial, this);
  }

  latest(initial: A): Behavior<Behavior<A>> {
    return this.accum((_, c) => c, initial);
  }
}

class MapStream<A, B> extends Stream<B> implements Listener<A> {
  constructor(
    private readonly parent: Stream<A>,
    private readonly fn: (a: A) => B
  ) {
    super();
    this.parent.subscribe(this);
  }

  notify(value: A) {
    this.notifyChildren(this.fn(value));
  }
}

class FilterStream<A> extends Stream<A> implements Listener<A> {
  constructor(
    private readonly parent: Stream<A>,
    private readonly fn: (a: A) => boolean
  ) {
    super();
    this.parent.subscribe(this);
  }

  notify(value: A) {
    if (this.fn(value)) {
      this.notifyChildren(value);
    }
  }
}

class CombineStream<A, B> extends Stream<A | B> implements Listener<A | B> {
  constructor(private readonly s1: Stream<A>, private readonly s2: Stream<B>) {
    super();
    this.s1.subscribe(this);
    this.s2.subscribe(this);
  }

  notify(value: A | B): void {
    this.notifyChildren(value);
  }
}

class ScanStream<A, B> extends Stream<B> implements Listener<A> {
  private last: B;

  constructor(
    private readonly parent: Stream<A>,
    private readonly fn: (accum: B, current: A) => B,
    initial: B
  ) {
    super();
    this.last = initial;
    this.parent.subscribe(this);
  }

  notify(value: A): void {
    this.last = this.fn(this.last, value);
    this.notifyChildren(this.last);
  }
}

