import { TextLine } from "@/domain/models/Line/LineText";

describe("TextLine", () => {
  it("stores start and end offsets", () => {
    const line = new TextLine(5, 15);
    expect(line.startOffset).toBe(5);
    expect(line.endOffset).toBe(15);
  });

  it("accepts zero-length line", () => {
    const line = new TextLine(3, 3);
    expect(line.startOffset).toBe(3);
    expect(line.endOffset).toBe(3);
  });
});
