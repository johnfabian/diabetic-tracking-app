import { describe, expect, it } from "vitest";
import {
  glucoseTone,
  isValidLocalDatetime,
  localDatetimeValue,
} from "@/lib/format";

describe("localDatetimeValue", () => {
  it("formats a date as a complete datetime-local value", () => {
    expect(localDatetimeValue(new Date(2026, 5, 11, 9, 5))).toBe("2026-06-11T09:05");
  });

  it("is always accepted by isValidLocalDatetime", () => {
    expect(isValidLocalDatetime(localDatetimeValue())).toBe(true);
  });
});

describe("isValidLocalDatetime", () => {
  it.each(["2026-06-11T14:30", "2026-01-01T00:00", "2026-06-11T14:30:15"])(
    "accepts %s",
    (value) => expect(isValidLocalDatetime(value)).toBe(true),
  );

  it.each(["", "2026-06-11", "2026-06-11T14", "14:30", "yesterday", "2026-13-45T99:99"])(
    "rejects %s",
    (value) => expect(isValidLocalDatetime(value)).toBe(false),
  );
});

describe("glucoseTone", () => {
  it("classifies low / ok / high around the target band", () => {
    expect(glucoseTone(65)).toBe("low");
    expect(glucoseTone(70)).toBe("ok");
    expect(glucoseTone(180)).toBe("ok");
    expect(glucoseTone(181)).toBe("high");
  });

  it("honors a custom target range", () => {
    expect(glucoseTone(90, { low: 100, high: 140 })).toBe("low");
  });
});
