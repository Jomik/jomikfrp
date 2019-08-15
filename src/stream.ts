import { Listener } from "./common";

export class Stream<A> {
  private children: Listener<A>[] = [];

  subscribe(child: Listener<A>) {
    if (!this.children.includes(child)) {
      this.children.push(child);
    }
  }

  protected update(value: A) {
    this.children.forEach((child) => child.notify(value));
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
    this.update(this.fn(value));
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
      this.update(value);
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
    this.update(value);
  }
}

