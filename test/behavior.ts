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
    const behavior = Behavior.of(1);
    expect(behavior.at()).toBe(1);
  });
  it("should read from function", () => {
    const behavior = Behavior.from(getValue);

    setValue(1);
    expect(behavior.at()).toBe(1);
    setValue(2);
    expect(behavior.at()).toBe(2);
  });
  describe("map", () => {
    const behavior = Behavior.from(getValue).map((n) => n * 2);

    setValue(1);
    expect(behavior.at()).toBe(2);
    setValue(2);
    expect(behavior.at()).toBe(4);
  });
  describe("flatten", () => {
    const behavior = Behavior.of(Behavior.of(1)).flatten();
    expect(behavior.at()).toBe(1);
  });
});
