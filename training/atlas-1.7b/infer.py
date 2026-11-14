"""Offline single-input smoke test for a base + Atlas adapter. No paid API."""
import os
os.environ.setdefault('HF_HUB_OFFLINE','1')
os.environ.setdefault('HF_HUB_DISABLE_TELEMETRY','1')
os.environ.setdefault('DO_NOT_TRACK','1')
import argparse,json,sys
from pathlib import Path
sys.stdin.reconfigure(encoding='utf-8')
sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

def main():
    p=argparse.ArgumentParser()
    p.add_argument('--model',required=True,help='Verified local Qwen3-1.7B directory')
    p.add_argument('--adapter',help='Optional when loading the complete merged Atlas model')
    p.add_argument('--input',required=True,help='JSON file containing messages array')
    a=p.parse_args()
    import torch
    from transformers import AutoTokenizer,AutoModelForCausalLM,set_seed
    from peft import PeftModel
    set_seed(42)
    tokenizer=AutoTokenizer.from_pretrained(a.model,trust_remote_code=False)
    model=AutoModelForCausalLM.from_pretrained(a.model,torch_dtype=torch.bfloat16 if torch.cuda.is_available() else torch.float32,trust_remote_code=False,attn_implementation='sdpa')
    if a.adapter:model=PeftModel.from_pretrained(model,a.adapter)
    model=model.to('cuda' if torch.cuda.is_available() else 'cpu').eval()
    value=json.loads(sys.stdin.read() if a.input=='-' else Path(a.input).read_text(encoding='utf-8'))
    messages=value['messages'] if isinstance(value,dict) else value
    inputs=tokenizer.apply_chat_template(messages,tokenize=True,add_generation_prompt=True,enable_thinking=False,return_dict=True,return_tensors='pt').to(model.device)
    with torch.inference_mode():output=model.generate(**inputs,do_sample=False,max_new_tokens=512,pad_token_id=tokenizer.eos_token_id)
    print(tokenizer.decode(output[0,inputs['input_ids'].shape[-1]:],skip_special_tokens=True))

if __name__=='__main__':main()
