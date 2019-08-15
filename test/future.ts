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
    let resolve: (value: number) => void;
    const future = Future.from<number>((r) => (resolve = r)).map((n) => n * 2);
    const mockListener = new MockListener<number>();
    future.subscribe(mockListener);

    resolve(21);
    expect(mockListener.values).toEqual([42]);
  });
  describe("flatten", () => {
    // Setup outer
    let resolveOuter: (value: Future<number>) => void;
    const outer = Future.from<Future<number>>((r) => (resolveOuter = r));
    // Setup inner
    let resolveInner: (value: number) => void;
    const inner = Future.from<number>((r) => (resolveInner = r));
    const mockListener = new MockListener<number>();
    // Subscribe to the flattened future
    outer.flatten().subscribe(mockListener);

    resolveOuter(inner);
    expect(mockListener.values).toEqual([]);
    resolveInner(42);
    expect(mockListener.values).toEqual([42]);
  });
  describe("lift", () => {
    let resolve1: (value: number) => void;
    const future1 = Future.from<number>((r) => (resolve1 = r));
    let resolve2: (value: number) => void;
    const future2 = Future.from<number>((r) => (resolve2 = r));

    const mockListener = new MockListener<number>();
    Future.lift((n: number, m: number) => n + m, future1, future2).subscribe(
      mockListener
    );

    resolve1(42);
    expect(mockListener.values).toEqual([]);
    resolve2(42);
    expect(mockListener.values).toEqual([84]);
  });
});
