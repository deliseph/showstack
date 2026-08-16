# showstack

**The open index of live entertainment technology.**

The protocols, standards, software, hardware and vocabulary that live shows actually run on, in one machine-readable place, with a citation on every fact.

[![validate](https://github.com/deliseph/showstack/actions/workflows/validate.yml/badge.svg)](https://github.com/deliseph/showstack/actions/workflows/validate.yml)
[![data licence: CC BY 4.0](https://img.shields.io/badge/data-CC--BY--4.0-7dd3c0)](./LICENSE-DATA)
[![code licence: MIT](https://img.shields.io/badge/code-MIT-7dd3c0)](./LICENSE)
[![good first issues](https://img.shields.io/github/issues/deliseph/showstack/good%20first%20issue?color=f0b866&label=good%20first%20issues)](https://github.com/deliseph/showstack/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)

---

## Why this exists

Every technical director, systems integrator and production electrician has answered the same questions a hundred times:

- What port does sACN run on, and why is it fighting with the other console?
- Does this media server actually receive PSN, or only RTTrPM?
- Which ANSI standard covers powered hoists, and can I read it without paying?
- The Taiwanese crew said 吊桿 and the Hong Kong crew said 吊杆. Same thing?

The answers exist. They are scattered across PDFs behind paywalls, vendor manuals, forum threads from 2011, and the heads of people who are currently in a truck. None of it is machine-readable, so no tool can use it.

showstack is the attempt to put it in one place, with a source on every claim, under a licence that lets anyone build on it.

## What is in it

| Collection | What it holds |
|---|---|
| `data/protocols/` | Wire protocols and transports. Ports, multicast ranges, addressing models, open source implementations, and the gotchas that bite at 2am. |
| `data/software/` | Control, playback and design software, and crucially **which protocols each one speaks, in which direction**. |
| `data/hardware/` | Consoles, media servers, gateways, switches, tracking systems, and what they speak. |
| `data/standards/` | ANSI E1.x, SMPTE, AES, IEC. Designation, scope, status, and whether you can read it for free. |
| `data/terms/` | Bilingual EN / 繁中 vocabulary, with the regional variants and false friends that cause real confusion on headset. |

The interop matrix ("what can receive PSN?") is **computed**, not stored. You write `speaks` once on a product and the reverse index falls out.

## Use it

**Free JSON API.** No key, no rate limit, no tracking.

```
GET /api/v1/protocols.json
GET /api/v1/software.json
GET /api/v1/hardware.json
GET /api/v1/standards.json
GET /api/v1/terms.json
GET /api/v1/gaps.json          # everything we know is missing
GET /api/v1/index.json         # counts and endpoints
```

**JavaScript**

```bash
npm install showstack
```

```js
import { protocols, whoSpeaks, byPort, search } from 'showstack'

byPort(5568)            // -> [{ id: 'sacn', ... }, { id: 'acn', ... }]
whoSpeaks('psn')        // -> every indexed product that sends or receives PosiStageNet
search('吊桿')           // -> the glossary entry, with the HK/TW variants
protocols.find(p => p.id === 'art-net').gotchas
```

**Python**

```bash
pip install showstack
```

```python
from showstack import by_port, who_speaks, search

by_port(6454)           # Art-Net
who_speaks("sacn")
search("safety curtain")
```

**Command line**

```bash
npx showstack port 5568
npx showstack speaks psn
npx showstack term 吊桿
```

## Contribute

This index is only as good as the people who run shows make it. **Every entry credits its contributors by GitHub handle, and that credit is in the data itself, not just the git log.**

The fastest path is about five minutes and needs no local setup:

1. Find something missing. The [gaps list](https://github.com/deliseph/showstack/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) is generated from the data, so it is never stale.
2. Click **Edit this entry** on the site, or add a new file in `data/<collection>/<id>.yaml`.
3. Copy the shape of a neighbouring file. Fill in what you know. **Leave out what you cannot cite.**
4. Add your handle to `contributed_by`.
5. Open the PR. CI tells you in under a minute if a field is wrong, in plain language.

Read [CONTRIBUTING.md](./CONTRIBUTING.md) for the full guide, including what counts as a good source.

### The one rule

> **An entry with no source is an opinion, not data.**

Every factual field must be traceable to something in `sources`. Prefer the standard itself, the vendor's own documentation, or the project's own repository. If you know something is true from ten years on the floor but cannot cite it, put it in `gotchas` and mark `confidence: reported`. That is honest and useful. Asserting a port number you half-remember is neither.

## Develop

```bash
npm install
npm run validate     # schema, cross-references, duplicate ids, port collisions
npm run build        # -> dist/ (JSON API + site + package bundles)
```

Node 20 or newer. There is no build step for contributors who only touch data; CI runs the same two commands.

## Licence

- **Data** (`data/`, `dist/api/`): [CC BY 4.0](./LICENSE-DATA). Use it commercially, build products on it, just credit showstack.
- **Code** (`schema/`, `scripts/`, `packages/`, `site/`): [MIT](./LICENSE).

## Governance

Small and deliberately boring. See [GOVERNANCE.md](./GOVERNANCE.md). Short version: anyone can propose, maintainers merge, disputes are settled by citing the primary source rather than by seniority.
