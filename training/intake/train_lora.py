"""Local supervised LoRA pilot. No API, telemetry, remote-code execution or Hub upload."""
import os
os.environ.setdefault('HF_HUB_DISABLE_TELEMETRY', '1')
os.environ.setdefault('DO_NOT_TRACK', '1')
import argparse
import hashlib
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent

def read_split(split, data_dir):
    path = data_dir / f'{split}.sft.jsonl'
    manifest = json.loads((data_dir / 'manifest.json').read_text(encoding='utf-8'))
    if hashlib.sha256(path.read_bytes()).hexdigest() != manifest['files'][path.name]['sha256']:
        raise ValueError('Dataset hash differs; rebuild and review data first')
    return [json.loads(line) for line in path.read_text(encoding='utf-8').splitlines() if line]

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--model', required=True, help='Local snapshot directory or verified model ID')
    parser.add_argument('--output', required=True)
    parser.add_argument('--epochs', type=float, default=3)
    parser.add_argument('--max-length', type=int, default=4096)
    parser.add_argument('--data',type=Path,default=HERE/'data')
    parser.add_argument('--batch-size',type=int,default=1)
    parser.add_argument('--accumulation',type=int,default=4)
    parser.add_argument('--rank',type=int,default=8)
    parser.add_argument('--all-linear',action='store_true')
    parser.add_argument('--learning-rate',type=float,default=1e-4)
    parser.add_argument('--resume-from-checkpoint',default=None)
    parser.add_argument('--adapter',default=None,help='Warm-start a prior adapter with a new optimizer; not checkpoint resume')
    parser.add_argument('--allow-synthetic', action='store_true', help='Acknowledge this pilot is not independently human-reviewed')
    parser.add_argument('--preflight', action='store_true', help='Tokenize and check loss masks, do not load weights or train')
    args = parser.parse_args()
    if not args.allow_synthetic:
        parser.error('Synthetic labels need independent review; experimental pilot requires --allow-synthetic')
    if Path(args.output).exists():
        parser.error('Output already exists; choose a new run directory')
    import torch
    from transformers import AutoTokenizer, AutoModelForCausalLM, Trainer, TrainingArguments, set_seed
    from peft import LoraConfig, get_peft_model
    if not torch.cuda.is_available():
        raise RuntimeError('CUDA unavailable; no automatic CPU fallback or cloud rental')
    set_seed(42)
    tokenizer = AutoTokenizer.from_pretrained(args.model, trust_remote_code=False)
    if tokenizer.pad_token_id is None:
        tokenizer.pad_token = tokenizer.eos_token
    def tokenize(row):
        prompt = tokenizer.apply_chat_template(row['prompt'], tokenize=False, add_generation_prompt=True, enable_thinking=False)
        prefix = tokenizer.encode(prompt, add_special_tokens=False)
        completion = tokenizer.encode(row['completion'][0]['content'], add_special_tokens=False) + [tokenizer.eos_token_id]
        ids = prefix + completion
        if len(ids) > args.max_length:
            raise ValueError(f'Example length {len(ids)} exceeds limit; never silently truncate labels')
        return {'input_ids': ids, 'attention_mask': [1] * len(ids), 'labels': [-100] * len(prefix) + completion}
    train = [tokenize(row) for row in read_split('train',args.data)]
    validation = [tokenize(row) for row in read_split('validation',args.data)]
    info = {'seed':42, 'model':args.model, 'gpu':torch.cuda.get_device_name(0), 'trainingRows':len(train), 'validationRows':len(validation), 'testRowsUsedForTraining':0, 'maxTokens':max(len(r['input_ids']) for r in train+validation), 'loss':'completion only; prompt and padding masked', 'labelQuality':'AI-authored synthetic; pending human review', 'epochs':args.epochs}
    download_manifest=Path(args.model)/'DOWNLOAD-MANIFEST.json'
    if download_manifest.is_file():
        info['baseModelManifest']=json.loads(download_manifest.read_text(encoding='utf-8'))
    targets='all-linear' if args.all_linear else ['q_proj','v_proj']
    info['hyperparameters']={'loraRank':args.rank,'loraAlpha':args.rank*2,'loraDropout':0.05,'targetModules':targets,'learningRate':args.learning_rate,'batchSize':args.batch_size,'gradientAccumulationSteps':args.accumulation,'dtype':'bfloat16','optimizer':'adamw_torch','selection':'minimum validation loss','maxLength':args.max_length}
    info['sourceSha256']={name:hashlib.sha256((HERE/name).read_bytes()).hexdigest() for name in ['train_lora.py','predict_local.py','protocol.mjs']}
    info['resumeFromCheckpoint']=args.resume_from_checkpoint
    info['warmStartAdapter']=args.adapter
    print(json.dumps(info, ensure_ascii=False), flush=True)
    if args.preflight:
        return
    model = AutoModelForCausalLM.from_pretrained(args.model, torch_dtype=torch.bfloat16, attn_implementation='sdpa', trust_remote_code=False)
    model.config.use_cache = False
    if args.adapter:
        from peft import PeftModel
        model=PeftModel.from_pretrained(model,args.adapter,is_trainable=True)
        if model.peft_config['default'].r!=args.rank:raise ValueError('Warm-start adapter rank differs from requested metadata')
    else:
        model = get_peft_model(model, LoraConfig(task_type='CAUSAL_LM', r=args.rank, lora_alpha=args.rank*2, lora_dropout=0.05, target_modules=targets))
    model.print_trainable_parameters()
    def collate(rows):
        length = max(len(r['input_ids']) for r in rows)
        return {key:torch.tensor([r[key] + [tokenizer.pad_token_id if key=='input_ids' else -100 if key=='labels' else 0]*(length-len(r[key])) for r in rows], dtype=torch.long) for key in ['input_ids','attention_mask','labels']}
    training_args = TrainingArguments(output_dir=args.output, num_train_epochs=args.epochs, learning_rate=args.learning_rate, per_device_train_batch_size=args.batch_size, per_device_eval_batch_size=args.batch_size, gradient_accumulation_steps=args.accumulation, bf16=True, gradient_checkpointing=True, gradient_checkpointing_kwargs={'use_reentrant':False}, eval_strategy='epoch', save_strategy='epoch', save_total_limit=2, load_best_model_at_end=True, metric_for_best_model='eval_loss', greater_is_better=False, logging_steps=20, report_to='none', push_to_hub=False, dataloader_num_workers=0, seed=42, data_seed=42, optim='adamw_torch', remove_unused_columns=False)
    trainer = Trainer(model=model, args=training_args, train_dataset=train, eval_dataset=validation, data_collator=collate)
    result = trainer.train(resume_from_checkpoint=args.resume_from_checkpoint)
    adapter_dir = Path(args.output) / 'adapter'
    trainer.save_model(str(adapter_dir))
    tokenizer.save_pretrained(str(adapter_dir))
    info.update({'status':'trained_experimental_not_production', 'metrics':result.metrics, 'bestCheckpoint':trainer.state.best_model_checkpoint, 'trainableParameters':sum(p.numel() for p in model.parameters() if p.requires_grad), 'totalParameters':sum(p.numel() for p in model.parameters()), 'datasetManifest':json.loads((args.data/'manifest.json').read_text(encoding='utf-8')), 'versions':{package:__import__('importlib.metadata',fromlist=['version']).version(package) for package in ['torch','transformers','peft','accelerate']}})
    (Path(args.output)/'run.json').write_text(json.dumps(info,ensure_ascii=False,indent=2),encoding='utf-8')

if __name__ == '__main__':
    main()
