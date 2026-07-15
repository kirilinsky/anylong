# Changelog

## 1.0.0

- Initial release: `anylong`, `anylongParts`, `supported`.
- Inputs: number (ms or s), `Date`, two `Date`s, ISO 8601 duration strings,
  human shorthand strings, `Intl.DurationFormat` duration records.
- Options: `locale`, `style`, `unit`, `largestUnit`, `smallestUnit`, plus full
  `Intl.DurationFormat` option passthrough.
- Deterministic rejection of ambiguous input (colon strings, negatives,
  fractions in shorthand, unknown keys) with descriptive errors.
