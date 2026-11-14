param([Parameter(Mandatory=$true)][string]$Workspace)
$ErrorActionPreference='Stop'
$atlasWorkspace=(Resolve-Path -LiteralPath $Workspace).Path
$atlasRepo=Join-Path $atlasWorkspace 'work/liftlog-github-publish'
$atlasPython=Join-Path $atlasWorkspace 'work/liftlog-train-venv/Scripts/python.exe'
$atlasRun=Join-Path $atlasWorkspace 'work/atlas-1.7b-run-01-resume'
$atlasBase=Join-Path $atlasWorkspace 'work/models/Qwen3-1.7B'
$atlasPackage=Join-Path $atlasWorkspace 'outputs/LiftLog-Atlas-1.7B-Run01'
$atlasEvaluation=Join-Path $atlasRepo 'evaluation/fitness-100'
$atlasStatus=Join-Path $atlasWorkspace 'work/atlas17-pipeline-status.json'
Set-Location -LiteralPath $atlasWorkspace
function Set-AtlasPhase([string]$phase) {
  @{phase=$phase;updatedAt=[DateTime]::UtcNow.ToString('o')} | ConvertTo-Json | Set-Content -LiteralPath $atlasStatus -Encoding utf8
  Write-Output $phase
}
function Invoke-AtlasPython([string[]]$arguments,[string]$logName) {
  & $atlasPython @arguments *> (Join-Path $atlasWorkspace ('work/'+$logName))
  if($LASTEXITCODE -ne 0){throw "Atlas Python stage failed: $logName. Preserve logs and outputs; no automatic retry."}
}
function Invoke-AtlasNode([string[]]$arguments) {
  & node @arguments
  if($LASTEXITCODE -ne 0){throw 'Atlas Node stage failed. Preserve outputs; no automatic retry.'}
}
try {
  Set-AtlasPhase 'waiting_for_training'
  $atlasDeadline=[DateTime]::UtcNow.AddMinutes(45)
  while(-not(Test-Path -LiteralPath (Join-Path $atlasRun 'run.json'))) {
    if([DateTime]::UtcNow -gt $atlasDeadline){throw 'Training did not finish before the pipeline wait limit'}
    Start-Sleep -Seconds 2
  }
  $atlasRunInfo=Get-Content -LiteralPath (Join-Path $atlasRun 'run.json') -Raw | ConvertFrom-Json
  if($atlasRunInfo.status -ne 'trained_experimental_not_production' -or $atlasRunInfo.baseModelManifest.revision -ne '70d244cc86ccca08cf5af4e1e306ecf908b1ad5e'){throw 'Unexpected completed training identity'}
  if($atlasRunInfo.epochsCompleted -gt 3 -or $atlasRunInfo.trainingRows -ne 977){throw 'Training differs from frozen plan'}
  New-Item -ItemType Directory -Path $atlasPackage -Force | Out-Null
  Set-AtlasPhase 'exporting_complete_model'
  Invoke-AtlasPython @((Join-Path $atlasRepo 'training/atlas-1.7b/export.py'),'--base',$atlasBase,'--adapter',(Join-Path $atlasRun 'adapter'),'--output',(Join-Path $atlasPackage 'model')) 'atlas17-export.log'
  Set-AtlasPhase 'predicting_baseline100'
  Invoke-AtlasPython @((Join-Path $atlasRepo 'training/atlas-1.7b/predict.py'),'--model',$atlasBase,'--input',(Join-Path $atlasEvaluation 'prompts.jsonl'),'--output',(Join-Path $atlasWorkspace 'work/atlas17.base100.predictions.jsonl'),'--batch-size','4','--max-new-tokens','512') 'atlas17-base100.log'
  Set-AtlasPhase 'predicting_atlas100'
  Invoke-AtlasPython @((Join-Path $atlasRepo 'training/atlas-1.7b/predict.py'),'--model',(Join-Path $atlasPackage 'model'),'--input',(Join-Path $atlasEvaluation 'prompts.jsonl'),'--output',(Join-Path $atlasWorkspace 'work/atlas17.atlas100.predictions.jsonl'),'--batch-size','4','--max-new-tokens','512') 'atlas17-atlas100.log'
  Set-AtlasPhase 'scoring_frozen100'
  Invoke-AtlasNode @((Join-Path $atlasRepo 'training/atlas-1.7b/score.mjs'),'--predictions',(Join-Path $atlasWorkspace 'work/atlas17.base100.predictions.jsonl'),'--out',(Join-Path $atlasEvaluation 'base.report.json'))
  Invoke-AtlasNode @((Join-Path $atlasRepo 'training/atlas-1.7b/score.mjs'),'--predictions',(Join-Path $atlasWorkspace 'work/atlas17.atlas100.predictions.jsonl'),'--out',(Join-Path $atlasEvaluation 'atlas.report.json'))
  Set-AtlasPhase 'cross_task_smoke16'
  Invoke-AtlasPython @((Join-Path $atlasRepo 'training/atlas-1.7b/predict.py'),'--model',(Join-Path $atlasPackage 'model'),'--input',(Join-Path $atlasEvaluation 'workflow.prompts.jsonl'),'--output',(Join-Path $atlasWorkspace 'work/atlas17.workflow16.predictions.jsonl'),'--batch-size','4','--max-new-tokens','1024') 'atlas17-workflow16.log'
  Invoke-AtlasNode @((Join-Path $atlasRepo 'training/atlas-1.7b/workflow-smoke.mjs'),'score',(Join-Path $atlasWorkspace 'work/atlas17.workflow16.predictions.jsonl'))
  Set-AtlasPhase 'packaging_evidence'
  Invoke-AtlasNode @((Join-Path $atlasRepo 'training/atlas-1.7b/package.mjs'))
  Invoke-AtlasNode @((Join-Path $atlasRepo 'training/atlas-1.7b/write-report.mjs'))
  Set-AtlasPhase 'complete_local_experiment_not_deployed'
} catch {
  @{phase='failed';updatedAt=[DateTime]::UtcNow.ToString('o');error=$_.Exception.Message} | ConvertTo-Json | Set-Content -LiteralPath $atlasStatus -Encoding utf8
  throw
}
