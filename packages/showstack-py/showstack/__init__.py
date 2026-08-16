"""showstack — the open index of live entertainment technology.

The whole dataset ships inside the package, so every lookup is synchronous and
works with no network. A rack in a basement with no wifi is the normal
operating environment for the people this is for.
"""

from __future__ import annotations

import json
from importlib.resources import files
from typing import Any, Iterable

__version__ = "0.1.0"

_DB: dict[str, Any] = json.loads(
    files(__package__).joinpath("showstack.json").read_text(encoding="utf-8")
)

protocols: list[dict] = _DB["protocols"]
software: list[dict] = _DB["software"]
hardware: list[dict] = _DB["hardware"]
standards: list[dict] = _DB["standards"]
terms: list[dict] = _DB["terms"]
contributors: list[dict] = _DB["contributors"]
gaps: list[dict] = _DB["gaps"]

meta = {"generated": _DB["generated"], "counts": _DB["counts"], "total": _DB["total"]}

_COLLECTIONS = {
    "protocols": protocols,
    "software": software,
    "hardware": hardware,
    "standards": standards,
    "terms": terms,
}

products: list[dict] = [dict(s, kind="software") for s in software] + [
    dict(h, kind="hardware") for h in hardware
]

__all__ = [
    "protocols", "software", "hardware", "standards", "terms", "products",
    "contributors", "gaps", "meta",
    "by_port", "who_speaks", "interop", "term", "get", "search", "missing",
]


def by_port(number: int | str, transport: str | None = None) -> list[dict]:
    """What is listening on this port?

    The question you ask when a packet capture shows traffic you did not expect.
    """
    n = int(number)
    return [
        p for p in protocols
        if any(
            x["number"] == n and (transport is None or x["transport"] == transport)
            for x in p.get("default_ports", [])
        )
    ]


def who_speaks(protocol_id: str, direction: str | None = None) -> list[dict]:
    """Everything indexed that sends or receives a given protocol.

    ``who_speaks("psn", "in")`` is "what can receive PosiStageNet".
    """
    p = next((x for x in protocols if x["id"] == protocol_id), None)
    if p is None:
        return []
    spoken = p.get("spoken_by", [])
    if direction is None:
        return spoken
    return [s for s in spoken if s["direction"] in (direction, "bidirectional")]


def interop(id_a: str, id_b: str) -> list[dict]:
    """Protocols over which one product can send and the other can receive."""
    a = next((p for p in products if p["id"] == id_a), None)
    b = next((p for p in products if p["id"] == id_b), None)
    if a is None or b is None:
        return []

    def sends(e: dict) -> set[str]:
        return {s["protocol"] for s in e.get("speaks", []) if s["direction"] != "in"}

    def receives(e: dict) -> set[str]:
        return {s["protocol"] for s in e.get("speaks", []) if s["direction"] != "out"}

    out = [{"from": a["id"], "to": b["id"], "protocol": p} for p in sends(a) & receives(b)]
    out += [{"from": b["id"], "to": a["id"], "protocol": p} for p in sends(b) & receives(a)]
    return out


def term(query: str) -> list[dict]:
    """Look up a glossary term in either language."""
    q = query.lower()
    return [
        t for t in terms
        if t["id"] == q
        or t.get("en", "").lower() == q
        or t.get("zh_hant") == query
        or t.get("zh_hans") == query
        or any(r["term"] == query or r["term"].lower() == q for r in t.get("regional_variants", []))
    ]


def get(collection: str, entry_id: str) -> dict | None:
    """Fetch any entry by collection and id."""
    return next((e for e in _COLLECTIONS.get(collection, []) if e["id"] == entry_id), None)


def _haystack(e: dict) -> str:
    parts: Iterable[Any] = (
        e.get("id"), e.get("name"), e.get("en"), e.get("designation"), e.get("title"),
        e.get("zh_hant"), e.get("zh_hans"), e.get("vendor"), e.get("body"),
        e.get("summary"), e.get("definition_en"), e.get("scope"),
        " ".join(e.get("aka", [])), " ".join(e.get("tags", [])),
        " ".join(f"{p['number']} {p['transport']}" for p in e.get("default_ports", [])),
    )
    return " ".join(str(p) for p in parts if p).lower()


def search(query: str, collection: str | None = None, limit: int = 50) -> list[dict]:
    """Substring search across everything, including ports and Chinese terms."""
    words = query.lower().split()
    pool = (
        [(collection, _COLLECTIONS.get(collection, []))]
        if collection
        else list(_COLLECTIONS.items())
    )
    out: list[dict] = []
    for key, entries in pool:
        for e in entries:
            if all(w in _haystack(e) for w in words):
                out.append({"collection": key, **e})
                if len(out) >= limit:
                    return out
    return out


def missing(collection: str | None = None) -> list[dict]:
    """Everything the index knows it is missing."""
    return [g for g in gaps if g["collection"] == collection] if collection else gaps
