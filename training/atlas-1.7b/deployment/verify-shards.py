"""Prove official GGUF splitting preserves every tensor and original metadata."""
from pathlib import Path
import argparse
import hashlib
import json
import sys

parser = argparse.ArgumentParser()
parser.add_argument('--gguf-python', required=True)
parser.add_argument('--source', required=True)
parser.add_argument('--shards', required=True)
parser.add_argument('--out', required=True)
args = parser.parse_args()
sys.path.insert(0, args.gguf_python)
from gguf import GGUFReader

def file_hash(file):
    with Path(file).open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()

source = GGUFReader(args.source)
files = sorted(Path(args.shards).glob('model-*-of-*.gguf'))
assert len(files) == 5
original = {tensor.name: tensor for tensor in source.tensors}
seen = set()
rows = []
for file in files:
    reader = GGUFReader(str(file))
    for tensor in reader.tensors:
        assert tensor.name not in seen
        before = original[tensor.name]
        assert tuple(before.shape) == tuple(tensor.shape)
        assert before.tensor_type == tensor.tensor_type
        digest = hashlib.sha256(tensor.data).hexdigest()
        assert digest == hashlib.sha256(before.data).hexdigest(), tensor.name
        seen.add(tensor.name)
    rows.append({'name': file.name, 'bytes': file.stat().st_size, 'sha256': file_hash(file), 'tensors': len(reader.tensors)})
assert seen == set(original)
first = GGUFReader(str(files[0]))
metadata = [name for name in source.fields if not name.startswith(('GGUF.', 'split.'))]
for name in metadata:
    assert source.fields[name].types == first.fields[name].types, name
    assert source.fields[name].contents() == first.fields[name].contents(), name
result = {'method': 'Pinned official llama.cpp b12377 gguf-split --split-max-size 384M. Every tensor raw byte SHA256, name, shape, quantization type and every original metadata value compared to unsplit source. No weights, quantization, prompts or training changed.', 'sourceSha256': file_hash(args.source), 'passed': True, 'tensorCount': len(seen), 'metadataKeysCompared': len(metadata), 'firstShard': files[0].name, 'files': rows}
Path(args.out).write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n', encoding='utf-8', newline='\n')
print(json.dumps({'passed': True, 'tensors': len(seen), 'metadataKeys': len(metadata), 'files': len(files)}))
