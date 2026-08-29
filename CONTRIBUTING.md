# Contributing to showstack

You do not need to be a programmer to contribute here. If you have run a show, patched a rig, specified a system or argued with a manual, you know things this index needs.

**Your handle goes on every entry you touch, in the data itself.** That credit is permanent and machine-readable.

---

## The five minute path (no local setup)

1. Find a gap. Three good places to look:
   - the [good first issues](../../issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22), each one is a single field on a single file
   - the **Missing: …** button on any entry on the site
   - anything you searched for and could not find
2. Click **Edit this entry** on the site, or browse to `data/<collection>/<id>.yaml` on GitHub and press the pencil icon.
3. Fill in what you can cite. Add your GitHub handle to `contributed_by`.
4. Press **Propose changes**, then **Create pull request**.
5. CI checks it in about a minute. If something is wrong, the message tells you exactly which line and what to change. Nobody is going to be short with you about it.

That is the whole process. A one-field correction is a completely legitimate contribution and we merge those every day.

---

## The one rule

> **An entry with no source is an opinion, not data.**

Every factual field must be traceable to something in the entry's `sources` list.

**Good sources, roughly in order:**

1. The standard itself (ESTA TSP, SMPTE, AES, IEC pages)
2. The vendor's own documentation, manual or spec sheet
3. The project's own repository or protocol description
4. A reference implementation whose source you actually read
5. A credible industry publication or venue technical specification

**Not sources:** a language model, an unattributed wiki edit, "everyone knows", a forum post asserting something with no evidence, or another aggregator that itself cites nothing.

Mark the authoritative document with `primary: true`.

### When you know it but cannot cite it

This happens constantly and the answer is not to leave it out.

- Put it in `gotchas`, which is for hard-won operational knowledge rather than specifications.
- Set `confidence: reported` or `confidence: unverified`.
- Say plainly what you observed. "On firmware 3.x this node ignores ArtSync" is useful. "ArtSync is unreliable" is not.

**Never guess a port number, a multicast address, a sample rate or a standard designation.** Leaving a field out creates a good first issue for someone else. Filling it in wrongly sends a technician down a two-hour hole at 1am. Omission is the safe failure; invention is not.

---

## Anatomy of an entry

Every file is one YAML mapping. The filename must equal the `id`. Look at a neighbouring file in the same folder and copy its shape.

```yaml
id: sacn                       # must match the filename, kebab-case
name: sACN
aka: [Streaming ACN, E1.31]    # what people actually say on headset
category: lighting-control     # strict enum, see the schema
summary: >-
  Two sentences maximum. What it carries, and what it is
  actually used for on a real job.
default_ports:
  - number: 5568
    transport: udp
    role: sACN data and synchronisation packets
media:                         # only where the protocol defines a capability
  audio:
    sample_rates_khz: [48, 96]
    bit_depths: [24]
    max_channels: 64           # what the protocol permits, not what a box ships
    note: The caveat that makes the numbers above safe to quote.
  video:
    max_resolution: 3840x2160  # omit it where the spec fixes no ceiling
    max_frame_rate: 60
gotchas:
  - The thing that bites you at 2am, stated concretely.
confidence: verified           # verified | reported | unverified
sources:
  - title: ANSI E1.31 — Lightweight streaming protocol …
    url: https://tsp.esta.org/tsp/documents/published_docs.php
    publisher: ESTA
    primary: true
contributed_by: [your-handle]
updated: 2026-08-16
```

The schemas in [`schema/`](./schema) are the contract. They list every allowed field and every allowed enum value, with a description explaining why the field exists. If a field you need does not exist, [open an issue proposing it](../../issues/new) — the schema is meant to grow.

### Confidence, honestly

| value | means |
|---|---|
| `verified` | You checked it against the primary standard, the vendor's own document, or real hardware in front of you. |
| `reported` | A credible secondary source says so, or the vendor claims it in marketing material. |
| `unverified` | Community knowledge. Probably right. Nobody has checked. |

Downgrading your own confidence is a contribution. If you find a `verified` field that turns out to rest on nothing, changing it to `reported` and saying so in the PR makes the index better.

---

## What makes a great contribution

**Best:** a `gotcha` that took you a whole load-in to work out. Those cannot be found anywhere else and they are the reason people will come back to this index.

**Also excellent:**

- Filling one `speaks` entry on a product you use daily, with `confidence: verified` because you have actually sent that protocol into that box
- A bilingual glossary term with the regional variant your crew uses and the false friend that catches everyone
- A correction, with the source that proves it
- Marking something `superseded` when a vendor discontinues it

**Please avoid:**

- Adding a product with no `speaks` data and no `sources`. That is a stub, and stubs make the index look bigger while making it less trustworthy.
- Bulk-adding entries scraped from another site. Provenance matters, and so does that site's licence.
- Marketing copy. `summary` is for a technician deciding whether this is the thing they need.

---

## Bilingual entries (EN / 繁中)

The glossary exists because translation software gets stage vocabulary wrong in ways that are occasionally dangerous.

- Write the term crews **actually say**, not the dictionary translation. 對燈, not 對焦.
- Hong Kong and Taiwan usage differs. Use `regional_variants` rather than picking a winner.
- `false_friends` is the highest-value field in the collection. 拆台 means undermining someone in everyday Mandarin and load-out in a theatre. That is exactly what belongs there.
- Set `safety_critical: true` where getting the word wrong on headset can hurt someone.
- Chinese characters are content, not decoration. If you are not confident in the term, leave the field out and open an issue.

---

## Running it locally (optional)

```bash
git clone https://github.com/deliseph/showstack
cd showstack
npm install
npm run validate
npm run build && open dist/index.html
```

Node 20+. `npm run validate` is exactly what CI runs.

---

## Review, and what to expect

- A maintainer will look at your PR. If a source needs to be stronger, we will say which one and why.
- **We will not rewrite your entry silently.** If we disagree, we discuss it on the PR and cite something.
- Disagreements are settled by the primary source, not by who has been in the industry longer. If the source is ambiguous, we record the ambiguity in the entry rather than pretending it is resolved.
- If the validator gave you an unclear error, tell us. That is a bug in the validator, and we would rather fix the tool than make the next person struggle.

## Code of conduct

Everyone here is welcome, including people on their first ever pull request. See [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).
