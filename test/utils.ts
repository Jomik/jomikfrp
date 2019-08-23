import { Listener, Stream, Future } from "../src";

export class MockListener<A> implements Listener<A> {
  values: A[] = [];

  notify(value: A): void {
    this.values.push(value);
  }
}

export class SinkStream<A> extends Stream<A> {
  push(value: A): void {
    this.notifyChildren(value);
  }
}

export class SinkFuture<A> extends Future<A> {
  resolve(value: A) {
    super.resolve(value);
  }
}

