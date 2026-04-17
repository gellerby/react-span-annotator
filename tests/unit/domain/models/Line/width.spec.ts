import { LineWidthManager } from "@/domain/models/Line/WidthManager";

let calculator: LineWidthManager;
const maxWidth = 10;
const maxLabelWidth = 2;

beforeEach(() => {
  calculator = new LineWidthManager(maxWidth, maxLabelWidth);
});

describe("LineWidthManager", () => {
  it("starts empty", () => {
    expect(calculator.width).toEqual(0);
    expect(calculator.isEmpty()).toBe(true);
  });

  it("add increases width", () => {
    calculator.add(3);
    expect(calculator.width).toEqual(3);
    expect(calculator.isEmpty()).toBe(false);
  });

  it("maxWidth = maxLineWidth - maxLabelWidth", () => {
    expect(calculator.maxWidth).toEqual(maxWidth - maxLabelWidth);
  });

  it("reset clears width", () => {
    calculator.add(5);
    calculator.reset();
    expect(calculator.width).toEqual(0);
    expect(calculator.isEmpty()).toBe(true);
  });

  it("isFull when over maxWidth", () => {
    calculator.add(8); // totalWidth=8, maxWidth=8
    expect(calculator.isFull()).toBe(false);
    expect(calculator.isFull(1)).toBe(true);
  });

  it("isFull with no arg uses 0 wordWidth", () => {
    calculator.add(9); // 9 > 8 (maxWidth)
    expect(calculator.isFull()).toBe(true);
  });

  it("canAdd returns true when fits", () => {
    calculator.add(4);
    expect(calculator.canAdd(4)).toBe(true);
    expect(calculator.canAdd(5)).toBe(false);
  });
});
