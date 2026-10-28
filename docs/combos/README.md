# Combo stubs (Soft HOLD)

Shared **Combo stub** schema and templates for banking **Who / Why / What worked** (plus optional **what_failed** and **next_prep**) without Notion.

This folder is **documentation only**. It is not validated by `npm run validate`, not published on the showstack site, and introduces **no publish face**, **no Stripe**, and **no CreateAgent** wiring.

## Policy

| Flag | Meaning |
|------|---------|
| **Soft HOLD** | Draft stubs only; **no merge without Door** for anything that leaves HOLD. |
| **Keep-20** | Cap ~20 active stub rows per seat; archive or promote deliberately. |
| **M never Notion** | M seat banks combos in git/files (e.g. MIGU OS `Learning/Combos/`), not Notion. |
| **Leaders reuse** | Copy the markdown template; fill YAML or front matter to match `schema/combo-stub.schema.json`. |

## Files

| Path | Purpose |
|------|---------|
| [`../../schema/combo-stub.schema.json`](../../schema/combo-stub.schema.json) | JSON Schema for one stub row |
| [`combo-stub.template.md`](combo-stub.template.md) | Copy-paste markdown skeleton |
| [`examples/t507-greninja-stub.example.yaml`](examples/t507-greninja-stub.example.yaml) | One fictional Soft HOLD example |

## Why this lives under `docs/combos/`

showstack is an open **live-tech discovery index** (protocols, software, hardware). Combo banking is **MIGU OS / seat learning** metadata. Keeping stubs here is a minimal, shared anchor in an already-public repo; it is not a product surface for showstack itself.
