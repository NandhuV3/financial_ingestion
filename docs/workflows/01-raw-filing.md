## Purpose
Understand the original SEC filing before any processing.

## Why It Exists
Every downstream stage depends on the raw filing.
If extraction fails, debugging always starts here.

## Input
data/{ticker}/raw/latest-10q.html

## Output
Raw SEC filing HTML

## Responsibilities

- Store original filing
- Preserve source of truth
- Support auditing


##  Manual Validation

```bash
head -100 data/MSFT/raw/latest-10q.html
```

```bash
grep -ni "ITEM 1A" data/MSFT/raw/latest-10q.html
```

##  Questions To Ask

- What does SEC HTML look like?
- Where is Risk Factors located?
- Where is Management Discussion located?


##  Common Problems

- Filing download failure
- Wrong filing selected
- SEC HTML structure changes