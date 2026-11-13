param(
  [Parameter(Mandatory=$true)][string]$ModelDirectory,
  [Parameter(Mandatory=$true)][string]$ResultsDirectory,
  [Parameter(Mandatory=$true)][string]$RunsDirectory,
  [ValidateSet('preflight','base','train','lora')][string]$Mode='preflight'
)
$ErrorActionPreference='Stop'
$labRoot=(Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '../..')).Path
$modelRoot=(Resolve-Path -LiteralPath $ModelDirectory).Path
foreach($directory in @($ResultsDirectory,$RunsDirectory)){
  New-Item -ItemType Directory -Path $directory -Force | Out-Null
}
$resultRoot=(Resolve-Path -LiteralPath $ResultsDirectory).Path
$runRoot=(Resolve-Path -LiteralPath $RunsDirectory).Path
$dockerArgs=@('run','--rm','--gpus','all','--network','none',
  '--mount',"type=bind,source=$labRoot,target=/lab,readonly",
  '--mount',"type=bind,source=$modelRoot,target=/model,readonly",
  '--mount',"type=bind,source=$resultRoot,target=/results",
  '--mount',"type=bind,source=$runRoot,target=/runs",'liftlog-intake-train:pilot','python')
if($Mode -in @('preflight','train')){
  $dockerArgs+=@('training/intake/train_lora.py','--model','/model','--output','/runs/run-01','--allow-synthetic')
  if($Mode -eq 'preflight'){$dockerArgs+='--preflight'}
}else{
  $dockerArgs+=@('training/intake/predict_local.py','--model','/model','--input','training/intake/data/test.prompts.jsonl','--output',"/results/$Mode.predictions.jsonl")
  if($Mode -eq 'lora'){$dockerArgs+=@('--adapter','/runs/run-01/adapter')}
}
& docker @dockerArgs
if($LASTEXITCODE -ne 0){throw "Local GPU container failed, exit $LASTEXITCODE"}
