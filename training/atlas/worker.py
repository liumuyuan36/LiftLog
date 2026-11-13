"""Loopback-only Atlas inference worker. No user-text logs, uploads, or API keys."""
import os
os.environ.setdefault('HF_HUB_OFFLINE','1')
os.environ.setdefault('HF_HUB_DISABLE_TELEMETRY','1')
import argparse,json,time,threading,hashlib
from pathlib import Path
from http.server import BaseHTTPRequestHandler,ThreadingHTTPServer

def main():
    p=argparse.ArgumentParser()
    p.add_argument('--model',required=True);p.add_argument('--adapter',required=True)
    p.add_argument('--port',type=int,default=7861);p.add_argument('--threads',type=int,default=2)
    p.add_argument('--quantize',action='store_true')
    p.add_argument('--quantization',choices=['none','dynamic-all','dynamic-mlp','dynamic-channel'],default='none');a=p.parse_args()
    mode='dynamic-all' if a.quantize else a.quantization
    import torch
    from transformers import AutoModelForCausalLM,AutoTokenizer,StoppingCriteria,StoppingCriteriaList
    from peft import PeftModel
    torch.set_num_threads(a.threads);torch.set_num_interop_threads(1)
    tokenizer=AutoTokenizer.from_pretrained(a.model,local_files_only=True,trust_remote_code=False)
    model=AutoModelForCausalLM.from_pretrained(a.model,dtype=torch.float32,attn_implementation='sdpa',local_files_only=True,trust_remote_code=False)
    model=PeftModel.from_pretrained(model,a.adapter,local_files_only=True).merge_and_unload()
    if mode!='none':
        torch.backends.quantized.engine='fbgemm'
        spec={torch.nn.Linear}
        if mode=='dynamic-mlp':spec={name for name,module in model.named_modules() if isinstance(module,torch.nn.Linear) and any(name.endswith('mlp.'+part) for part in ['gate_proj','up_proj','down_proj'])}
        if mode=='dynamic-channel':spec={torch.nn.Linear:torch.ao.quantization.per_channel_dynamic_qconfig}
        model=torch.ao.quantization.quantize_dynamic(model,spec,dtype=torch.qint8)
    hasher=hashlib.sha256()
    with (Path(a.adapter)/'adapter_model.safetensors').open('rb') as weights:
        while chunk:=weights.read(1024*1024):hasher.update(chunk)
    artifact_sha=hasher.hexdigest()
    model.eval();lock=threading.Lock()
    class Handler(BaseHTTPRequestHandler):
        def log_message(self,*args):pass
        def send(self,status,value):
            data=json.dumps(value,ensure_ascii=False).encode('utf-8');self.send_response(status)
            self.send_header('Content-Type','application/json; charset=utf-8');self.send_header('Cache-Control','no-store');self.send_header('Content-Length',str(len(data)));self.end_headers();self.wfile.write(data)
        def do_GET(self):
            self.send(200,{'ready':True,'model':'LiftLog Atlas','version':'atlas-intake-v2','quantization':mode,'artifactSha':artifact_sha}) if self.path=='/healthz' else self.send(404,{'error':'not_found'})
        def do_POST(self):
            if self.path!='/generate':return self.send(404,{'error':'not_found'})
            try:
                length=int(self.headers.get('Content-Length','0'))
                if not 0<length<=16384:return self.send(413,{'error':'request_size'})
                body=json.loads(self.rfile.read(length));messages=body['messages']
                if not isinstance(messages,list) or len(messages)!=2 or any(m.get('role')!=r or not isinstance(m.get('content'),str) for m,r in zip(messages,['system','user'])):raise ValueError()
                if not lock.acquire(blocking=False):return self.send(429,{'error':'busy'})
            except Exception:return self.send(400,{'error':'invalid_request'})
            try:
                started=time.perf_counter()
                inputs=tokenizer.apply_chat_template(messages,tokenize=True,add_generation_prompt=True,enable_thinking=False,return_tensors='pt',return_dict=True)
                if inputs['input_ids'].shape[-1]>2048:return self.send(413,{'error':'context_limit'})
                class Deadline(StoppingCriteria):
                    def __call__(self,*args,**kwargs):return time.perf_counter()-started>18
                with torch.inference_mode():output=model.generate(**inputs,max_new_tokens=512,do_sample=False,pad_token_id=tokenizer.eos_token_id,stopping_criteria=StoppingCriteriaList([Deadline()]))
                tokens=output[0,inputs['input_ids'].shape[-1]:]
                elapsed=round((time.perf_counter()-started)*1000)
                return self.send(200,{'output':tokenizer.decode(tokens,skip_special_tokens=True),'elapsedMs':elapsed,'inputTokens':inputs['input_ids'].shape[-1],'outputTokens':len(tokens),'limited':len(tokens)>=512 or elapsed>18000,'artifactSha':artifact_sha})
            except Exception:return self.send(503,{'error':'inference_failed'})
            finally:lock.release()
    server=ThreadingHTTPServer(('127.0.0.1',a.port),Handler)
    print(json.dumps({'event':'atlas_ready','port':a.port,'threads':a.threads,'quantization':mode,'artifactSha':artifact_sha}),flush=True)
    server.serve_forever()

if __name__=='__main__':main()
