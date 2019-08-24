import { placeholder } from "../src/placeholder";
import { Behavior, Stream, Future } from "../src";
import { SinkStream, MockListener, SinkFuture } from "./utils";

describe("placeholder", () => {
  it("throws if replaced twice", () => {
    const p = placeholder<Behavior<number>>();
    p.replaceWith(Behavior.of(2));
    expect(() => p.replaceWith(Behavior.of(2))).toThrow();
  });
  describe("behavior", () => {
    it("can be replaced", () => {
      const p = placeholder<Behavior<number>>();
      p.replaceWith(Behavior.of(2));
      expect(p.at()).toBe(2);
    });
    it("can be mapped", () => {
      const p = placeholder<Behavior<number>>();
      const b = p.flatMap((v) => Behavior.of(v + 40));
      p.replaceWith(Behavior.of(2));
      expect(b.at()).toBe(42);
    });
  });
  describe("stream", () => {
    it("can be replaced", () => {
      const p = placeholder<Stream<number>>();
      const mockListener = new MockListener<number>();
      p.subscribe(mockListener);
      const s = new SinkStream<number>();
      p.replaceWith(s);
      s.push(2);
      expect(mockListener.values).toEqual([2]);
    });
    it("can be mapped", () => {
      const p = placeholder<Stream<number>>();
      const mapped = p.map((v) => v + 40);
      const mockListener = new MockListener<number>();
      mapped.subscribe(mockListener);
      const s = new SinkStream<number>();
      p.replaceWith(s);
      s.push(2);
      expect(mockListener.values).toEqual([42]);
    });
    it("can scan", () => {
      const p = placeholder<Stream<number>>();
      const accum = p.scan((a, c) => a + c, 0).at();
      const s = new SinkStream<number>();
      const mockListener = new MockListener<number>();
      accum.subscribe(mockListener);
      p.replaceWith(s);
      s.push(2);
      s.push(40);
      expect(mockListener.values).toEqual([2, 42]);
    });
    it("can accumulate", () => {
      const p = placeholder<Stream<number>>();
      const accum = p.accum((a, c) => a + c, 0).at();
      const s = new SinkStream<number>();
      p.replaceWith(s);
      s.push(2);
      s.push(40);
      expect(accum.at()).toBe(42);
    });
    it("can combine", () => {
      const p1 = placeholder<Stream<number>>();
      const p2 = placeholder<Stream<number>>();
      const s1 = new SinkStream<number>();
      const s2 = new SinkStream<number>();
      const combined = p1.combine(p2);
      const mockListener = new MockListener<number>();
      combined.subscribe(mockListener);
      p1.replaceWith(s1);
      p2.replaceWith(s2);
      s1.push(2);
      s2.push(40);
      expect(mockListener.values).toEqual([2, 40]);
    });
  });
  describe("future", () => {
    it("can be replaced", () => {
      const p = placeholder<Future<number>>();
      const mockListener = new MockListener<number>();
      p.subscribe(mockListener);
      p.replaceWith(Future.of(2));
      expect(mockListener.values).toEqual([2]);
    });
    it("can be mapped", () => {
      const p = placeholder<Future<number>>();
      const f = p.flatMap((v) => Future.of(v + 40));
      const mockListener = new MockListener<number>();
      f.subscribe(mockListener);
      p.replaceWith(Future.of(2));
      expect(mockListener.values).toEqual([42]);
    });
    it("can combine", () => {
      const p1 = placeholder<Future<number>>();
      const p2 = placeholder<Future<number>>();
      const combined = p1.combine(p2);
      const mockListener = new MockListener<number>();
      combined.subscribe(mockListener);
      p1.replaceWith(new SinkFuture());
      p2.replaceWith(Future.of(42));
      expect(mockListener.values).toEqual([42]);
    });
  });
});
