# Security policy

showstack is a static dataset and a build script. There is no server, no
database and no user accounts, so the attack surface is small. The realistic
risks are supply chain and data integrity.

## Reporting

For anything you would rather not post publicly, use GitHub's private
vulnerability reporting on this repository (Security tab -> Report a
vulnerability). We aim to respond within 72 hours.

## In scope

- A malicious entry that causes the validator or build to execute something
- A dependency in the build chain with a known advisory
- A crafted YAML file that breaks the parser in an exploitable way
- Data poisoning: a deliberately false entry intended to cause an unsafe
  decision, particularly in `data/standards/` for rigging, electrical, laser
  or pyrotechnic material

That last one is a security issue here, not merely a correctness issue. If you
believe an entry could lead someone to an unsafe decision, report it privately
and we will take the entry down first and discuss it after.

## Out of scope

- Broken or moved source links (open a normal issue)
- Disagreements about a fact where both sides have sources (open a normal issue)
