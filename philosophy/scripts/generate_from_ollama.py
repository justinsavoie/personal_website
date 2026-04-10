#!/usr/bin/env python3
"""
Generate philosopher Likert positions and justifications via Ollama (ministral-3:8b).

Usage:
  python3 scripts/generate_from_ollama.py \
      --model "ministral-3:8b" \
      --out data/philosophers_ollama.json

It reads questions and philosopher names from data/model.json (or you can
override both via flags). Output is a JSON array of objects with:
  { philosopher: str, positions: [30 ints 1..5], justification: str }

You can then plug this into a PCA builder (adapt scripts/build_data.py as needed)
to recompute model.json using the new responses.
"""
import argparse
import json
import os
import subprocess
import re
import sys
from typing import List, Dict

DEFAULT_MODEL = "ministral-3:8b"
ROOT = os.path.dirname(os.path.dirname(__file__))
MODEL_JSON = os.path.join(ROOT, 'data', 'model.json')


def load_base() -> Dict:
    with open(MODEL_JSON, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return data


def build_prompt(philosopher: str, questions: List[Dict]) -> str:
    qs_text = "\n".join([f"Q{i+1}. {q['text']}" for i, q in enumerate(questions)])
    prompt = f"""
You are a careful philosophy assistant. For the philosopher named: {philosopher}
rate each of the 30 statements below on a 1-5 Likert scale:
  1 = strongly disagree, 2 = disagree, 3 = neutral/mixed, 4 = agree, 5 = strongly agree.
Be concise but thoughtful and produce strict JSON with keys: philosopher, positions, justification.
Do not include any extra commentary. The JSON must be a single object.

Statements:\n{qs_text}

Return JSON like:
{{
  "philosopher": "{philosopher}",
  "positions": [30 integers 1..5 in order Q1..Q30],
  "justification": "one short paragraph explaining the ratings"
}}
""".strip()
    return prompt


def run_ollama(model: str, prompt: str) -> str:
    # Try multiple invocation styles for compatibility across Ollama versions
    attempts = [
        {"args": ["ollama", "run", model, "--prompt", prompt, "--stream=false"], "stdin": None},
        {"args": ["ollama", "run", model, "-p", prompt, "--stream=false"], "stdin": None},
        {"args": ["ollama", "run", model, "--stream=false"], "stdin": prompt},
        {"args": ["ollama", "run", model], "stdin": prompt},
    ]
    last_err = None
    for att in attempts:
        try:
            proc = subprocess.run(
                att["args"],
                input=(att["stdin"].encode('utf-8') if att["stdin"] is not None else None),
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                timeout=300,
            )
        except FileNotFoundError as e:
            raise SystemExit("ollama CLI not found. Install from https://ollama.ai/") from e
        if proc.returncode == 0:
            return proc.stdout.decode('utf-8', errors='ignore').strip()
        else:
            last_err = proc.stderr.decode('utf-8', errors='ignore')
            # Continue to next attempt
    if last_err:
        sys.stderr.write(last_err)
    raise SystemExit("ollama run failed with all invocation variants")


def parse_json_blob(blob: str, expected_name: str) -> Dict:
    # Remove markdown fences if present
    tmp = blob.strip()
    if '```' in tmp:
        # Keep content inside first fenced block if it's JSON-like
        parts = tmp.split('```')
        # try to find segment that contains a '{'
        tmp = None
        for seg in parts:
            if '{' in seg and '}' in seg:
                tmp = seg
                break
        if tmp is None:
            tmp = blob
    else:
        tmp = blob

    # Extract first top-level JSON object using brace counting and string awareness
    s = tmp
    start = s.find('{')
    if start == -1:
        raise ValueError("No opening brace found in model output")
    depth = 0
    in_str = False
    esc = False
    end = -1
    for i in range(start, len(s)):
        ch = s[i]
        if in_str:
            if esc:
                esc = False
            elif ch == '\\':
                esc = True
            elif ch == '"':
                in_str = False
        else:
            if ch == '"':
                in_str = True
            elif ch == '{':
                depth += 1
            elif ch == '}':
                depth -= 1
                if depth == 0:
                    end = i
                    break
    if end == -1:
        raise ValueError("No complete JSON object found in model output")
    text = s[start:end+1]

    def clean_common_issues(t: str) -> str:
        # Replace smart quotes
        t = t.replace('“', '"').replace('”', '"').replace('’', "'")
        # Remove trailing commas before } or ]
        t = re.sub(r",\s*([}\]])", r"\1", t)
        return t

    def strip_json_comments(t: str) -> str:
        # Remove // and /* */ comments outside of strings
        out = []
        i = 0
        n = len(t)
        in_str = False
        esc = False
        while i < n:
            ch = t[i]
            if in_str:
                out.append(ch)
                if esc:
                    esc = False
                elif ch == '\\':
                    esc = True
                elif ch == '"':
                    in_str = False
                i += 1
            else:
                if ch == '"':
                    in_str = True
                    out.append(ch)
                    i += 1
                elif ch == '/' and i+1 < n and t[i+1] == '/':
                    # line comment
                    i += 2
                    while i < n and t[i] not in ('\n', '\r'):
                        i += 1
                elif ch == '/' and i+1 < n and t[i+1] == '*':
                    # block comment
                    i += 2
                    while i+1 < n and not (t[i] == '*' and t[i+1] == '/'):
                        i += 1
                    i += 2 if i+1 < n else 1
                else:
                    out.append(ch)
                    i += 1
        return ''.join(out)

    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        text2 = clean_common_issues(strip_json_comments(text))
        try:
            data = json.loads(text2)
        except json.JSONDecodeError:
            data = None

    if data is not None:
        # Basic validation and coercion
        if not isinstance(data.get('positions'), list):
            raise ValueError("positions must be a list of 30 integers")
        pos = [int(max(1, min(5, int(x)))) for x in data['positions']]
        if len(pos) < 30:
            raise ValueError("positions must be a list of 30 integers")
        if len(pos) > 30:
            pos = pos[:30]
        data['positions'] = pos
        data['philosopher'] = expected_name
        if 'justification' not in data:
            data['justification'] = ''
        return data

    # Fallback: extract positions by regex and justification by simple scan
    cleaned = clean_common_issues(strip_json_comments(text))
    # positions array content
    key_idx = cleaned.find('positions')
    if key_idx == -1:
        raise ValueError("positions array not found")
    br_start = cleaned.find('[', key_idx)
    if br_start == -1:
        raise ValueError("positions array not found")
    depth = 0
    br_end = -1
    for i in range(br_start, len(cleaned)):
        ch = cleaned[i]
        if ch == '[':
            depth += 1
        elif ch == ']':
            depth -= 1
            if depth == 0:
                br_end = i
                break
    if br_end == -1:
        raise ValueError("unterminated positions array")
    arr_text = cleaned[br_start+1:br_end]
    nums = [int(m.group(0)) for m in re.finditer(r"\b[1-5]\b", arr_text)]
    if len(nums) < 30:
        raise ValueError("positions must be a list of 30 integers")
    if len(nums) > 30:
        nums = nums[:30]

    # Try to get justification string
    just = ''
    j_idx = cleaned.find('justification')
    if j_idx != -1:
        colon = cleaned.find(':', j_idx)
        if colon != -1:
            # scan quoted string
            i = colon + 1
            # skip whitespace
            while i < len(cleaned) and cleaned[i] in ' \n\r\t':
                i += 1
            if i < len(cleaned) and cleaned[i] == '"':
                i += 1
                buf = []
                esc = False
                while i < len(cleaned):
                    ch = cleaned[i]
                    if esc:
                        buf.append(ch)
                        esc = False
                    elif ch == '\\':
                        esc = True
                    elif ch == '"':
                        break
                    else:
                        buf.append(ch)
                    i += 1
                just = ''.join(buf)

    return {
        'philosopher': expected_name,
        'positions': nums,
        'justification': just,
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--model', default=DEFAULT_MODEL)
    ap.add_argument('--out', default=os.path.join(ROOT, 'data', 'philosophers_ollama.json'))
    ap.add_argument('--debug', action='store_true')
    args = ap.parse_args()

    base = load_base()
    philosophers = [p['name'] for p in base['philosophers']]
    questions = base['questions']

    out_items = []
    for name in philosophers:
        print(f"Generating for {name}...")
        prompt = build_prompt(name, questions)
        blob = run_ollama(args.model, prompt)
        if args.debug:
            # Write raw output for inspection
            raw_dir = os.path.join(ROOT, 'data', 'ollama_raw')
            os.makedirs(raw_dir, exist_ok=True)
            with open(os.path.join(raw_dir, f"{name}.txt"), 'w', encoding='utf-8') as f:
                f.write(blob)
        try:
            obj = parse_json_blob(blob, expected_name=name)
        except Exception as e:
            # Print a helpful snippet and continue
            preview = blob[:400].replace('\n', ' ')
            print(f"Warning: parse failed for {name}: {e}. Preview: {preview}")
            continue
        out_items.append(obj)

    with open(args.out, 'w', encoding='utf-8') as f:
        json.dump(out_items, f, indent=2)
    print(f"Wrote {args.out}")


if __name__ == '__main__':
    main()
