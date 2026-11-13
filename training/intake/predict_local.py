"""Same prompt and decoding for base/adapter; emits raw predictions for the JS scorer."""
import os
os.environ.setdefault('HF_HUB_DISABLE_TELEMETRY','1')
os.environ.setdefault('DO_NOT_TRACK','1')
import argparse
import json
import time
import hashlib
from pathlib import Path

def main():
    p=argparse.ArgumentParser()
    p.add_argument('--model',required=True)
    p.add_argument('--adapter')
    p.add_argument('--input',required=True,help='Prompt-only JSONL from export-prompts.mjs')
    p.add_argument('--output',required=True)
    p.add_argument('--max-new-tokens',type=int,default=1024)
    a=p.parse_args()
    if Path(a.output).exists():
        p.error('Prediction file exists; do not overwrite past experiment')
    import torch
    from transformers import AutoTokenizer,AutoModelForCausalLM,set_seed
    if not torch.cuda.is_available():raise RuntimeError('CUDA unavailable')
    set_seed(42)
    tok=AutoTokenizer.from_pretrained(a.model,trust_remote_code=False)
    model=AutoModelForCausalLM.from_pretrained(a.model,torch_dtype=torch.bfloat16,attn_implementation='sdpa',trust_remote_code=False).to('cuda')
    if a.adapter:
        from peft import PeftModel
        model=PeftModel.from_pretrained(model,a.adapter)
    adapter_sha=hashlib.sha256((Path(a.adapter)/'adapter_model.safetensors').read_bytes()).hexdigest() if a.adapter else None
    model.eval()
    with Path(a.output).open('x',encoding='utf-8') as out:
        for line in Path(a.input).read_text(encoding='utf-8').splitlines():
            row=json.loads(line)
            inputs=tok.apply_chat_template(row['messages'],tokenize=True,add_generation_prompt=True,enable_thinking=False,return_dict=True,return_tensors='pt').to('cuda')
            torch.cuda.synchronize();started=time.perf_counter()
            with torch.inference_mode():
                generated=model.generate(**inputs,max_new_tokens=a.max_new_tokens,do_sample=False,pad_token_id=tok.eos_token_id)
            torch.cuda.synchronize()
            new=generated[0,inputs['input_ids'].shape[-1]:]
            result={'id':row['id'],'output':tok.decode(new,skip_special_tokens=True),'elapsedMs':round((time.perf_counter()-started)*1000),'inputTokens':inputs['input_ids'].shape[-1],'outputTokens':len(new),'model':a.model,'adapter':a.adapter,'adapterSha':adapter_sha,'promptMode':row.get('promptMode','zero'),'maxNewTokens':a.max_new_tokens,'limited':len(new)>=a.max_new_tokens,'promptSha256':row['promptSha256'],'datasetSha256':row['datasetSha256']}
            out.write(json.dumps(result,ensure_ascii=False)+'\n');out.flush()
            print(json.dumps({'id':row['id'],'elapsedMs':result['elapsedMs'],'outputTokens':len(new)}),flush=True)

if __name__=='__main__':main()
