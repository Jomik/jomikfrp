import { Future } from "../src";
import { MockListener, SinkFuture } from "./utils";

describe("future", () => {
  it("should resolve with value", () => {
    const future = new SinkFuture<number>();
    const mockListener = new MockListener<number>();
    future.subscribe(mockListener);

    expect(mockListener.values).toEqual([]);
    future.resolve(42);
    expect(mockListener.values).toEqual([42]);
  });
  it("should resolve when promise does", async () => {
    let resolve: (value: number) => void = () => {
      throw "Used dummy resolve";
    };

    const promise = new Promise<number>((r) => (resolve = r));
    const future = Future.fromPromise(promise);
    const mockListener = new MockListener<number>();
    future.subscribe(mockListener);

    expect(mockListener.values).toEqual([]);
    resolve(42);
    await promise;
    expect(mockListener.values).toEqual([42]);
  });
  it("should throw if resolved twice", () => {
    const future = new SinkFuture<number>();
    const mockListener = new MockListener<number>();
    future.subscribe(mockListener);

    future.resolve(42);
    expect(() => future.resolve(42)).toThrow();
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
  describe("combine", () => {
    it("should resolve with the first future", () => {
      const future = Future.of(1).combine(Future.from(() => {}));
      const mockListener = new MockListener<number>();
      future.subscribe(mockListener);
      expect(mockListener.values).toEqual([1]);
    });
    it("should resolve with the second future", () => {
      const future = Future.from(() => {}).combine(Future.of(2));
      const mockListener = new MockListener<number>();
      future.subscribe(mockListener);
      expect(mockListener.values).toEqual([2]);
    });
    it("should resolve with only one future", () => {
      const future = Future.of(42).combine(Future.of(43));
      const mockListener = new MockListener<number>();
      future.subscribe(mockListener);
      expect(mockListener.values).toEqual([42]);
    });
  });
});
