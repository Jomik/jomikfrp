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
  it("should map values", () => {
    const mockListener = new MockListener<number>();
    const stream = new SinkStream<number>();
    stream.map((a) => a * 2).subscribe(mockListener);

    stream.push(42);
    stream.push(43);

    expect(mockListener.values).toEqual([84, 86]);
  });
  it("should filter values", () => {
    const mockListener = new MockListener<number>();
    const stream = new SinkStream<number>();
    stream.filter((a) => a <= 42).subscribe(mockListener);

    stream.push(42);
    stream.push(43);

    expect(mockListener.values).toEqual([42]);
  });
});
