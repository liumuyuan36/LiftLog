"""Frozen local evidence-QA evaluation; raw outputs, no API or output repair."""
import os
os.environ.setdefault('HF_HUB_DISABLE_TELEMETRY','1')
os.environ.setdefault('DO_NOT_TRACK','1')
os.environ.setdefault('HF_HUB_OFFLINE','1')
import argparse,hashlib,json,time
from pathlib import Path

def main():
    p=argparse.ArgumentParser()
    p.add_argument('--model',required=True)
    p.add_argument('--adapter')
    p.add_argument('--input',required=True)
    p.add_argument('--output',required=True)
    p.add_argument('--batch-size',type=int,default=4)
    p.add_argument('--max-new-tokens',type=int,default=512)
    a=p.parse_args()
    if Path(a.output).exists():p.error('Do not overwrite previous predictions')
    import torch
    from transformers import AutoTokenizer,AutoModelForCausalLM,set_seed
    if not torch.cuda.is_available():raise RuntimeError('CUDA unavailable')
    if a.batch_size<1 or a.batch_size>8:raise ValueError('Batch size must be 1–8')
    set_seed(42)
    tok=AutoTokenizer.from_pretrained(a.model,trust_remote_code=False,padding_side='left')
    if tok.pad_token_id is None:tok.pad_token_id=tok.eos_token_id
    model=AutoModelForCausalLM.from_pretrained(a.model,torch_dtype=torch.bfloat16,attn_implementation='sdpa',trust_remote_code=False).to('cuda')
    if a.adapter:
        from peft import PeftModel
        model=PeftModel.from_pretrained(model,a.adapter)
    model.eval()
    adapter_sha=hashlib.sha256((Path(a.adapter)/'adapter_model.safetensors').read_bytes()).hexdigest() if a.adapter else None
    rows=[json.loads(line) for line in Path(a.input).read_text(encoding='utf-8').splitlines() if line]
    torch.cuda.reset_peak_memory_stats()
    with Path(a.output).open('x',encoding='utf-8') as out:
        for start in range(0,len(rows),a.batch_size):
            batch=rows[start:start+a.batch_size]
            texts=[tok.apply_chat_template(r['messages'],tokenize=False,add_generation_prompt=True,enable_thinking=False) for r in batch]
            inputs=tok(texts,padding=True,return_tensors='pt',add_special_tokens=False).to('cuda')
            if inputs['input_ids'].shape[-1]>4096:raise ValueError('Prompt exceeds frozen context limit')
            torch.cuda.synchronize();began=time.perf_counter()
            with torch.inference_mode():generated=model.generate(**inputs,max_new_tokens=a.max_new_tokens,do_sample=False,pad_token_id=tok.pad_token_id,eos_token_id=tok.eos_token_id)
            torch.cuda.synchronize();elapsed=round((time.perf_counter()-began)*1000)
            for row,tokens,mask in zip(batch,generated[:,inputs['input_ids'].shape[-1]:],inputs['attention_mask']):
                ids=tokens.tolist()
                try:ids=ids[:ids.index(tok.eos_token_id)]
                except ValueError:pass
                result={'id':row['id'],'output':tok.decode(ids,skip_special_tokens=True),'batchElapsedMs':elapsed,'batchSize':len(batch),'inputTokens':int(mask.sum()),'outputTokens':len(ids),'limited':len(ids)>=a.max_new_tokens,'model':a.model,'adapterSha256':adapter_sha,'promptSha256':row['promptSha256'],'datasetSha256':row['datasetSha256'],'decoding':{'thinking':False,'sample':False,'seed':42,'maxNewTokens':a.max_new_tokens}}
                out.write(json.dumps(result,ensure_ascii=False)+'\n')
            out.flush()
            print(json.dumps({'completed':min(start+len(batch),len(rows)),'total':len(rows),'batchElapsedMs':elapsed,'peakGpuMiB':round(torch.cuda.max_memory_allocated()/1024**2)}),flush=True)

if __name__=='__main__':main()
