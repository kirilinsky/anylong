import { afterEach, describe, expect, it, vi } from "vitest";
import {
  anylong,
  anylongParts,
  supported,
  type DurationFormatOptions,
  type DurationRecord,
} from "./index";

const DF = (
  Intl as unknown as {
    DurationFormat: new (
      l?: string | string[],
      o?: DurationFormatOptions,
    ) => { format(d: DurationRecord): string };
  }
).DurationFormat;

const en = (record: DurationRecord, opts: DurationFormatOptions = {}) =>
  new DF("en", { style: "short", ...opts }).format(record);

describe("feature detection", () => {
  it("reports Intl.DurationFormat as supported on this runtime", () => {
    expect(supported).toBe(true);
    expect(typeof DF).toBe("function");
  });
});

describe("number input", () => {
  it("reads milliseconds by default and decomposes", () => {
    expect(anylong(9_000_000, { locale: "en" })).toBe(
      en({ hours: 2, minutes: 30 }),
    );
  });

  it("reads seconds with unit: 's'", () => {
    expect(anylong(90, { locale: "en", unit: "s" })).toBe(
      en({ minutes: 1, seconds: 30 }),
    );
  });

  it("formats zero as a visible 0 seconds", () => {
    const out = anylong(0, { locale: "en" });
    expect(out).toBe(en({ seconds: 0 }, { secondsDisplay: "always" }));
    expect(out).not.toBe("");
  });

  it("formats sub-second values in milliseconds", () => {
    expect(anylong(450, { locale: "en" })).toBe(en({ milliseconds: 450 }));
  });

  it("formats exactly one hour without smaller units", () => {
    expect(anylong(3_600_000, { locale: "en" })).toBe(en({ hours: 1 }));
  });

  it("decomposes multi-day durations up to days by default", () => {
    // 1d 1h 1m 1s 1ms
    expect(anylong(90_061_001, { locale: "en" })).toBe(
      en({ days: 1, hours: 1, minutes: 1, seconds: 1, milliseconds: 1 }),
    );
  });

  it("skips zero units in the middle", () => {
    expect(anylong(86_400_000 + 5_000, { locale: "en" })).toBe(
      en({ days: 1, seconds: 5 }),
    );
  });

  it("carries over at unit boundaries instead of rounding into the wrong unit", () => {
    expect(anylong(999, { locale: "en" })).toBe(en({ milliseconds: 999 }));
    expect(anylong(1000, { locale: "en" })).toBe(en({ seconds: 1 }));
    expect(anylong(59_999, { locale: "en" })).toBe(
      en({ seconds: 59, milliseconds: 999 }),
    );
    expect(anylong(60_000, { locale: "en" })).toBe(en({ minutes: 1 }));
    expect(anylong(3_599_999, { locale: "en" })).toBe(
      en({ minutes: 59, seconds: 59, milliseconds: 999 }),
    );
    expect(anylong(3_600_000, { locale: "en" })).toBe(en({ hours: 1 }));
  });

  it("rejects negative numbers", () => {
    expect(() => anylong(-5_000)).toThrow(/negative durations are not supported/i);
  });

  it("rejects NaN and Infinity", () => {
    expect(() => anylong(NaN)).toThrow(/NaN/);
    expect(() => anylong(Infinity)).toThrow(/accepted inputs/i);
  });
});

describe("Date input", () => {
  afterEach(() => vi.useRealTimers());

  it("formats the distance from now for a past date", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-15T12:00:00Z"));
    expect(anylong(new Date("2026-07-15T09:30:00Z"), { locale: "en" })).toBe(
      en({ hours: 2, minutes: 30 }),
    );
  });

  it("uses the absolute value for future dates", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-15T12:00:00Z"));
    expect(anylong(new Date("2026-07-15T14:30:00Z"), { locale: "en" })).toBe(
      en({ hours: 2, minutes: 30 }),
    );
  });

  it("rejects invalid dates", () => {
    expect(() => anylong(new Date("nope"))).toThrow(/invalid date/i);
  });
});

