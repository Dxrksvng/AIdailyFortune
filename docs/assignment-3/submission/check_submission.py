"""Automated checks for Assignment_2_to_3.pdf. Usage: python check_submission.py PDF A2_ANSWER.md A3_ANSWER.md USER_GUIDE.md"""
import re, sys, subprocess
from pathlib import Path
import pymupdf

pdf, a2, a3, guide = map(Path, sys.argv[1:5])
d = pymupdf.open(pdf)
texts = [p.get_text() for p in d]
flat = re.sub(r"\s+", "", "\n".join(texts))
rows = []
def add(name, ok, note=""): rows.append((name, "PASS" if ok else "FAIL", note))

add("Page size A4 on every page", all(abs(p.rect.width - 595) < 2 and abs(p.rect.height - 842) < 2 for p in d), f"{d.page_count} pages")
add("Title page: name, date, Confidential", all(s in texts[0] for s in ("Nattakamon Jaimetha", "2 ตุลาคม 2569", "Strictly Confidential")))
add("Table of contents on page 2", texts[1].strip().startswith("สารบัญ"))
heads = ["2.1", "2.2", "2.3", "3.1", "3.2", "3.3", "3.4"]
add("Question headings 2.1-2.3, 3.1-3.4 present", all(any(re.search(r"^\s*" + re.escape(h) + r"\b", t, re.M) for t in texts[2:]) for h in heads))
add("Assignment 4 excluded (by request)", "Daily Compass" not in "\n".join(texts))
for label, pat in [("No 'คุณ คุณ'", "คุณคุณ"), ("No TODO", "TODO"), ("No 'sk-'", "sk-"), ("No 'api_key'", "api_key")]:
    add(label, pat not in flat, f"{flat.count(pat)} hits")
abs_paths = re.findall(r"(/Users/\S+|/home/\S+|/tmp/\S+|/Applications/\S+|[A-Z]:\\\S+|file://\S+)", "\n".join(texts))
add("No absolute paths", not abs_paths, ", ".join(abs_paths[:3]))
add("PDF size < 15 MB", pdf.stat().st_size < 15 * 1024 * 1024, f"{pdf.stat().st_size/1024:.0f} KB")
fonts = sorted({f[3].split('+')[-1] for p in d for f in p.get_fonts()})
add("Thai font embedded (Sarabun)", any("Sarabun" in f for f in fonts), ", ".join(fonts))
sec = re.search(r"## 3\.4 .*?(?=\n## |\Z)", a3.read_text(encoding="utf-8"), re.S).group(0)
words = ["JSON", "API", "schema", "placeholder", "deploy", "endpoint", "batch", "row number", "approver", "error report", "xlsx"]
hits = [w for w in words if re.search(r"\b" + re.escape(w) + r"\b", sec, re.I)]
add("Forbidden words absent in 3.4 section of ANSWER.md", not hits, ", ".join(hits))
g = guide.read_text(encoding="utf-8")
ghits = [w for w in words if re.search(r"\b" + re.escape(w) + r"\b", g, re.I)]
add("Forbidden words absent in USER_GUIDE.md", not ghits, ", ".join(ghits))
src_markers = sum(p.read_text(encoding="utf-8").count("[TO CONFIRM") for p in (a2, a3))
last = [i for i, t in enumerate(texts) if t.strip().startswith("สิ่งที่ต้องยืนยัน")]
m = re.search(r"รวม (\d+) จุด", texts[last[0]]) if last else None
add("[TO CONFIRM] list exists after the last section", bool(last) and last[0] >= d.page_count - 4, f"starts on page {last[0]+1 if last else '-'}; lists {m.group(1) if m else '?'} entries; source has {src_markers} markers (code-fence markers are summarised)")
print("| Check | Result | Note |\n|---|---|---|")
for n, r, note in rows: print(f"| {n} | {r} | {note} |")
print(f"\nPages: {d.page_count}")
sys.exit(1 if any(r == "FAIL" for _, r, _ in rows) else 0)
