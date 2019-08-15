import { Listener, Stream } from "../src";

class MockListener<A> implements Listener<A> {
  values: A[] = [];

  notify(value: A): void {
    this.values.push(value);
  }
}

class SinkStream<A> extends Stream<A> {
  push(value: A): void {
    this.update(value);
  }
}

describe("stream", () => {
  it("should notify children", () => {
    const mockListener = new MockListener<string>();
    const stream = new SinkStream<string>();
    stream.subscribe(mockListener);

    stream.push("foo");
    stream.push("bar");

    expect(mockListener.values).toEqual(["foo", "bar"]);
  });
  describe("map", () => {
    const mockListener = new MockListener<number>();
    const stream = new SinkStream<number>();
    stream.map((a) => a * 2).subscribe(mockListener);

    stream.push(42);
    stream.push(43);

    expect(mockListener.values).toEqual([84, 86]);
  });
  describe("filter", () => {
    const mockListener = new MockListener<number>();
    const stream = new SinkStream<number>();
    stream.filter((a) => a <= 42).subscribe(mockListener);

    stream.push(42);
    stream.push(43);

    expect(mockListener.values).toEqual([42]);
  });
  describe("combine", () => {
    const mockListener = new MockListener<number>();
    const stream1 = new SinkStream<number>();
    const stream2 = new SinkStream<number>();
    stream1.combine(stream2).subscribe(mockListener);

    stream1.push(42);
    stream2.push(43);

    expect(mockListener.values).toEqual([42, 43]);
  });
});
