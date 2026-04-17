import { Font } from "@/domain/models/Line/Font";

function makeMockTextElement(charWidths: number[]): SVGTextElement {
  let stored = "";
  return {
    get textContent() {
      return stored;
    },
    set textContent(v: string | null) {
      stored = v ?? "";
    },
    getNumberOfChars: jest.fn().mockImplementation(() => stored.length),
    getExtentOfChar: jest
      .fn()
      .mockImplementation((i: number) => ({ width: charWidths[i] ?? 0 })),
    getBoundingClientRect: jest.fn().mockReturnValue({ height: 24 }),
  } as unknown as SVGTextElement;
}

describe("Font", () => {
  let font: Font;

  beforeEach(() => {
    const width = new Map([
      ["a", 5],
      ["b", 10],
      ["c", 3],
    ]);
    font = new Font(0, "0", "0", 0, width);
  });

  it("calculate sum width", () => {
    expect(font.widthOf("abc")).toEqual(18);
    expect(font.widthOf("a")).toEqual(5);
    expect(font.widthOf("")).toEqual(0);
    expect(font.widthOf("unknown")).toEqual(0);
  });

  it("widthOf return_max=true returns max char width (min 20)", () => {
    // max of [5, 10, 3] is 10, but floor is 20
    expect(font.widthOf("abc", true)).toEqual(20);
  });

  it("widthOf return_max=true with wide char exceeds 20", () => {
    const bigWidth = new Map([["x", 25]]);
    const bigFont = new Font(0, "0", "0", 0, bigWidth);
    expect(bigFont.widthOf("x", true)).toEqual(25);
  });
});

describe("Font.create", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("measures char widths and extracts font properties", () => {
    // text "ab\nc" → unique chars sorted: ['a','b','c'], \n excluded then set to 0
    // charWidths[0]='a'=2, [1]='b'=4, [2]='c'=6
    const mockElement = makeMockTextElement([2, 4, 6]);
    jest.spyOn(window, "getComputedStyle").mockReturnValue({
      fontSize: "14px",
      fontFamily: "sans-serif",
      fontWeight: "700",
    } as unknown as CSSStyleDeclaration);

    const font = Font.create("ab\nc", mockElement);

    expect(font.fontSize).toBe(14);
    expect(font.fontFamily).toBe("sans-serif");
    expect(font.fontWeight).toBe("700");
    expect(font.lineHeight).toBe(24);
    expect(font.widthOfChar("a")).toBe(2);
    expect(font.widthOfChar("b")).toBe(4);
    expect(font.widthOfChar("c")).toBe(6);
    expect(font.widthOfChar("\n")).toBe(0);
    expect(mockElement.textContent).toBe(""); // cleared after use
  });

  it("handles text with no non-newline chars", () => {
    const mockElement = makeMockTextElement([]);
    jest.spyOn(window, "getComputedStyle").mockReturnValue({
      fontSize: "16px",
      fontFamily: "Arial",
      fontWeight: "400",
    } as unknown as CSSStyleDeclaration);

    const font = Font.create("\n\n", mockElement);
    expect(font.widthOfChar("\n")).toBe(0);
    expect(font.widthOf("")).toBe(0);
  });
});
