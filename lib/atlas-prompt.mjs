// Exact two-message, non-thinking Qwen3 template used during Atlas SFT.
// Reserved template tokens in user data are rejected rather than interpreted.
export function atlasPrompt(messages){
 if(!Array.isArray(messages)||messages.length!==2||messages.some((m,i)=>m?.role!==['system','user'][i]||typeof m.content!=='string'||!m.content.trim()))throw Error('Atlas 消息格式无效。');
 if(messages.some(m=>/<\|(?:im_start|im_end|endoftext)\|>/.test(m.content)))throw Object.assign(Error('输入包含保留标记，请使用普通训练描述。'),{status:400,code:'reserved_tokens'});
 if(messages.reduce((n,m)=>n+m.content.length,0)>18000)throw Object.assign(Error('本次内容过长，请分段输入。'),{status:413,code:'context_limit'});
 return messages.map(m=>`<|im_start|>${m.role}\n${m.content}<|im_end|>\n`).join('')+'<|im_start|>assistant\n<think>\n\n</think>\n\n';
}
