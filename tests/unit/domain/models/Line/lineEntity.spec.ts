import { EntityLine, GeometricEntity, Range, Ranges } from "@/domain/models/Line/LineEntity";
import { Entity } from "@/domain/models/Label/Entity";
import { TextLine } from "@/domain/models/Line/LineText";
import { LabelList, EntityLabelListItem } from "@/domain/models/Label/Label";

function makeSvgElement(charCount: number, nodeText: string): SVGTextElement {
  return {
    getNumberOfChars: jest.fn().mockReturnValue(charCount),
    firstChild: { textContent: nodeText },
  } as unknown as SVGTextElement;
}

function makeMockRange(rects: { left: number; right: number }[]): globalThis.Range {
  return {
    setStart: jest.fn(),
    setEnd: jest.fn(),
    getClientRects: jest.fn().mockReturnValue(rects),
  } as unknown as globalThis.Range;
}

describe("Range", () => {
  it("center", () => {
    const range = new Range(0, 1);
    const expected = 0.5;
    expect(range.center).toEqual(expected);
  });

  it("throw exception", () => {
    expect(() => new Range(1, 0)).toThrowError(RangeError);
  });

  it("getInterval", () => {
    const range = new Range(20, 30);
    const actual = range.getInterval();
    const expected = [20, 30];
    expect(actual).toEqual(expected);
  });

  it("LTR getInterval", () => {
    const range = new Range(0, 1);
    const actual = range.getInterval(false, 10);
    const expected = [0, 10];
    expect(actual).toEqual(expected);
  });

  it("RTL getInterval", () => {
    const range = new Range(25, 30);
    const actual = range.getInterval(true, 10);
    const expected = [20, 30];
    expect(actual).toEqual(expected);
  });
});

describe("Ranges", () => {
  it("add", () => {
    const ranges = new Ranges();
    expect(ranges.items.length).toEqual(0);
    ranges.add(0, 0);
    expect(ranges.items.length).toEqual(1);
  });

  it("LTR items", () => {
    const ranges = new Ranges();
    ranges.add(0, 1);
    ranges.add(2, 3);
    const expected = [new Range(0, 1), new Range(2, 3)];
    expect(ranges.items).toEqual(expected);
  });

  it("RTL items", () => {
    const ranges = new Ranges(true);
    ranges.add(0, 1);
    ranges.add(2, 3);
    const expected = [new Range(2, 3), new Range(0, 1)];
    expect(ranges.items).toEqual(expected);
  });

  it("LTR first", () => {
    const ranges = new Ranges();
    ranges.add(0, 1);
    ranges.add(2, 3);
    const expected = new Range(0, 1);
    expect(ranges.first).toEqual(expected);
  });

  it("RTL first", () => {
    const ranges = new Ranges(true);
    ranges.add(0, 1);
    ranges.add(2, 3);
    const expected = new Range(2, 3);
    expect(ranges.first).toEqual(expected);
  });

  it("LTR center", () => {
    const ranges = new Ranges();
    ranges.add(0, 1);
    ranges.add(2, 3);
    const expected = 0.5;
    expect(ranges.center).toEqual(expected);
  });

  it("RTL center", () => {
    const ranges = new Ranges(true);
    ranges.add(0, 1);
    ranges.add(2, 3);
    const expected = 2.5;
    expect(ranges.center).toEqual(expected);
  });

  it("LTR getIntervals", () => {
    const ranges = new Ranges();
    ranges.add(0, 1);
    ranges.add(20, 30);
    const actual = ranges.getIntervals(true, 10);
    const expected = [
      [0, 10],
      [20, 30],
    ];
    expect(actual).toEqual(expected);
  });

  it("RTL getIntervals", () => {
    const ranges = new Ranges(true);
    ranges.add(0, 10);
    ranges.add(25, 30);
    const actual = ranges.getIntervals(true, 10);
    const expected = [
      [20, 30],
      [0, 10],
    ];
    expect(actual).toEqual(expected);
  });
});

describe("GeometricEntity", () => {
  it("center delegates to ranges.center", () => {
    const entity = new Entity(0, 0, 0, 10);
    const ranges = new Ranges();
    ranges.add(10, 30);
    const geo = new GeometricEntity(entity, ranges, 0);
    expect(geo.center).toEqual(ranges.center);
    expect(geo.center).toEqual(20);
  });

  it("stores entity and level", () => {
    const entity = new Entity(5, 1, 2, 8);
    const ranges = new Ranges();
    ranges.add(0, 0);
    const geo = new GeometricEntity(entity, ranges, 3);
    expect(geo.entity).toBe(entity);
    expect(geo.level).toBe(3);
  });
});

describe("EntityLine.render", () => {
  const textLine = new TextLine(0, 20);
  const label = new EntityLabelListItem(1, "LOC", "red", 30);
  const labels = new LabelList([label]);

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns empty array when element has no chars", () => {
    const element = makeSvgElement(0, "");
    const entityLine = new EntityLine(textLine);
    expect(entityLine.render(element, [], labels)).toEqual([]);
    expect(entityLine.render(element, [new Entity(0, 1, 0, 5)], labels)).toEqual([]);
  });

  it("renders entities using getClientRects", () => {
    const element = makeSvgElement(11, "hello world");
    const entity = new Entity(0, 1, 0, 5);
    jest
      .spyOn(document, "createRange")
      .mockReturnValue(makeMockRange([{ left: 10, right: 60 }]));

    const entityLine = new EntityLine(textLine);
    const result = entityLine.render(element, [entity], labels);

    expect(result).toHaveLength(1);
    expect(result[0].entity).toBe(entity);
    expect(result[0].level).toBe(0);
    expect(result[0].ranges.items[0]).toMatchObject({ x1: 10, x2: 60 });
  });

  it("assigns increasing levels to overlapping entities", () => {
    const element = makeSvgElement(20, "a".repeat(20));
    jest
      .spyOn(document, "createRange")
      .mockReturnValue(makeMockRange([{ left: 0, right: 100 }]));

    const entity1 = new Entity(0, 1, 0, 10);
    const entity2 = new Entity(1, 1, 0, 10);
    const entityLine = new EntityLine(textLine);
    const result = entityLine.render(element, [entity1, entity2], labels);

    expect(result[0].level).toBe(0);
    expect(result[1].level).toBe(1);
  });

  it("falls back to (0,0) range when node text shorter than entity end offset", () => {
    // nodeText.length=3, entity spans 0-15 → e=min(15,20)-0=15 > 3 → fallback
    const element = makeSvgElement(10, "abc");
    const entity = new Entity(0, 1, 0, 15);

    const entityLine = new EntityLine(textLine);
    const result = entityLine.render(element, [entity], labels);

    expect(result).toHaveLength(1);
    expect(result[0].ranges.items[0]).toMatchObject({ x1: 0, x2: 0 });
  });

  it("handles multi-rect entity spanning two lines", () => {
    const element = makeSvgElement(20, "a".repeat(20));
    jest
      .spyOn(document, "createRange")
      .mockReturnValue(
        makeMockRange([
          { left: 0, right: 50 },
          { left: 0, right: 30 },
        ])
      );

    const entity = new Entity(0, 1, 0, 10);
    const entityLine = new EntityLine(textLine);
    const result = entityLine.render(element, [entity], labels);

    expect(result[0].ranges.items).toHaveLength(2);
  });
});
