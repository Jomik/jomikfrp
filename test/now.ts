import { Now, Component, Behavior } from "../src";
import { placeholder } from "../src/placeholder";
import { SinkStream } from "./utils";

describe("now", () => {
  it("should be constant", () => {
    const now = Now.of(1);
    expect(now.run()).toBe(1);
  });
  describe("it", () => {
    it("should recognize now", () => {
      const b = Now.of(42);
      expect(Now.is(b)).toBeTruthy();
    });
    it("should not recognize others", () => {
      for (const t of [
        new SinkStream(),
        Behavior.of(42),
        placeholder(),
        Component.of(1),
        {}
      ]) {
        expect(Now.is(t)).toBeFalsy();
      }
    });
  });
  describe("map", () => {
    it("should apply the function", () => {
      const now = Now.of(2).map((n) => n * 2);

      expect(now.run()).toBe(4);
    });
  });
  describe("flatten", () => {
    it("should read the inner value", () => {
      const now = Now.of(Now.of(1)).flatten();
      expect(now.run()).toBe(1);
    });
  });
  describe("ap", () => {
    it("should apply the function", () => {
      const fn = Now.of((n: number) => n * 2);
      const now = Now.of(21).ap(fn);

      expect(now.run()).toBe(42);
    });
  });
  describe("lift", () => {
    it("should be ordered", () => {
      Now.lift(
        (n, m) => (expect(n).toBe(1), expect(m).toBe(2)),
        Now.of(1),
        Now.of(2)
      );
    });
    it("should apply the function", () => {
      const now1 = Now.of(20);
      const now2 = Now.of(10);
      const now = Now.lift((n: number, m: number) => n + m, now1, now2);
      expect(now.run()).toBe(30);
    });
  });
});