describe("two-date form", () => {
  it("formats the duration between two dates, order-independent", () => {
    const a = new Date("2026-07-01T10:00:00Z");
    const b = new Date("2026-07-02T14:30:00Z");
    const expected = en({ days: 1, hours: 4, minutes: 30 });
    expect(anylong(a, b, { locale: "en" })).toBe(expected);
    expect(anylong(b, a, { locale: "en" })).toBe(expected);
  });

  it("measures real elapsed time across a DST boundary", () => {
    // Europe/Berlin springs forward on 2026-03-29: 02:00 CET → 03:00 CEST.
    // Wall clock shows 4 hours; only 3 real hours elapse.
    const before = new Date("2026-03-29T00:00:00+01:00");
    const after = new Date("2026-03-29T04:00:00+02:00");
    expect(anylong(before, after, { locale: "en" })).toBe(en({ hours: 3 }));
  });

  it("rejects a Date second argument when the first is not a Date", () => {
    expect(() =>
      anylong("2h" as never, new Date(), { locale: "en" }),
    ).toThrow(/two-argument date form/i);
  });

  it("rejects a third argument outside the two-date form", () => {
    expect(() =>
      (anylong as (...a: unknown[]) => string)(5_000, {}, {}),
    ).toThrow(/two-date form/i);
  });

  it("rejects invalid dates", () => {
    expect(() => anylong(new Date("nope"), new Date())).toThrow(/invalid date/i);
  });
});

describe("ISO 8601 strings", () => {
  it("parses time components", () => {
    expect(anylong("PT2H30M", { locale: "en" })).toBe(en({ hours: 2, minutes: 30 }));
  });

  it("parses mixed date and time components", () => {
    expect(anylong("P1DT4H", { locale: "en" })).toBe(en({ days: 1, hours: 4 }));
  });

  it("parses weeks and is case-insensitive", () => {
    expect(anylong("p3w", { locale: "en" })).toBe(en({ weeks: 3 }));
    expect(anylong("p1dt4h", { locale: "en" })).toBe(en({ days: 1, hours: 4 }));
  });

  it("keeps ISO units as given — no re-decomposition", () => {
    expect(anylong("PT90M", { locale: "en" })).toBe(en({ minutes: 90 }));
  });

  it("parses fractional seconds into milliseconds", () => {
    expect(anylong("PT1.5S", { locale: "en" })).toBe(
      en({ seconds: 1, milliseconds: 500 }),
    );
    expect(anylong("PT1,5S", { locale: "en" })).toBe(
      en({ seconds: 1, milliseconds: 500 }),
    );
  });

  it("carries a rounded-up fractional second into whole seconds", () => {
    // .9995 * 1000 rounds to 1000ms, which must carry into seconds, not
    // render as an invalid "1000 milliseconds".
    expect(anylong("PT1.9995S", { locale: "en" })).toBe(en({ seconds: 2 }));
  });

  it("distinguishes months from minutes by position", () => {
    expect(anylong("P2M", { locale: "en" })).toBe(en({ months: 2 }));
    expect(anylong("PT2M", { locale: "en" })).toBe(en({ minutes: 2 }));
  });

  it("rejects component-less and malformed forms", () => {
    expect(() => anylong("P")).toThrow(/no components/i);
    expect(() => anylong("PT")).toThrow(/no components/i);
    expect(() => anylong("P1S")).toThrow(/cannot parse iso 8601/i);
    expect(() => anylong("PT1.5H")).toThrow(/cannot parse iso 8601/i);
  });

  it("rejects signed durations", () => {
    expect(() => anylong("-P1D")).toThrow(/signed iso 8601/i);
  });
});

