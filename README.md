<p align="center">
  <img src="./logo.png" alt="anylong logo" width="230" />
</p>

<h1 align="center">anylong</h1>

<p align="center">
  <a href="https://www.npmjs.com/package/anylong"><img src="https://img.shields.io/npm/v/anylong?style=flat-square&color=black" alt="npm" /></a>
  <a href="https://bundlephobia.com/package/anylong"><img src="https://img.shields.io/bundlephobia/minzip/anylong?style=flat-square&color=black&label=gzip" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/npm/l/anylong?style=flat-square&color=black" alt="license" /></a>
  <a href="https://codecov.io/gh/kirilinsky/anylong"><img src="https://codecov.io/gh/kirilinsky/anylong/graph/badge.svg" alt="coverage" /></a>
</p>

<p align="center">
  <strong>Any duration in, localized string out.</strong>
  <br />
  A micro wrapper around native <code>Intl.DurationFormat</code> — one function, zero data files, any locale.
</p>

<p align="center">
  <a href="https://anyfamily.site">▸ any* family</a>
  &nbsp;·&nbsp;
  <a href="https://anylong.vercel.app/">▸ demo</a>
</p>

---

**One function. Any reasonable input. Any locale. ~2.5kb gzip. Zero dependencies.**

Throw a number, a `Date`, two `Date`s, an ISO 8601 duration, a shorthand
string, or a plain object at it — get a localized duration string back.
Detection is deterministic: ambiguous input throws instead of guessing.

```ts
import { anylong } from "anylong";

anylong(9_000_000); // "2 hr, 30 min"       — milliseconds
anylong("PT2H30M"); // "2 hr, 30 min"       — ISO 8601
anylong("2h 30m"); // "2 hr, 30 min"       — shorthand
anylong({ hours: 2, minutes: 30 }); // "2 hr, 30 min"       — duration record
anylong(startedAt, finishedAt); // duration between two Dates
anylong(deadline); // duration between a Date and now

anylong("P1DT4H", { locale: "ru", style: "long" }); // "1 день 4 часа"
anylong({ hours: 2, minutes: 30 }, { style: "digital" }); // "2:30:00"
```

---

## install

```bash
npm install anylong
```

---

## inputs

Every input kind, one function. Detection order is fixed and deterministic.

### number — milliseconds (or seconds)

Auto-decomposed into the largest sensible units, up to days. Zero units are
skipped; smaller units appear only when non-zero.

```ts
anylong(0); // "0 sec"
anylong(450); // "450 ms"
anylong(3_600_000); // "1 hr"
anylong(90_061_001); // "1 day, 1 hr, 1 min, 1 sec, 1 ms"

anylong(90, { unit: "s" }); // "1 min, 30 sec"  — seconds in
```

### Date — distance from now

Past or future, always the absolute value.

```ts
anylong(post.createdAt); // "3 hr, 12 min"
anylong(deadline); // works for future dates too
```

### two Dates — distance between them

Order-independent. Measured in real elapsed time, so DST boundaries don't
lie to you.

```ts
anylong(startedAt, finishedAt); // "1 day, 4 hr, 30 min"
anylong(finishedAt, startedAt); // same
anylong(startedAt, finishedAt, { locale: "de" });
```

### string — ISO 8601 duration

`"PT2H30M"`, `"P1DT4H"`, `"P3W"`… Case-insensitive, parsed with a small
regex, no Temporal dependency. Units are kept as given — `"PT90M"` stays
`"90 min"`.

```ts
anylong("PT2H30M"); // "2 hr, 30 min"
anylong("P1DT4H"); // "1 day, 4 hr"
anylong("PT1.5S"); // "1 sec, 500 ms"
```

### string — human shorthand

Case-insensitive, order-independent, English units in v1. `m` is minutes,
`mo` is months. Repeated units are an error.

```ts
anylong("2h 30m"); // "2 hr, 30 min"
anylong("1d 4h 20s"); // "1 day, 4 hr, 20 sec"
anylong("90s"); // "90 sec" — units kept as given
anylong("2 hours 30 minutes"); // "2 hr, 30 min"
```

### object — Intl.DurationFormat record

Passed through untouched. Accepted keys: `years`, `months`, `weeks`, `days`,
`hours`, `minutes`, `seconds`, `milliseconds` (plus `microseconds` and
`nanoseconds`). Unknown keys are an error.

```ts
anylong({ hours: 2, minutes: 30 });
anylong({ years: 1, months: 2 }, { style: "long" });
```

