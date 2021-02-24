import re

def _parse_raw_doc(raw_doc):
    line0 = raw_doc.split("\n", 1)[0].lstrip()
    if line0.startswith("("):
        m = re.match(r"(\([^)]*\)) (.*)", line0)
        return m.groups()
    else:
        return ("", line0)
