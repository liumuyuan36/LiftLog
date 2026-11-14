export const ATLAS_MODEL='liftlog-atlas-1.7b-run02';
export const ATLAS_VERSION='atlas17-run02-q8_0';
export const ATLAS_SHA256='665f64068c254f73fccd732b03c6904cfc939ee66998437d77da3e4771545658';
export const atlasTextEnabled=()=>process.env.ATLAS_ENABLED==='1'&&process.env.ATLAS_MODEL_SHA256===ATLAS_SHA256;
export function atlasTextEndpoint(){
 const url=new URL(process.env.ATLAS_TEXT_URL||'http://127.0.0.1:7861');
 if(url.protocol!=='http:'||url.hostname!=='127.0.0.1'||url.username||url.password||url.pathname!=='/'||url.search||url.hash)throw Error('Atlas 推理服务必须使用本机回环地址。');
 return url.origin;
}
export const providerChanged={error:'AI 服务已切换为 LiftLog Atlas。请结束训练后关闭旧页面，再打开并确认 Atlas 处理方式；原内容不会自动转发。',code:'provider_changed'};
export function requireAtlasConsent(body){if(body?.engine!=='atlas'||body?.consent!==true)throw Object.assign(Error(providerChanged.error),{status:410,code:providerChanged.code});}
