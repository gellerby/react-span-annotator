import { Entity } from "@/domain/models/Label/Entity";
import { Entities } from "@/domain/models/Label/Entity";
import { Text } from "@/domain/models/Label/Text";

describe("Entities", () => {
  it("can be filtered by range", () => {
    const content = "example text";
    const entities = new Entities([
      new Entity(0, 0, 0, content.length),
      new Entity(0, 0, 0, content.length + 1),
      new Entity(0, 0, content.length, content.length + 1),
    ]);
    const expected = [
      new Entity(0, 0, 0, content.length),
      new Entity(0, 0, 0, content.length + 1),
    ];
    const actual = entities.filterByRange(0, content.length);
    expect(actual).toEqual(expected);
  });

  it("can filter by range", () => {
    const entities = new Entities([new Entity(0, 0, 1, 5)]);
    expect(entities.filterByRange(0, 1).length == 0).toBeTruthy();
    expect(entities.filterByRange(1, 5).length == 0).toBeFalsy();
    expect(entities.filterByRange(1, 6).length == 0).toBeFalsy();
    expect(entities.filterByRange(4, 6).length == 0).toBeFalsy();
    expect(entities.filterByRange(5, 6).length == 0).toBeTruthy();
  });

  it("return empty list by filtering", () => {
    const entities = new Entities([]);
    expect(entities.filterByRange(0, 1)).toEqual([]);
  });

  it("can get size", () => {
    const entities = new Entities([new Entity(0, 0, 0, 0)]);
    expect(entities.size).toEqual(1);
  });

  it("find by id", () => {
    const entity = new Entity(1, 0, 0, 0);
    const entities = new Entities([entity]);
    expect(entities.findById(1)).toEqual(entity);
    expect(entities.findById(0)).toBeUndefined();
  });

  it("intersect any", () => {
    const entities = new Entities([new Entity(0, 0, 1, 5)]);
    expect(entities.intersectAny(0, 1)).toBeFalsy();
    expect(entities.intersectAny(0, 2)).toBeTruthy();
    expect(entities.intersectAny(4, 6)).toBeTruthy();
    expect(entities.intersectAny(5, 6)).toBeFalsy();
    expect(entities.intersectAny(1, 5)).toBeTruthy();
  });
});

describe("Entities.valueOf", () => {
  it("without text maps offsets directly", () => {
    const raw = [new Entity(0, 0, 1, 3), new Entity(1, 0, 5, 8)];
    const entities = Entities.valueOf(raw);
    expect(entities.findById(0)!.startOffset).toBe(1);
    expect(entities.findById(0)!.endOffset).toBe(3);
    expect(entities.findById(1)!.startOffset).toBe(5);
  });

  it("with text converts grapheme offsets to code point offsets", () => {
    // "👶🏻👦🏻" — each emoji is 4 code points, grapheme offsets 0,1,2
    const text = new Text("👶🏻👦🏻");
    const raw = [new Entity(0, 0, 0, 1)]; // grapheme offsets
    const entities = Entities.valueOf(raw, text);
    // grapheme 0 → codepoint 0, grapheme 1 → codepoint 4
    expect(entities.findById(0)!.startOffset).toBe(0);
    expect(entities.findById(0)!.endOffset).toBe(4);
  });
});
