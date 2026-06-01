## Purpose
Detect stale downstream artifacts.

## Why It Exists
A pipeline can be correct but outdated.

## Example

- Normalization updated
- Chunking not rerun
- Themes not rerun

## Result:
Themes = stale

##  Responsibilities

- Compare hashes
- Compare timestamps
- Detect stale stages

## Manual Validation

```bash
npm run freshness:company -- MSFT
```

## Status Definitions

- healthy
- warning
- failed
- stale