import { Behavior } from "../src";

let testValue: number;
const setValue = (n: number) => {
  testValue = n;
};
const getValue = () => testValue;

beforeEach(() => {
  setValue(0);
});

describe("behavior", () => {
  it("should be constant", () => {
    const behavior = Behavior.of(42);
    expect(behavior.at()).toBe(42);
  });
  it("should read from function", () => {
    const behavior = Behavior.from(getValue);

    setValue(40);
    expect(behavior.at()).toBe(40);
    setValue(42);
    expect(behavior.at()).toBe(42);
  });
  it("should map", () => {
    const behavior = Behavior.from(getValue).map((n) => n * 2);

    setValue(40);
    expect(behavior.at()).toBe(80);
    setValue(42);
    expect(behavior.at()).toBe(84);
  });
});
