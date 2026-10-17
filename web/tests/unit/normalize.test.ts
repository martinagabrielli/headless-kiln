import { describe, expect, it } from "vitest";
import { camelizeKeys, normalizeUri, parseBlockFields, slugFromUri, uriFromSlug } from "@/lib/content/normalize";

describe("camelizeKeys", () => {
  it("converts keys at every depth, including repeater rows", () => {
    expect(
      camelizeKeys({
        primary_link: { title: "Go", url: "/" },
        items: [{ image_position: "left", nested_rows: [{ row_title: "x" }] }],
      }),
    ).toEqual({
      primaryLink: { title: "Go", url: "/" },
      items: [{ imagePosition: "left", nestedRows: [{ rowTitle: "x" }] }],
    });
  });

  it("leaves values alone", () => {
    expect(camelizeKeys({ heading: "snake_case stays" })).toEqual({ heading: "snake_case stays" });
  });
});

describe("parseBlockFields", () => {
  it("parses and camelizes the JSON from WordPress", () => {
    expect(parseBlockFields('{"image_position":"right","limit":4}')).toEqual({ imagePosition: "right", limit: 4 });
  });

  it.each([null, undefined, "", "not json", "[1,2]", "null"])("returns an empty object for %j", (input) => {
    expect(parseBlockFields(input)).toEqual({});
  });
});

describe("URIs", () => {
  it.each([
    ["", "/"],
    ["/", "/"],
    ["about", "/about/"],
    ["/workshops/glazing", "/workshops/glazing/"],
    ["//about//", "/about/"],
  ])("normalizes %j to %j", (input, expected) => {
    expect(normalizeUri(input)).toBe(expected);
  });

  it("round-trips between route params and URIs", () => {
    expect(uriFromSlug(undefined)).toBe("/");
    expect(uriFromSlug(["workshops", "taster-session"])).toBe("/workshops/taster-session/");
    expect(slugFromUri("/workshops/taster-session/")).toEqual(["workshops", "taster-session"]);
    expect(slugFromUri("/")).toEqual([]);
  });
});
