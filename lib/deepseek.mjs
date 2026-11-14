// Historical experiment adapter; excluded from the current deployment package.
const primaryModel=()=>process.env.DEEPSEEK_MODEL||'deepseek-flash';
function rejectedOutput(code,message,raw){
  const choice=raw?.choices?.[0],content=choice?.message?.content;
  const known=['stop','length','tool_calls','content_filter','insufficient_system_resource'];
  // Only structural diagnostics: never log prompts, model text, reasoning, or keys.
  console.warn('deepseek_output_rejected',JSON.stringify({code,finishReason:known.includes(choice?.finish_reason)?choice.finish_reason:'unknown',contentLength:typeof content==='string'?content.length:null}));
  return Object.assign(Error(message),{status:502,code});
}

export async function deepseekJSON({messages,maxTokens=900,apiKey=process.env.DEEPSEEK_API_KEY,model=primaryModel(),fetchImpl=fetch}){
  if(!apiKey)throw Object.assign(Error('模型尚未配置，可以继续使用本地功能。'),{status:503,code:'not_configured'});
  const started=Date.now();
  // These tasks extract data or select existing IDs; they do not require reasoning.
  // DeepSeek defaults to thinking mode, which can consume the small output budget.
  const response=await fetchImpl('https://api.deepseek.com/chat/completions',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${apiKey}`},signal:AbortSignal.timeout(25000),body:JSON.stringify({model,max_tokens:maxTokens,thinking:{type:'disabled'},response_format:{type:'json_object'},messages})});
  if(!response.ok){
    // 仅记录状态码，不记录用户描述、模型原文或密钥。
    console.warn('deepseek_request_failed',JSON.stringify({status:response.status}));
    const message=response.status===429?'模型服务繁忙，请稍后重试。':response.status===401?'DeepSeek 鉴权失败（401），请检查后台密钥。':`模型服务暂不可用（${response.status}），请检查 DeepSeek 控制台。`;
    throw Object.assign(Error(message),{status:502,code:'provider_http_'+response.status});
  }
  let raw;
  try{raw=await response.json();}catch{throw rejectedOutput('invalid_response','模型服务未返回有效响应，本次结果未采用。可以继续使用本地功能。');}
  const choice=raw?.choices?.[0];
  if(!choice?.message)throw rejectedOutput('invalid_response','模型服务缺少结果内容，本次结果未采用。可以继续使用本地功能。',raw);
  if(choice.finish_reason==='length')throw rejectedOutput('output_truncated','模型输出被截断，本次结果未采用。可以继续使用本地功能，或稍后手动重试。',raw);
  if(choice.finish_reason&&choice.finish_reason!=='stop')throw rejectedOutput('generation_stopped','模型提前结束，本次结果未采用。可以继续使用本地功能。',raw);
  const content=choice.message.content;
  if(typeof content!=='string'||!content.trim())throw rejectedOutput('empty_output','模型返回了空内容，本次结果未生成。可以继续使用本地功能，或稍后手动重试。',raw);
  let value;
  try{value=JSON.parse(content);}catch{throw rejectedOutput('invalid_output','模型未返回可解析的 JSON，本次结果未采用。可以继续使用本地功能。',raw);}
  if(!value||typeof value!=='object'||Array.isArray(value))throw rejectedOutput('invalid_output','模型返回的结果结构不正确，本次结果未采用。可以继续使用本地功能。',raw);
  return {value,meta:{model,elapsedMs:Date.now()-started,usage:{inputTokens:raw.usage?.prompt_tokens??null,outputTokens:raw.usage?.completion_tokens??null}}};
}
