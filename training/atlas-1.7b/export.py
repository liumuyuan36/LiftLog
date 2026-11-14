"""Export a complete offline Atlas model; preserve open-base provenance."""
import os
os.environ.setdefault('HF_HUB_OFFLINE','1')
os.environ.setdefault('HF_HUB_DISABLE_TELEMETRY','1')
os.environ.setdefault('DO_NOT_TRACK','1')
import argparse,hashlib,json,shutil
from pathlib import Path

def sha(path):
    h=hashlib.sha256()
    with path.open('rb') as stream:
        while block:=stream.read(8*1024*1024):h.update(block)
    return h.hexdigest()

def main():
    p=argparse.ArgumentParser()
    p.add_argument('--base',required=True)
    p.add_argument('--adapter',required=True)
    p.add_argument('--output',required=True)
    a=p.parse_args()
    dest=Path(a.output)
    if dest.exists():p.error('Export directory already exists; do not overwrite an artifact')
    import torch
    from transformers import AutoModelForCausalLM,AutoTokenizer
    from peft import PeftModel
    torch.set_num_threads(4)
    base=AutoModelForCausalLM.from_pretrained(a.base,torch_dtype=torch.bfloat16,local_files_only=True,trust_remote_code=False,attn_implementation='sdpa')
    model=PeftModel.from_pretrained(base,a.adapter,local_files_only=True).merge_and_unload(safe_merge=True)
    model.config._name_or_path='LiftLog-Atlas-1.7B-Run01'
    model.config.atlas_base_model='Qwen/Qwen3-1.7B'
    model.config.atlas_training='LoRA supervised fine-tuning; merged BF16 export'
    model.config.use_cache=True
    model.save_pretrained(dest,safe_serialization=True,max_shard_size='2GB')
    AutoTokenizer.from_pretrained(a.base,local_files_only=True,trust_remote_code=False).save_pretrained(dest)
    shutil.copyfile(Path(a.base)/'LICENSE',dest/'QWEN-LICENSE.txt')
    manifest={'name':'LiftLog Atlas','variant':'1.7B Run01 merged BF16','base':'Qwen/Qwen3-1.7B','baseRevision':'70d244cc86ccca08cf5af4e1e306ecf908b1ad5e','parentAdapterSha256':sha(Path(a.adapter)/'adapter_model.safetensors'),'merge':'PEFT merge_and_unload(safe_merge=True), BF16 weights; evaluate this exported artifact separately from unmerged adapter','files':[{'name':f.name,'bytes':f.stat().st_size,'sha256':sha(f)} for f in sorted(dest.iterdir()) if f.is_file()]}
    (dest/'MODEL-MANIFEST.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'exported':str(dest),'files':len(manifest['files']),'parentAdapterSha256':manifest['parentAdapterSha256']}),flush=True)

if __name__=='__main__':main()
