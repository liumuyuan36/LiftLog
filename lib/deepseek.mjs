export async function deepseekJSON({messages,maxTokens=900,apiKey=process.env.DEEPSEEK_API_KEY,model=process.env.DEEPSEEK_MODEL||'deepseek-flash',fetchImpl=fetch}){
  if(!apiKey)throw Object.assign(Error('模型尚未配置，可以继续使用本地功能。'),{status:503,code:'not_configured'});
  const started=Date.now();
  const response=await fetchImpl('https://api.deepseek.com/chat/completions',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${apiKey}`},signal:AbortSignal.timeout(25000),body:JSON.stringify({model,max_tokens:maxTokens,response_format:{type:'json_object'},messages})});
  if(!response.ok){
    // 仅记录状态码，不记录用户描述、模型原文或密钥。
    console.warn('deepseek_request_failed',JSON.stringify({status:response.status}));
    const message=response.status===429?'模型服务繁忙，请稍后重试。':response.status===401?'DeepSeek 鉴权失败（401），请检查后台密钥。':`模型服务暂不可用（${response.status}），请检查 DeepSeek 控制台。`;
    throw Object.assign(Error(message),{status:502,code:'provider_http_'+response.status});
  }
  const raw=await response.json();let value;
  try{value=JSON.parse(raw.choices?.[0]?.message?.content);}catch{throw Object.assign(Error('模型返回格式异常，未生成有效草稿。'),{status:502,code:'invalid_output'});}
  return {value,meta:{model,elapsedMs:Date.now()-started,usage:{inputTokens:raw.usage?.prompt_tokens??null,outputTokens:raw.usage?.completion_tokens??null}}};
}
