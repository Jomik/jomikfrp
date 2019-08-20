import { Component, ComponentOutput } from "../src";

const dummy = {
  appendChild: () => {}
};

class DummyComponent<A, O> extends Component<A, O> {
  constructor(private readonly available: A, private readonly out: O) {
    super();
  }

  render(): ComponentOutput<A, O> {
    return { available: this.available, output: this.out };
  }
}

describe("component", () => {
  it("should be constant", () => {
    const component = Component.of(1);
    expect(component.render(dummy).output).toBe(1);
  });
  describe("map", () => {
    it("should apply the function", () => {
      const component = Component.of(2).map((n) => n * 2);

      expect(component.render(dummy).output).toBe(4);
    });
  });
  describe("flatten", () => {
    it("should read the inner value", () => {
      const component = Component.of(Component.of(1)).flatten();
      expect(component.render(dummy).output).toBe(1);
    });
  });
  describe("ap", () => {
    it("should apply the function", () => {
      const fn = Component.of((n: number) => n * 2);
      const component = Component.of(21).ap(fn);

      expect(component.render(dummy).output).toBe(42);
    });
  });
  describe("lift", () => {
    it("should be ordered", () => {
      Component.lift(
        (n, m) => (expect(n).toBe(1), expect(m).toBe(2)),
        Component.of(1),
        Component.of(2)
      );
    });
    it("should apply the function", () => {
      const component1 = Component.of(20);
      const component2 = Component.of(10);
      const component = Component.lift(
        (n: number, m: number) => n + m,
        component1,
        component2
      );
      expect(component.render(dummy).output).toBe(30);
    });
  });
  describe("output", () => {
    it("should map output", () => {
      const component = new DummyComponent({ foo: 1 }, {}).output({
        foo: "foo"
      });
      expect(component.render(dummy).output).toEqual({ foo: 1 });
    });
    it("should merge output", () => {
      const component = new DummyComponent({ foo: 1 }, { bar: 42 }).output({
        foo: "foo"
      });
      expect(component.render(dummy).output).toEqual({ foo: 1, bar: 42 });
    });
  });
  describe("liftOutput", () => {
    it("should map output using function", () => {
      const component = new DummyComponent(1, undefined).liftOutput((v) => v);
      expect(component.render(dummy).output).toBe(1);
    });
  });
});
