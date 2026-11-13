export default function handler(req,res){
  res.setHeader('Cache-Control','no-store');res.statusCode=200;
  res.json({configured:Boolean(process.env.DEEPSEEK_API_KEY),provider:'DeepSeek',model:process.env.DEEPSEEK_MODEL||'deepseek-flash'});
}
