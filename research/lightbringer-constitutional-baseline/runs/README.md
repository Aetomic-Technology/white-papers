# Run Archive

Each execution of `LB-EXP-001` creates a new timestamped directory here.

Generated run artifacts must not be manually edited. If commentary, criticism or human ratification is added later, publish it as a separate file rather than modifying `raw-output.md` or `deliberation-record.json`.

A run directory should contain:

- `raw-output.md`
- `deliberation-record.json`
- `manifest.json`

The `manifest.json` file records SHA-256 hashes for the fixed input, doctrine, raw output and deliberation record so later changes can be detected.
