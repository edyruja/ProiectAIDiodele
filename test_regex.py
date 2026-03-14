import re

_COMPANY_NAME_PATTERNS = [
    r"[Aa]nalys[ei]s?\s+([A-Z][A-Za-z0-9 &.,'-]+(?:\s+[A-Za-z0-9 &.,'-]+){0,4}?)\s+for\b",
    r"(?:check|lookup|screen|investigate|fetch)\s+([A-Z][A-Za-z0-9 &.,'-]+(?:\s+[A-Z][A-Za-z0-9 &.,'-]*){0,3})",
    r"\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b",
]

def extract(prompt):
    for pattern in _COMPANY_NAME_PATTERNS:
        match = re.search(pattern, prompt)
        if match:
            return match.group(1).strip()
    return None

prompts = [
    "Please analyse Banca Transilvania for AML risk.",
    "Please analyse Banca transilvania for AML risk.",
    "Please analyse Google for AML risk.",
]

for p in prompts:
    print(f"Prompt: {p} -> Extracted: {extract(p)}")
