import { Behavior } from "../src";

describe("behavior", () => {
  it("should be constant", () => {
    const behavior = Behavior.of(1);
    expect(behavior.at()).toBe(1);
  });
  it("should read from function", () => {
    let testValue: number;
    const setValue = (n: number) => {
      testValue = n;
    };
    const getValue = () => testValue;

    const behavior = Behavior.from(getValue);

    setValue(1);
    expect(behavior.at()).toBe(1);
    setValue(2);
    expect(behavior.at()).toBe(2);
  });
  describe("map", () => {
    it("should apply the function", () => {
      const behavior = Behavior.of(2).map((n) => n * 2);

      expect(behavior.at()).toBe(4);
    });
  });
  describe("flatten", () => {
    it("should read the inner value", () => {
      const behavior = Behavior.of(Behavior.of(1)).flatten();
      expect(behavior.at()).toBe(1);
    });
  });
  describe("ap", () => {
    it("should apply the function", () => {
      const fn = Behavior.of((n: number) => n * 2);
      const behavior = Behavior.of(21).ap(fn);

      expect(behavior.at()).toBe(42);
    });
  });
  describe("lift", () => {
    it("should be ordered", () => {
      Behavior.lift(
        (n, m) => (expect(n).toBe(1), expect(m).toBe(2)),
        Behavior.of(1),
        Behavior.of(2)
      );
    });
    it("should apply the function", () => {
      const behavior1 = Behavior.of(20);
      const behavior2 = Behavior.of(10);
      const behavior = Behavior.lift(
        (n: number, m: number) => n + m,
        behavior1,
        behavior2
      );
      expect(behavior.at()).toBe(30);
    });
  });
});
