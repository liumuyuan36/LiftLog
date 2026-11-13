FROM pytorch/pytorch:2.7.1-cuda12.8-cudnn9-runtime@sha256:c16f4c749e2d9e96878875cdf6cc45cddda1d1a36fddd371dd6f2360f1b6e2a2
RUN python -m pip install --no-cache-dir transformers==5.22.2 peft==0.21.3 accelerate==1.15.0 huggingface_hub==2.4.0
ENV HF_HUB_DISABLE_TELEMETRY=1 DO_NOT_TRACK=1 HF_HUB_OFFLINE=1
WORKDIR /lab
