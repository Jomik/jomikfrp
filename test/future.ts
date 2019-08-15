import { Listener, Future } from "../src";

class MockListener<A> implements Listener<A> {
  values: A[] = [];

  notify(value: A): void {
    this.values.push(value);
  }
}

describe("future", () => {
  it("should resolve with value", () => {
    let resolve: (value: number) => void;
    const future = Future.from<number>((r) => (resolve = r));
    const mockListener = new MockListener<number>();
    future.subscribe(mockListener);

    expect(mockListener.values).toEqual([]);
    resolve(42);
    expect(mockListener.values).toEqual([42]);
  });
  describe("map", () => {
    const future = Future.of(21).map((n) => n * 2);
    const mockListener = new MockListener<number>();
    future.subscribe(mockListener);

    expect(mockListener.values).toEqual([42]);
  });
  describe("flatten", () => {
    const inner = Future.of(42);
    const outer = Future.of(inner);
    const mockListener = new MockListener<number>();
    outer.flatten().subscribe(mockListener);

    expect(mockListener.values).toEqual([42]);
  });
  describe("ap", () => {
    it("should apply the function", () => {
      const fn = Future.of((n: number) => n * 2);
      const future = Future.of(21).ap(fn);
      const mockListener = new MockListener<number>();
      future.subscribe(mockListener);

      expect(mockListener.values).toEqual([42]);
    });
  });
  describe("lift", () => {
    it("should be ordered", () => {
      Future.lift(
        (n, m) => (expect(n).toBe(1), expect(m).toBe(2)),
        Future.of(1),
        Future.of(2)
      );
    });
    it("should apply the function", () => {
      const future1 = Future.of(20);
      const future2 = Future.of(10);
      const future = Future.lift(
        (n: number, m: number) => n + m,
        future1,
        future2
      );
      const mockListener = new MockListener<number>();
      future.subscribe(mockListener);
      expect(mockListener.values).toEqual([30]);
    });
  });
});
