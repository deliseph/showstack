# Governance

Deliberately small and boring, so it does not become the interesting part.

## Roles

**Contributor.** Anyone who opens a pull request. No application, no
onboarding. Your handle appears in `contributed_by` on the entries you touch.

**Reviewer.** A contributor who has landed several accepted entries and wants
to help. Ask, and you get triage rights. The main job is being the person who
makes a stranger's first PR a good experience.

**Maintainer.** Merge rights and release rights. Added by consensus of the
existing maintainers, on a track record of sound calls about sourcing rather
than volume of commits.

## How decisions get made

1. **Facts** are settled by the primary source. Not by seniority, not by
   majority, not by the maintainer's own experience. If two sources conflict,
   the entry records both and says so. An honestly recorded ambiguity is more
   useful than a confidently wrong resolution.
2. **Schema changes** need an issue first, then a pull request, then agreement
   from two maintainers. Adding an optional field is easy. Making a field
   required, or changing an enum, breaks contributors' work in flight and gets
   more scrutiny.
3. **Everything else** is lazy consensus. Propose it; if nobody objects within
   a week, do it.

## Scope

In scope: protocols, standards, software, hardware and vocabulary used to
produce live events, and the relationships between them.

Out of scope, for now: fixture personalities (the
[Open Fixture Library](https://open-fixture-library.org/) already does this
well and we would rather link to them than compete), full standard texts
(copyright belongs to the publishing bodies), and anything requiring a
server-side component.

## Safety-related content

Entries touching rigging, electrical, machinery, laser and pyrotechnics carry
real consequences. For those:

- The entry points at the standard. It never paraphrases a requirement in a
  way that could be mistaken for the requirement.
- `confidence: verified` requires the primary document, not a vendor summary.
- Any maintainer may remove a safety-related entry unilaterally and discuss it
  afterwards. Nobody will be second-guessed for doing so.

## Forking

The data is CC BY 4.0 and the code is MIT precisely so that a fork is always
available. If the maintainers ever become the bottleneck, take it and go. That
possibility is the actual governance mechanism; everything above is just
process.
