#!/usr/bin/env python3
"""Content build tracker.

Validates data/manifest.js against data/days/*.js and prints which course days
have practice content (flashcards + quiz questions).

    python3 tools/status.py            # table of all days
    python3 tools/status.py --todo     # only days not built yet
"""
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
NOTES = ROOT.parent / "CCNA_Course_Notes" / "Course_Notes"


def js_payload(path, start, end):
    text = path.read_text(encoding="utf-8")
    return json.loads(text[text.index(start) + len(start) - 1 : text.rindex(end) + 1])


def main():
    manifest = js_payload(ROOT / "data" / "manifest.js", "= [", "]")
    only_todo = "--todo" in sys.argv
    problems = []
    built_n = cards_n = qs_n = 0
    ids = set()

    print(f"{'ID':6} {'Day':4} {'Domain':9} {'Status':10} {'Cards':>5} {'Qs':>4}  Title")
    for m in manifest:
        ids.add(m["id"])
        f = ROOT / "data" / "days" / f"{m['id']}.js"
        if not (NOTES / m["file"]).exists():
            problems.append(f"{m['id']}: note file not found: {m['file']}")
        cards = qs = 0
        if f.exists():
            try:
                text = f.read_text(encoding="utf-8")
                day_id = re.search(r'CCNA\.addDay\("([^"]+)"', text).group(1)
                data = json.loads(text[text.index("{"): text.rindex("}") + 1])
                cards, qs = len(data.get("cards", [])), len(data.get("questions", []))
                if day_id != m["id"]:
                    problems.append(f"{m['id']}: addDay id is '{day_id}'")
                for kind, prefix in (("cards", "c"), ("questions", "q")):
                    for item in data.get(kind, []):
                        if not item["id"].startswith(f"{m['id']}-{prefix}"):
                            problems.append(f"{m['id']}: bad {kind} id {item['id']}")
                for q in data.get("questions", []):
                    if not all(0 <= a < len(q["options"]) for a in q["answer"]):
                        problems.append(f"{q['id']}: answer index out of range")
                    if q["type"] == "single" and len(q["answer"]) != 1:
                        problems.append(f"{q['id']}: single-choice needs exactly 1 answer")
            except Exception as e:  # noqa: BLE001
                problems.append(f"{m['id']}: cannot parse {f.name}: {e}")
        if m["built"] != f.exists():
            problems.append(f"{m['id']}: manifest built={m['built']} but file exists={f.exists()}")
        if f.exists():
            built_n += 1
            cards_n += cards
            qs_n += qs
        if only_todo and f.exists():
            continue
        status = "built" if f.exists() else "-"
        print(f"{m['id']:6} {m['day']:<4} {m['domain']:9} {status:10} {cards or '':>5} {qs or '':>4}  {m['title']}")

    for f in (ROOT / "data" / "days").glob("*.js"):
        if f.stem not in ids:
            problems.append(f"orphan content file not in manifest: {f.name}")

    print(f"\nBuilt {built_n}/{len(manifest)} lessons · {cards_n} flashcards · {qs_n} questions")
    if problems:
        print("\nPROBLEMS:")
        for p in problems:
            print("  -", p)
        sys.exit(1)


if __name__ == "__main__":
    main()
