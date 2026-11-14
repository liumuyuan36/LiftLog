"""One CPU deployment feasibility probe; not an accuracy evaluation or release gate."""
import os,json,time,resource
os.environ['HF_HUB_OFFLINE']='1'
os.environ['HF_HUB_DISABLE_TELEMETRY']='1'
import torch
from transformers import AutoTokenizer,AutoModelForCausalLM,StoppingCriteria,StoppingCriteriaList
torch.set_num_threads(2)
torch.set_num_interop_threads(1)
started=time.perf_counter()
tok=AutoTokenizer.from_pretrained('/model',local_files_only=True,trust_remote_code=False)
model=AutoModelForCausalLM.from_pretrained('/model',dtype=torch.bfloat16,attn_implementation='sdpa',local_files_only=True,trust_remote_code=False).eval()
load_seconds=time.perf_counter()-started
row=json.loads(open('/prompts',encoding='utf-8').readlines()[2])
inputs=tok.apply_chat_template(row['messages'],enable_thinking=False,add_generation_prompt=True,tokenize=True,return_tensors='pt',return_dict=True)
started=time.perf_counter()
class Deadline(StoppingCriteria):
 def __call__(self,*args,**kwargs):return time.perf_counter()-started>25
with torch.inference_mode():out=model.generate(**inputs,max_new_tokens=512,do_sample=False,pad_token_id=tok.eos_token_id,stopping_criteria=StoppingCriteriaList([Deadline()]))
elapsed=time.perf_counter()-started
ids=out[0,inputs['input_ids'].shape[-1]:]
report={'kind':'single CPU feasibility probe, not accuracy evaluation','cpus':2,'memoryLimitGiB':8,'dtype':'BF16','caseId':row['id'],'loadSeconds':load_seconds,'generateSeconds':elapsed,'outputTokens':len(ids),'limited':ids[-1].item()!=tok.eos_token_id,'maxRssMiB':resource.getrusage(resource.RUSAGE_SELF).ru_maxrss/1024,'output':tok.decode(ids,skip_special_tokens=True)}
with open('/verify/atlas17-cpu-feasibility.json','w',encoding='utf-8') as f:json.dump(report,f,ensure_ascii=False,indent=2)
print(json.dumps(report,ensure_ascii=False),flush=True)
