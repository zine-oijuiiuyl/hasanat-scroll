#!/usr/bin/env python3
"""Recomputes the Content-Security-Policy script hashes in the web app (../../index.html, served by GitHub Pages).
The policy only lets the page's own inline scripts run, named by their SHA-256; any edit to a script changes its
hash, so run this after editing index.html:  python3 mobile/scripts/web-csp.py
"""
import base64, hashlib, os, re

PAGE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "index.html")
s = open(PAGE, encoding="utf8").read()
hashes = " ".join("'sha256-" + base64.b64encode(hashlib.sha256(x.encode()).digest()).decode() + "'"
                  for x in re.findall(r"<script>(.*?)</script>", s, flags=re.S))
s, n = re.subn(r"script-src [^;]*;", "script-src " + hashes + ";", s, count=1)
assert n == 1, "no Content-Security-Policy meta tag found"
open(PAGE, "w", encoding="utf8").write(s)
print("updated", hashes.count("sha256"), "script hashes")
