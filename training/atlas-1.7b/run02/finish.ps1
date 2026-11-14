param([Parameter(Mandatory=$true)][string]$Workspace)
$ErrorActionPreference='Stop'
$atlasRoot=(Resolve-Path -LiteralPath $Workspace).Path
$atlasRepo=Join-Path $atlasRoot 'work/liftlog-github-publish'
$atlasPython=Join-Path $atlasRoot 'work/liftlog-train-venv/Scripts/python.exe'
$atlasRun=Join-Path $atlasRoot 'work/atlas-1.7b-run-02'
$atlasEval=Join-Path $atlasRepo 'evaluation/atlas17-run02'
$atlasDest=Join-Path $atlasRoot 'outputs/LiftLog-Atlas-1.7B-Run02'
Set-Location -LiteralPath $atlasRoot
function Phase([string]$value){@{phase=$value;updatedAt=[DateTime]::UtcNow.ToString('o')}|ConvertTo-Json|Set-Content -LiteralPath (Join-Path $atlasRoot 'work/atlas17-run02-status.json') -Encoding utf8;Write-Output $value}
function Py([string[]]$values,[string]$log){& $atlasPython @values *> (Join-Path $atlasRoot ('work/'+$log));if($LASTEXITCODE -ne 0){throw "Python stage failed: $log; no retry"}}
function Js([string[]]$values){& node @values;if($LASTEXITCODE -ne 0){throw 'Node stage failed; no retry'}}
try {
 Phase 'waiting_for_run02_training'
 $atlasDeadline=[DateTime]::UtcNow.AddMinutes(40)
 while(-not(Test-Path -LiteralPath (Join-Path $atlasRun 'run.json'))){if([DateTime]::UtcNow -gt $atlasDeadline){throw 'Training wait exceeded'};Start-Sleep -Seconds 2}
 $atlasInfo=Get-Content -LiteralPath (Join-Path $atlasRun 'run.json') -Raw | ConvertFrom-Json
 if($atlasInfo.status -ne 'trained_experimental_not_production' -or $atlasInfo.trainingRows -ne 810 -or $atlasInfo.epochsCompleted -gt 2){throw 'Unexpected training completion'}
 New-Item -ItemType Directory -Path $atlasDest -Force | Out-Null
 Phase 'exporting_run02'
 Py @((Join-Path $atlasRepo 'training/atlas-1.7b/export.py'),'--base',(Join-Path $atlasRoot 'work/models/Qwen3-1.7B'),'--adapter',(Join-Path $atlasRun 'adapter'),'--output',(Join-Path $atlasDest 'model'),'--name','LiftLog-Atlas-1.7B-Run02') 'atlas17-run02-export.log'
 Phase 'paired_fresh40_run01'
 Py @((Join-Path $atlasRepo 'training/atlas-1.7b/predict.py'),'--model',(Join-Path $atlasRoot 'outputs/LiftLog-Atlas-1.7B-Run01/model'),'--input',(Join-Path $atlasEval 'fresh40.prompts.jsonl'),'--output',(Join-Path $atlasRoot 'work/atlas17-run01.fresh40.predictions.jsonl'),'--batch-size','4','--max-new-tokens','512') 'atlas17-run01-fresh40.log'
 Phase 'paired_fresh40_run02'
 Py @((Join-Path $atlasRepo 'training/atlas-1.7b/predict.py'),'--model',(Join-Path $atlasDest 'model'),'--input',(Join-Path $atlasEval 'fresh40.prompts.jsonl'),'--output',(Join-Path $atlasRoot 'work/atlas17-run02.fresh40.predictions.jsonl'),'--batch-size','4','--max-new-tokens','512') 'atlas17-run02-fresh40.log'
 Js @((Join-Path $atlasRepo 'training/atlas-1.7b/run02/score.mjs'),'fresh40',(Join-Path $atlasRoot 'work/atlas17-run01.fresh40.predictions.jsonl'),'run01.fresh40.report.json')
 Js @((Join-Path $atlasRepo 'training/atlas-1.7b/run02/score.mjs'),'fresh40',(Join-Path $atlasRoot 'work/atlas17-run02.fresh40.predictions.jsonl'),'run02.fresh40.report.json')
 Phase 'regression100_run02'
 Py @((Join-Path $atlasRepo 'training/atlas-1.7b/predict.py'),'--model',(Join-Path $atlasDest 'model'),'--input',(Join-Path $atlasRepo 'evaluation/fitness-100/prompts.jsonl'),'--output',(Join-Path $atlasRoot 'work/atlas17-run02.regression100.predictions.jsonl'),'--batch-size','4','--max-new-tokens','512') 'atlas17-run02-regression100.log'
 Js @((Join-Path $atlasRepo 'training/atlas-1.7b/score.mjs'),'--predictions',(Join-Path $atlasRoot 'work/atlas17-run02.regression100.predictions.jsonl'),'--out',(Join-Path $atlasEval 'run02.regression100.report.json'))
 Phase 'workflow16_run02'
 Py @((Join-Path $atlasRepo 'training/atlas-1.7b/predict.py'),'--model',(Join-Path $atlasDest 'model'),'--input',(Join-Path $atlasRepo 'evaluation/fitness-100/workflow.prompts.jsonl'),'--output',(Join-Path $atlasRoot 'work/atlas17-run02.workflow16.predictions.jsonl'),'--batch-size','4','--max-new-tokens','1024') 'atlas17-run02-workflow16.log'
 Js @((Join-Path $atlasRepo 'training/atlas-1.7b/run02/score.mjs'),'workflow',(Join-Path $atlasRoot 'work/atlas17-run02.workflow16.predictions.jsonl'),'run02.workflow16.report.json')
 Phase 'complete_raw_evaluation_semantic_review_pending'
}catch {Phase 'failed';throw}
