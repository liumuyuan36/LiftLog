import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(fileURLToPath(new URL('../',import.meta.url)));
http.createServer(async(req,res)=>{try{const rel=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=path.resolve(root,'.'+rel);if(!file.startsWith(root+path.sep))throw Error();const data=await fs.readFile(file);res.writeHead(200,{'Content-Type':({'.js':'text/javascript','.json':'application/json','.html':'text/html','.css':'text/css','.webp':'image/webp'})[path.extname(file)]??'text/plain','Cache-Control':'no-store'});res.end(data);}catch{res.writeHead(404);res.end('Not found');}}).listen(52991,'127.0.0.1',()=>console.log('LiftLog art studio: http://127.0.0.1:52991/artwork/studio.html'));
