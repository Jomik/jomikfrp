import {
  Component,
  ComponentOutput,
  loop,
  Now,
  Behavior,
  Future
} from "../src";
import { placeholder } from "../src/placeholder";
import { SinkStream } from "./utils";

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
  describe("it", () => {
    it("should recognize component", () => {
      const b = Component.of(42);
      expect(Component.is(b)).toBeTruthy();
    });
    it("should not recognize others", () => {
      for (const t of [
        new SinkStream(),
        Behavior.of(42),
        placeholder(),
        Future.of(1),
        Now.of(42),
        {}
      ]) {
        expect(Component.is(t)).toBeFalsy();
      }
    });
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
  describe("loop", () => {
    it("should run without input", () => {
      const component = loop(() =>
        Now.of(new DummyComponent({}, { a: Behavior.of(1) }))
      );
      expect(component.render(dummy).output.a.at()).toBe(1);
    });
    it("should pass output to input", () => {
      const component = loop<{ looped: Behavior<number>; a: Behavior<number> }>(
        ({ looped }) =>
          Now.of(
            new DummyComponent(
              {},
              { looped: Behavior.of(2), a: looped.map((v) => v + 40) }
            )
          )
      );
      expect(component.render(dummy).output.a.at()).toBe(42);
    });
    it("should throw if all output isn't given", () => {
      const component = loop<{ looped: Behavior<number>; a: Behavior<number> }>(
        ({ looped }) => {
          const a = looped.map((v) => v + 40);
          return Now.of(new DummyComponent({}, { a } as any));
        }
      );
      expect(() => component.render(dummy)).toThrow();
    });
    it("should not output placeholders", () => {
      const component = loop<{ looped: Behavior<number>; a: Behavior<number> }>(
        ({ looped }) => {
          const a = looped.map((v) => v + 40).map((v) => v * 2);
          return Now.of(
            new DummyComponent(
              {},
              {
                looped: Behavior.of(2),
                a
              }
            )
          );
        }
      );
      const { output } = component.render(dummy);
      expect(output.looped).toBeInstanceOf(Behavior);
      expect(output.a).toBeInstanceOf(Behavior);
    });
  });
});
