import { Listener, Stream } from "../src";

class MockListener<A> implements Listener<A> {
  values: A[] = [];

  notify(value: A): void {
    this.values.push(value);
  }
}

class SinkStream<A> extends Stream<A> {
  push(value: A): void {
    this.notifyChildren(value);
  }
}

describe("stream", () => {
  it("should notify children", () => {
    const mockListener1 = new MockListener<string>();
    const mockListener2 = new MockListener<string>();
    const stream = new SinkStream<string>();
    stream.subscribe(mockListener1);
    stream.subscribe(mockListener2);

    stream.push("foo");
    stream.push("bar");

    expect(mockListener1.values).toEqual(["foo", "bar"]);
    expect(mockListener2.values).toEqual(["foo", "bar"]);
  });
  describe("map", () => {
    it("should apply the function", () => {
      const mockListener = new MockListener<number>();
      const stream = new SinkStream<number>();
      stream.map((a) => a * 2).subscribe(mockListener);

      stream.push(42);
      stream.push(43);

      expect(mockListener.values).toEqual([84, 86]);
    });
  });
  describe("mapTo", () => {
    it("should push the value", () => {
      const mockListener = new MockListener<number>();
      const stream = new SinkStream<number>();
      stream.mapTo(2).subscribe(mockListener);

      stream.push(42);
      stream.push(43);

      expect(mockListener.values).toEqual([2, 2]);
    });
  });
  describe("filter", () => {
    it("should push values that pass the filter", () => {
      const mockListener = new MockListener<number>();
      const stream = new SinkStream<number>();
      stream.filter((a) => a <= 42).subscribe(mockListener);

      stream.push(42);
      stream.push(43);

      expect(mockListener.values).toEqual([42]);
    });
  });
  describe("combine", () => {
    it("should push values from both streams", () => {
      const mockListener = new MockListener<number>();
      const stream1 = new SinkStream<number>();
      const stream2 = new SinkStream<number>();
      stream1.combine(stream2).subscribe(mockListener);

      stream1.push(42);
      stream2.push(43);

      expect(mockListener.values).toEqual([42, 43]);
    });
  });
  describe("scan", () => {
    it("should push accumulated value", () => {
      const mockListener = new MockListener<number>();
      const stream = new SinkStream<number>();
      stream
        .scan((a, c) => a + c, 0)
        .at()
        .subscribe(mockListener);

      stream.push(1);
      stream.push(1);
      stream.push(1);

      expect(mockListener.values).toEqual([1, 2, 3]);
    });
  });
  describe("accum", () => {
    it("should contain accumulated value", () => {
      const stream = new SinkStream<number>();
      const behavior = stream.accum((c, a) => c + a, 0).at();

      expect(behavior.at()).toBe(0);
      stream.push(1);
      expect(behavior.at()).toBe(1);
      stream.push(1);
      expect(behavior.at()).toBe(2);
      stream.push(1);
      expect(behavior.at()).toBe(3);
    });
  });
  describe("latest", () => {
    it("should contain latest value", () => {
      const stream = new SinkStream<number>();
      const behavior = stream.latest(0).at();

      expect(behavior.at()).toBe(0);
      stream.push(1);
      expect(behavior.at()).toBe(1);
      stream.push(2);
      expect(behavior.at()).toBe(2);
      stream.push(3);
      expect(behavior.at()).toBe(3);
    });
  });
  describe("next", () => {
    it("should resolve with next value", () => {
      const stream = new SinkStream<number>();
      const future = stream.next().at();
      const mockListener = new MockListener<number>();
      future.subscribe(mockListener);

      stream.push(42);
      expect(mockListener.values).toEqual([42]);
      stream.push(42);
    });
    it("should unsubscribe once resolved", () => {
      const stream = new SinkStream<number>();
      const future = stream.next().at();
      const mockListener = new MockListener<number>();
      future.subscribe(mockListener);

      stream.push(42);
      expect(() => stream.push(42)).not.toThrow();
    });
  });
});
