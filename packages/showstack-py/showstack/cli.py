"""Command line entry point. Answers one question per invocation, fast."""
from __future__ import annotations

import sys

import showstack as ss


def main() -> int:
    args = sys.argv[1:]
    if not args:
        print(
            "showstack - the open index of live entertainment technology\n\n"
            "  showstack port <number>       what protocol runs on this port\n"
            "  showstack speaks <protocol>   what sends or receives this protocol\n"
            "  showstack term <word>         glossary lookup, EN or 中文\n"
            "  showstack search <query>      search everything\n"
            "  showstack gaps                what the index is missing\n"
            f"\n{ss.meta['total']} entries, built {ss.meta['generated']}. Data CC BY 4.0.\n"
        )
        return 0

    cmd, rest = args[0], " ".join(args[1:])

    if cmd == "port":
        hits = ss.by_port(rest)
        if not hits:
            print(f"Nothing indexed on port {rest}. If you know what uses it, "
                  "that is a five minute pull request: github.com/deliseph/showstack")
            return 1
        for p in hits:
            ports = ", ".join(f"{x['transport']}/{x['number']}" for x in p.get("default_ports", []))
            print(f"\n{p['name']} ({p['id']})  {ports}\n{p['summary']}")
        return 0

    if cmd == "speaks":
        hits = ss.who_speaks(rest)
        if not hits:
            print(f"Nothing indexed speaks '{rest}'.")
            return 1
        print(f"\n{len(hits)} products speak {rest}\n")
        for s in hits:
            lic = " [licensed]" if s.get("requires_licence") else ""
            print(f"  {s['direction']:<14} {s['name']} ({s['kind']}){lic}")
        return 0

    if cmd == "term":
        hits = ss.term(rest) or ss.search(rest, collection="terms", limit=5)
        if not hits:
            print(f"No glossary entry for '{rest}'.")
            return 1
        for t in hits:
            flag = "  [safety critical]" if t.get("safety_critical") else ""
            print(f"\n{t['en']}  {t.get('zh_hant', '')}{flag}\n{t['definition_en']}")
            if t.get("definition_zh_hant"):
                print(t["definition_zh_hant"])
            for f in t.get("false_friends", []):
                print(f"  careful: {f}")
        return 0

    if cmd == "search":
        hits = ss.search(rest)
        if not hits:
            print(f"Nothing matches '{rest}'. That is probably worth an issue.")
            return 1
        for h in hits:
            print(f"  {h['collection']+'/':<11}{h.get('name') or h.get('en') or h.get('designation')}  {h['id']}")
        return 0

    if cmd == "gaps":
        for g in ss.missing()[:60]:
            print(f"  {g['collection']+'/':<11}{g['id']:<24} {', '.join(g['missing'])}")
        return 0

    print(f"Unknown command '{cmd}'. Run showstack with no arguments for usage.")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
