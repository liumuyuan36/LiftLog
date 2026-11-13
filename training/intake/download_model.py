"""Download a pinned official public snapshot; verify weight hashes; never execute model code."""
import argparse,concurrent.futures,hashlib,json,os,time,urllib.request
from pathlib import Path

def sha256(path):
    h=hashlib.sha256()
    with path.open('rb') as f:
        while data:=f.read(8*1024*1024):h.update(data)
    return h.hexdigest()

def main():
    p=argparse.ArgumentParser()
    p.add_argument('--output',required=True,help='New directory; existing files are never overwritten')
    p.add_argument('--revision',default='c1899de289a04d12100db370d81485cdf75e47ca')
    a=p.parse_args();folder=Path(a.output).resolve()
    if folder.exists():p.error('Output directory already exists; choose a new directory')
    os.environ['HF_HOME']=str(folder.parent/'hf-cache')
    os.environ['HF_HUB_DISABLE_TELEMETRY']='1'
    os.environ['HF_HUB_DISABLE_XET']='1'
    from huggingface_hub import model_info,snapshot_download,hf_hub_url
    repo='Qwen/Qwen3-0.6B';info=model_info(repo,revision=a.revision,files_metadata=True,token=False)
    snapshot_download(repo,revision=info.sha,local_dir=str(folder),allow_patterns=['*.json','*.txt','*.model','LICENSE','README.md'],token=False,max_workers=4)
    for weight in [f for f in info.siblings if f.rfilename.endswith('.safetensors')]:
        if '/' in weight.rfilename or '\\' in weight.rfilename or not weight.lfs:raise ValueError('Unexpected weight entry')
        url=hf_hub_url(repo,weight.rfilename,revision=info.sha)
        total=weight.size;chunk_size=16*1024*1024;count=0;last=0;started=time.time()
        def chunk(start):
            end=min(total-1,start+chunk_size-1)
            for attempt in range(3):
                try:
                    request=urllib.request.Request(url,headers={'Range':f'bytes={start}-{end}'})
                    with urllib.request.urlopen(request,timeout=30) as response:
                        if response.status!=206 or response.headers.get('Content-Range')!=f'bytes {start}-{end}/{total}':raise ValueError('Unexpected range response')
                        data=response.read(end-start+2)
                        if len(data)!=end-start+1:raise ValueError('Incomplete chunk')
                        return start,data
                except Exception as error:
                    if attempt==2:raise RuntimeError(f'Download failed at byte {start}: {type(error).__name__}') from None
        with (folder/weight.rfilename).open('xb') as out,concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
            out.truncate(total);jobs=[pool.submit(chunk,start) for start in range(0,total,chunk_size)]
            try:
                for job in concurrent.futures.as_completed(jobs):
                    start,data=job.result();out.seek(start);out.write(data);count+=len(data)
                    if count-last>=128*1024*1024:
                        print(json.dumps({'downloadedMiB':count//1024//1024,'seconds':round(time.time()-started)}),flush=True);last=count
            except Exception:
                for job in jobs:job.cancel()
                raise
        if sha256(folder/weight.rfilename)!=weight.lfs.sha256:raise RuntimeError('Official weight SHA256 mismatch; do not use downloaded file')
    files=[]
    for f in info.siblings:
        path=folder/f.rfilename
        if path.is_file():files.append({'name':f.rfilename,'bytes':path.stat().st_size,'sha256':sha256(path)})
    manifest={'repo':repo,'revision':info.sha,'license':'apache-2.0','officialSource':'https://huggingface.co/'+repo,'files':files}
    (folder/'DOWNLOAD-MANIFEST.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
    print(json.dumps({'model':repo,'revision':info.sha,'verified':True}),flush=True)

if __name__=='__main__':main()
