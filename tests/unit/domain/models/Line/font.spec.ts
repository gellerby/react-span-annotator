import { Font } from "@/domain/models/Line/Font";

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
