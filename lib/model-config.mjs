// One server-side setting shared by every text-generation task.
export const primaryModel=()=>process.env.DEEPSEEK_MODEL||'deepseek-flash';
export function aiAvailability(){return {configured:Boolean(process.env.DEEPSEEK_API_KEY),provider:'DeepSeek',model:primaryModel(),mode:'single-model',atlas:{configured:false,ready:false,archived:true}};}
export const retiredProvider={error:'此版本已统一使用 DeepSeek。请关闭并重新打开页面，在确认新的处理方式后重试；原描述不会自动转发。',code:'provider_retired'};
