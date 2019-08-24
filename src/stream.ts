import { Listener, ListenerTarget } from "./common";
import { Behavior } from "./behavior";
import { Future } from "./future";

const streamType = Symbol("stream");

export abstract class Stream<A> implements ListenerTarget<A> {
  private listeners: Set<Listener<A>> = new Set();

  frpType = streamType;

  subscribe(listener: Listener<A>) {
    this.listeners.add(listener);
  }

  unsubscribe(listener: Listener<A>): void {
    this.listeners.delete(listener);
  }

  protected notifyChildren(value: A) {
    this.listeners.forEach((l) => l.notify(value));
  }

  static is(obj: any): obj is Stream<any> {
    return "frpType" in obj && obj.frpType === streamType;
  }

  map<B>(fn: (a: A) => B): Stream<B> {
    return new MapStream(this, fn);
  }

  filter(fn: (a: A) => boolean): Stream<A> {
    return new FilterStream(this, fn);
  }

  combine<B>(stream: Stream<B>): Stream<A | B> {
    return new CombineStream(this, stream);
  }

  mapTo<B>(value: B): Stream<B> {
    return this.map(() => value);
  }

  scan<B>(fn: (accum: B, current: A) => B, initial: B): Behavior<Stream<B>> {
    return Behavior.from(() => new ScanStream(this, fn, initial));
  }

  accum<B>(fn: (accum: B, current: A) => B, initial: B): Behavior<Behavior<B>> {
    return Behavior.accumulateFromStream(this, fn, initial);
  }

  latest(initial: A): Behavior<Behavior<A>> {
    return this.accum((_, c) => c, initial);
  }

  next(): Behavior<Future<A>> {
    return Future.nextFromStream(this);
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

