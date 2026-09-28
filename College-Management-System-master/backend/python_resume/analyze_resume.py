#!/usr/bin/env python3
"""
CampusSphere Resume Analyzer — reads a PDF, returns JSON with scores and suggestions.
Uses pypdf for text extraction and NLTK (punkt) for sentence splitting.
Grammar checks use lightweight heuristics (beginner-friendly, no Java/LT deps).
"""
import argparse
import json
import re
import sys
from pathlib import Path

try:
    from pypdf import PdfReader
except ImportError:
    print(json.dumps({"error": "Missing dependency: pip install -r requirements.txt"}))
    sys.exit(1)

# Expected technical keywords (lowercase) — ATS-style list
SKILL_KEYWORDS = [
    "c++",
    "cpp",
    "java",
    "python",
    "javascript",
    "typescript",
    "sql",
    "mysql",
    "mongodb",
    "react",
    "node",
    "nodejs",
    "express",
    "html",
    "css",
    "git",
    "docker",
    "aws",
    "dsa",
    "data structures",
    "algorithms",
    "rest",
    "api",
    "linux",
    "spring",
    "django",
    "flask",
    "machine learning",
    "tensorflow",
    "pytorch",
]

# Common grammar / style patterns (message, regex or callable)
def check_grammar_heuristics(text: str):
    issues = []
    if not text or len(text.strip()) < 50:
        issues.append(
            {
                "type": "content",
                "message": "Resume text is very short — add more detail about education, projects, and skills.",
            }
        )
        return issues

    # Double spaces
    if "  " in text:
        issues.append(
            {
                "type": "formatting",
                "message": "Remove double spaces for a cleaner look.",
            }
        )

    # its vs it's (simple)
    for m in re.finditer(r"\bits\s+(a|an|the|been|important)\b", text, re.I):
        issues.append(
            {
                "type": "grammar",
                "message": f"Check 'its' vs 'it's' near: ...{text[max(0,m.start()-20):m.end()+20]}...",
            }
        )

    # Sentence start lowercase (after . ! ?)
    sentences = re.split(r"(?<=[.!?])\s+", text)
    for s in sentences[:40]:
        s = s.strip()
        if len(s) > 3 and s[0].islower() and s[0].isalpha():
            issues.append(
                {
                    "type": "grammar",
                    "message": f"Sentence may need a capital letter: '{s[:60]}...'",
                }
            )
            break

    # Very long sentences
    try:
        import nltk

        nltk.download("punkt", quiet=True)
        from nltk.tokenize import sent_tokenize

        for sent in sent_tokenize(text)[:30]:
            if len(sent.split()) > 45:
                issues.append(
                    {
                        "type": "style",
                        "message": f"Consider shortening a long sentence ({len(sent.split())} words).",
                    }
                )
                break
    except Exception:
        pass

    return issues[:15]


def extract_pdf_text(path: str) -> str:
    reader = PdfReader(path)
    parts = []
    for page in reader.pages:
        t = page.extract_text()
        if t:
            parts.append(t)
    return "\n".join(parts)


def normalize_for_match(blob: str) -> str:
    return re.sub(r"\s+", " ", blob.lower())


def analyze(text: str) -> dict:
    norm = normalize_for_match(text)
    found = []
    missing = []
    for kw in SKILL_KEYWORDS:
        if kw in norm:
            found.append(kw)
        else:
            missing.append(kw)

    # ATS keyword coverage (how many of our list appear)
    total_kw = len(SKILL_KEYWORDS)
    matched = len(found)
    ats_score = min(100, round((matched / max(total_kw, 1)) * 100))

    grammar_issues = check_grammar_heuristics(text)
    grammar_penalty = min(40, len(grammar_issues) * 5)
    grammar_score = max(0, 100 - grammar_penalty)

    skills_score = min(100, round((matched / max(total_kw, 1)) * 100))

    overall = round((ats_score * 0.35 + grammar_score * 0.35 + skills_score * 0.3))

    suggestions = []
    if missing:
        suggestions.append(
            f"Add missing keywords where truthful: {', '.join(missing[:12])}"
            + ("..." if len(missing) > 12 else "")
        )
    if grammar_issues:
        suggestions.append("Fix grammar and formatting issues listed below.")
    if ats_score < 50:
        suggestions.append(
            "Improve ATS alignment: mirror phrases from job descriptions (skills, tools, degrees)."
        )
    if not suggestions:
        suggestions.append("Strong baseline — keep updating projects and metrics.")

    return {
        "overall_score": overall,
        "ats_keyword_score": ats_score,
        "grammar_score": grammar_score,
        "skills_coverage_score": skills_score,
        "found_keywords": found,
        "missing_keywords": missing,
        "grammar_issues": grammar_issues,
        "suggestions": suggestions,
        "word_count": len(text.split()),
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--file", required=True, help="Path to PDF resume")
    args = parser.parse_args()
    path = Path(args.file)
    if not path.is_file():
        print(json.dumps({"error": f"File not found: {args.file}"}))
        sys.exit(1)
    try:
        text = extract_pdf_text(str(path))
    except Exception as e:
        print(json.dumps({"error": f"PDF read failed: {str(e)}"}))
        sys.exit(1)

    if not text.strip():
        print(
            json.dumps(
                {
                    "error": "No text extracted — PDF may be scanned/image-only.",
                    "overall_score": 0,
                    "suggestions": ["Use a text-based PDF or add selectable text."],
                }
            )
        )
        sys.exit(0)

    result = analyze(text)
    print(json.dumps(result))


if __name__ == "__main__":
    main()