---

## what it refuses to guess

Deterministic beats clever. Every rejection throws with what was received
and what is accepted — this is a feature.

```ts
anylong("1:30");
// ✗ ambiguous — hours:minutes or minutes:seconds?
//   Use "1h 30m", "PT1H30M", or { hours: 1, minutes: 30 }.

anylong(-5_000); // ✗ negative — pass the absolute value or two Dates
anylong("1.5h"); // ✗ fractional shorthand — use "90m" or milliseconds
anylong("2h 3h"); // ✗ repeated unit
anylong(new Date("x")); // ✗ invalid Date
anylong({ hourz: 2 }); // ✗ unknown key, accepted keys listed
anylong(NaN); // ✗ with the full accepted-inputs list
```

---

## options

| Option         | Type                                         | Default          | Applies to      |
| -------------- | -------------------------------------------- | ---------------- | --------------- |
| `locale`       | `string \| string[]`                         | runtime locale   | all             |
| `style`        | `"long" \| "short" \| "narrow" \| "digital"` | `"short"`        | all             |
| `unit`         | `"ms" \| "s"`                                | `"ms"`           | number input    |
| `largestUnit`  | `"weeks" … "milliseconds"`                   | `"days"`         | number, Date(s) |
| `smallestUnit` | `"weeks" … "milliseconds"`                   | `"milliseconds"` | number, Date(s) |
| …rest          | any `Intl.DurationFormat` option             | —                | all             |

`largestUnit` / `smallestUnit` clamp the decomposition of elapsed time
(number and Date inputs). Values are rounded at `smallestUnit`. Inputs that
already carry units (ISO, shorthand, objects) are passed through as-is.

```ts
anylong(90_061_000, { largestUnit: "hours" }); // "25 hr, 1 min, 1 sec"
anylong(30 * 86_400_000, { largestUnit: "weeks" }); // "4 wks, 2 days"
anylong(1_500, { smallestUnit: "seconds" }); // "2 sec" — never shows ms
```

Everything else — `fractionalDigits`, per-unit styles like `hours: "2-digit"`,
`hoursDisplay: "always"`, `numberingSystem` — goes straight to
`Intl.DurationFormat`.

```ts
anylong({ minutes: 5 }, { hoursDisplay: "always", style: "digital" }); // "0:05:00"
```

---

## styles

```ts
anylong("2h 30m", { style: "long" }); // "2 hours, 30 minutes"
anylong("2h 30m", { style: "short" }); // "2 hr, 30 min"       (default)
anylong("2h 30m", { style: "narrow" }); // "2h 30m"
anylong("2h 30m", { style: "digital" }); // "2:30:00"
```

---

## locales

Any BCP 47 tag, fallback arrays included. No locale files, no plugins —
native `Intl` ships the data.

```ts
anylong("2h 30m", { locale: "ru", style: "long" }); // "2 часа 30 минут"
anylong("2h 30m", { locale: "de", style: "long" }); // "2 Stunden, 30 Minuten"
anylong("2h 30m", { locale: "ja" }); // "2 時間 30 分"
anylong("2h 30m", { locale: ["sr-Latn-RS", "en"] });
```

---

## parts

`anylongParts()` takes the same arguments and returns `{ type, value, unit? }`
parts — style the numbers apart from the units.

```tsx
import { anylongParts } from "anylong";

anylongParts("2h 30m", { locale: "en" }).map((p, i) =>
  p.type === "integer" ? <b key={i}>{p.value}</b> : p.value,
);
```

---

## feature detection

`Intl.DurationFormat` is [Baseline 2025](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DurationFormat)
— available in all current browsers, Node.js 23+, Deno, and Bun. On older
runtimes anylong throws a clear error at call time; check the `supported`
flag to degrade gracefully.

```ts
import { anylong, supported } from "anylong";

supported ? anylong(ms) : `${Math.round(ms / 60000)} min`;
```

---

## stability

anylong follows [semver](https://semver.org/). Since 1.0.0 the public API —
`anylong`, `anylongParts`, `supported`, and the exported types — only changes
shape in a major release. Exact formatted strings come from `Intl` and may
vary between ICU versions, so never assert on them across environments.

---

## the any\* family

Small, zero-dependency `Intl` wrappers that share one idea: any input in,
localized string out. [anyfamily.site](https://anyfamily.site) ·
[npmjs.com/package/anyfamily](https://www.npmjs.com/package/anyfamily)

 