"""Compare the deployed two-message format to the exported Run02 tokenizer.

Usage: python verify-template.py --model <local merged Run02 model directory>
Writes a new verification file only; does not run inference or download a model.
"""
from pathlib import Path
import argparse
import hashlib
import json
from transformers import AutoTokenizer

parser = argparse.ArgumentParser()
parser.add_argument('--model', required=True)
args = parser.parse_args()
repo = Path(__file__).resolve().parents[3]
tokenizer = AutoTokenizer.from_pretrained(args.model, local_files_only=True)
rows = []
for name in ['evaluation/atlas17-run02/fresh40.prompts.jsonl', 'evaluation/fitness-100/workflow.prompts.jsonl']:
    for line in (repo / name).read_text(encoding='utf-8').splitlines():
        row = json.loads(line)
        messages = row['messages']
        expected = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True, enable_thinking=False)
        actual = ''.join(f"<|im_start|>{m['role']}\n{m['content']}<|im_end|>\n" for m in messages) + '<|im_start|>assistant\n<think>\n\n</think>\n\n'
        assert expected == actual, row['id']
        ids = tokenizer.apply_chat_template(messages, tokenize=True, add_generation_prompt=True, enable_thinking=False)
        if hasattr(ids, 'keys'):
            ids = ids['input_ids']
        assert ids == tokenizer(actual, add_special_tokens=False)['input_ids'], row['id']
        rows.append({'id': row['id'], 'templateMatches': True, 'tokens': len(ids), 'promptUtf8Sha256': hashlib.sha256(actual.encode()).hexdigest()})
output = repo / 'evaluation/atlas17-deployment/template-verification-reproduced.json'
with output.open('x', encoding='utf-8', newline='\n') as file:
    json.dump({'method': 'Exact template and token-count verification against exported Run02 Hugging Face tokenizer, enable_thinking=False. No inference or reference answers used.', 'passed': True, 'cases': rows}, file, ensure_ascii=False, indent=2)
    file.write('\n')
print('Exact exported-tokenizer template matches:', len(rows))
