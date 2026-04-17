# Nico Nico investigation notes

## Host map after DNS/subdomain validation

### Confirmed

- `sp.manga.nicovideo.jp` = viewer/entry host
- `manga.nicovideo.jp` = related manga host in the same tree
- `nicomanga.jp` = active domain with multiple subdomains

### Not confirmed by subdomain enumeration

- `api.nicomanga.jp`
- `drm.cdn.nicomanga.jp`

These hostnames may still exist at runtime, but they are not validated just because they were expected ahead of time.

## What this changes in the project

1. The viewer entry point is confirmed.
2. The API/CDN hostnames must be treated as runtime evidence, not assumptions.
3. The next phase remains viewer-network interception.
4. The probe should watch broadly across the `nicovideo.jp` and `nicomanga.jp` trees and then rank candidate endpoints by evidence.

## Working conclusion

The project already proved that:

- the episode metadata can be extracted from the initial payload
- `player_type` is `scroll`
- `frameCount` exists in the hydrated metadata path
- the first visible CDN materials are not the complete reading sequence

So the remaining technical question is now narrower:

> Which hydrated request yields the actual reading index for the episode?

## Immediate execution checklist

- install Playwright locally
- install Chromium for Playwright
- run `npm run probe:viewer`
- inspect `probe-report.json`
- inspect `candidateFindings`
- confirm whether the reading unit is full image, frame, or cropped scroll metadata
- only then refine `/reader`