describe("shorthand strings", () => {
  it("parses compact units", () => {
    expect(anylong("2h 30m", { locale: "en" })).toBe(en({ hours: 2, minutes: 30 }));
    expect(anylong("1d 4h 20s", { locale: "en" })).toBe(
      en({ days: 1, hours: 4, seconds: 20 }),
    );
  });

  it("keeps units as given — '90s' stays 90 seconds", () => {
    expect(anylong("90s", { locale: "en" })).toBe(en({ seconds: 90 }));
  });

  it("parses full English words", () => {
    expect(anylong("2 hours 30 minutes", { locale: "en" })).toBe(
      en({ hours: 2, minutes: 30 }),
    );
  });

  it("is case-insensitive and order-independent", () => {
    expect(anylong("30M 2H", { locale: "en" })).toBe(en({ hours: 2, minutes: 30 }));
    expect(anylong("2 Hours, 30 Minutes", { locale: "en" })).toBe(
      en({ hours: 2, minutes: 30 }),
    );
  });

  it("parses glued tokens like '2h30m'", () => {
    expect(anylong("2h30m", { locale: "en" })).toBe(en({ hours: 2, minutes: 30 }));
  });

  it("maps 'm' to minutes and 'mo' to months", () => {
    expect(anylong("2m", { locale: "en" })).toBe(en({ minutes: 2 }));
    expect(anylong("2mo", { locale: "en" })).toBe(en({ months: 2 }));
  });

  it("rejects repeated units", () => {
    expect(() => anylong("2h 3h")).toThrow(/more than once/i);
    expect(() => anylong("2h 30min 1 hour")).toThrow(/more than once/i);
  });

  it("rejects unknown units, fractions, and garbage", () => {
    expect(() => anylong("2 fortnights")).toThrow(/unknown unit/i);
    expect(() => anylong("1.5h")).toThrow(/fractional/i);
    expect(() => anylong("hello world")).toThrow(/cannot parse duration string/i);
    expect(() => anylong("")).toThrow(/empty string/i);
    expect(() => anylong("   ")).toThrow(/empty string/i);
  });
});

describe("what it refuses to guess", () => {
  it("rejects colon notation as ambiguous", () => {
    expect(() => anylong("1:30")).toThrow(/ambiguous/i);
    expect(() => anylong("01:02:03")).toThrow(/ambiguous/i);
    expect(() => anylong("1:30")).toThrow(/hours:minutes or minutes:seconds/i);
  });

  it("rejects null, booleans, and arrays with the accepted-inputs list", () => {
    expect(() => anylong(null as never)).toThrow(/accepted inputs/i);
    expect(() => anylong(true as never)).toThrow(/accepted inputs/i);
    expect(() => anylong([1000] as never)).toThrow(/accepted inputs/i);
    expect(() => anylong(undefined as never)).toThrow(/accepted inputs/i);
  });
});

describe("duration objects", () => {
  it("passes records through untouched", () => {
    expect(anylong({ hours: 2, minutes: 30 }, { locale: "en" })).toBe(
      en({ hours: 2, minutes: 30 }),
    );
    expect(anylong({ years: 1, months: 2 }, { locale: "en" })).toBe(
      en({ years: 1, months: 2 }),
    );
  });

  it("keeps an explicit all-zero record visible", () => {
    const out = anylong({ hours: 0 }, { locale: "en" });
    expect(out).toBe(en({ hours: 0 }, { hoursDisplay: "always" }));
    expect(out).not.toBe("");
  });

  it("lets an explicit display option win over the zero-visibility fallback", () => {
    expect(anylong(0, { locale: "en", secondsDisplay: "auto" })).toBe("");
  });

  it("ignores undefined values", () => {
    expect(anylong({ hours: undefined, minutes: 5 }, { locale: "en" })).toBe(
      en({ minutes: 5 }),
    );
  });

  it("rejects unknown keys", () => {
    expect(() => anylong({ hourz: 2 } as never)).toThrow(/unknown duration key "hourz"/i);
  });

  it("rejects empty objects", () => {
    expect(() => anylong({})).toThrow(/empty duration object/i);
  });

  it("rejects negative and non-integer values", () => {
    expect(() => anylong({ hours: -1 })).toThrow(/non-negative integers/i);
    expect(() => anylong({ hours: 1.5 })).toThrow(/non-negative integers/i);
    expect(() => anylong({ hours: "2" } as never)).toThrow(/non-negative integers/i);
  });
});

