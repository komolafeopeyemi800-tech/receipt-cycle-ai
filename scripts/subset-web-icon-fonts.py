"""Generate a lossless common-glyph subset, retaining full-font fallbacks in CSS.

Optional maintenance tool: fontTools[woff] is required only when regenerating the
committed assets. Normal application builds do not run Python or download fonts.
Modified fonts are renamed to avoid using upstream reserved font names.
"""
import hashlib
import json
from pathlib import Path
import sys

from fontTools import subset
from fontTools.ttLib import TTFont


def unicode_range(points):
    runs = []
    for point in sorted(points):
        if runs and point == runs[-1][1] + 1:
            runs[-1][1] = point
        else:
            runs.append([point, point])
    return ",".join(f"U+{start:X}" if start == end else f"U+{start:X}-{end:X}" for start, end in runs)


request = json.loads(sys.stdin.read())
out = Path(request["out"])
result = {}
for name, source in request["fonts"].items():
    if name == "fa-v4compatibility":
        continue
    font = TTFont(source, recalcTimestamp=False)
    cmap = set(font.getBestCmap())
    common = cmap.intersection(request["codepoints"])
    remaining = cmap.difference(common)
    if not common:
        continue
    options = subset.Options()
    options.flavor = "woff2"
    options.notdef_glyph = True
    options.notdef_outline = True
    options.recalc_timestamp = False
    subsetter = subset.Subsetter(options=options)
    subsetter.populate(unicodes=common)
    subsetter.subset(font)
    style = name.removeprefix("fa-").removesuffix("-400").removesuffix("-900").title()
    for record in font["name"].names:
        replacements = {1: "Receipt Cycle UI Icons", 3: f"ReceiptCycle:6.5.2:{style}:Subset", 4: f"Receipt Cycle UI Icons {style}", 6: f"ReceiptCycleUIIcons-{style}-Subset", 16: "Receipt Cycle UI Icons"}
        if record.nameID in replacements:
            record.string = replacements[record.nameID].encode(record.getEncoding(), errors="replace")
    intermediate = out / f"{name}-common.woff2"
    font.save(intermediate)
    data = intermediate.read_bytes()
    fingerprint = hashlib.sha256(data).hexdigest()[:12]
    target = out / f"{name}-common-6.5.2.{fingerprint}.woff2"
    intermediate.rename(target)
    verify = TTFont(target)
    if set(verify.getBestCmap()) != common:
        raise RuntimeError(f"Subset cmap differs for {name}")
    if common.union(remaining) != cmap or common.intersection(remaining):
        raise RuntimeError(f"Incomplete or overlapping fallback ranges for {name}")
    result[name] = {"filename": target.name, "bytes": len(data), "commonCodepoints": len(common), "remainingCodepoints": len(remaining), "commonRange": unicode_range(common), "remainingRange": unicode_range(remaining), "sourceCodepoints": len(cmap)}

print(json.dumps(result))
