"""Fetch official Qwen assets from ModelScope, checking pinned bytes and SHA256."""
import concurrent.futures, hashlib, json, os, sys, time, urllib.request
from pathlib import Path

def main():
    manifest=json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
    target=Path(sys.argv[2]);target.mkdir(parents=True,exist_ok=True)
    base='https://modelscope.cn/models/Qwen/Qwen3-0.6B/resolve/master/'
    for item in manifest['files']:
        name=item['name']
        if name not in {'config.json','generation_config.json','tokenizer.json','tokenizer_config.json','merges.txt','vocab.json','model.safetensors'}:continue
        output=target/name
        size=item['bytes'];chunk=8*1024*1024
        def piece(start):
            end=min(size-1,start+chunk-1)
            for attempt in range(4):
                try:
                    request=urllib.request.Request(base+name,headers={'Range':f'bytes={start}-{end}'})
                    with urllib.request.urlopen(request,timeout=90) as response:
                        data=response.read(end-start+2)
                        if len(data)!=end-start+1:raise ValueError('range length mismatch')
                        if size>chunk and response.status!=206:raise ValueError('range unsupported')
                    return start,data
                except Exception:
                    if attempt==3:raise
                    time.sleep(attempt+1)
        with output.open('wb') as file:
            file.truncate(size)
            with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
                for start,data in pool.map(piece,range(0,size,chunk)):
                    file.seek(start);file.write(data)
        digest=hashlib.sha256()
        with output.open('rb') as file:
            while data:=file.read(1024*1024):digest.update(data)
        if output.stat().st_size!=size or digest.hexdigest()!=item['sha256']:
            output.unlink();raise ValueError('Official asset checksum mismatch: '+name)
        print(json.dumps({'verified':name,'bytes':size}),flush=True)
    print('Pinned Qwen base assets verified',flush=True)

if __name__=='__main__':main()