describe("largestUnit / smallestUnit", () => {
  it("clamps the largest unit", () => {
    expect(anylong(90_061_000, { locale: "en", largestUnit: "hours" })).toBe(
      en({ hours: 25, minutes: 1, seconds: 1 }),
    );
  });

  it("unlocks weeks when asked", () => {
    expect(anylong(30 * 86_400_000, { locale: "en", largestUnit: "weeks" })).toBe(
      en({ weeks: 4, days: 2 }),
    );
  });

  it("rounds at the smallest unit", () => {
    expect(anylong(1_500, { locale: "en", smallestUnit: "seconds" })).toBe(
      en({ seconds: 2 }),
    );
    expect(anylong(1_400, { locale: "en", smallestUnit: "seconds" })).toBe(
      en({ seconds: 1 }),
    );
  });

  it("shows zero in the requested smallest unit when everything rounds away", () => {
    const out = anylong(400, { locale: "en", smallestUnit: "seconds" });
    expect(out).toBe(en({ seconds: 0 }, { secondsDisplay: "always" }));
    expect(out).not.toBe("");
  });

  it("applies to the two-date form", () => {
    const a = new Date("2026-07-01T10:00:00.200Z");
    const b = new Date("2026-07-01T10:00:05.900Z");
    expect(anylong(a, b, { locale: "en", smallestUnit: "seconds" })).toBe(
      en({ seconds: 6 }),
    );
  });

  it("rejects an inverted range", () => {
    expect(() =>
      anylong(1_000, { largestUnit: "seconds", smallestUnit: "hours" }),
    ).toThrow(/largestUnit "seconds" is smaller than smallestUnit "hours"/);
  });
});

describe("styles and passthrough options", () => {
  it("defaults to short and accepts long / narrow / digital", () => {
    const rec = { hours: 1, minutes: 1, seconds: 1 };
    expect(anylong(3_661_000, { locale: "en" })).toBe(en(rec));
    for (const style of ["long", "short", "narrow", "digital"] as const) {
      expect(anylong(3_661_000, { locale: "en", style })).toBe(en(rec, { style }));
    }
  });

  it("passes per-unit Intl.DurationFormat options through", () => {
    expect(
      anylong({ minutes: 5 }, { locale: "en", hoursDisplay: "always" }),
    ).toBe(en({ minutes: 5 }, { hoursDisplay: "always" }));
    expect(
      anylong({ hours: 2 }, { locale: "en", hours: "long" }),
    ).toBe(en({ hours: 2 }, { hours: "long" }));
  });
});

describe("locales", () => {
  const rec = { hours: 2, minutes: 30 };

  it("formats Russian", () => {
    const expected = new DF("ru", { style: "long" }).format(rec);
    expect(anylong("2h 30m", { locale: "ru", style: "long" })).toBe(expected);
    expect(expected).toMatch(/час/);
  });

  it("formats German", () => {
    const expected = new DF("de", { style: "long" }).format(rec);
    expect(anylong("PT2H30M", { locale: "de", style: "long" })).toBe(expected);
    expect(expected).toMatch(/Stunden/);
  });

  it("accepts a fallback array", () => {
    expect(anylong(rec, { locale: ["xx-invalid", "en"] })).toBe(en(rec));
  });
});

describe("anylongParts", () => {
  it("joins back to the anylong string", () => {
    const parts = anylongParts("2h 30m", { locale: "en" });
    expect(parts.map((p) => p.value).join("")).toBe(
      anylong("2h 30m", { locale: "en" }),
    );
  });

  it("supports the two-date form", () => {
    const a = new Date("2026-07-01T10:00:00Z");
    const b = new Date("2026-07-01T12:30:00Z");
    const parts = anylongParts(a, b, { locale: "en" });
    expect(parts.map((p) => p.value).join("")).toBe(anylong(a, b, { locale: "en" }));
  });
});
