FROM node:24-bookworm-slim AS node
FROM python:3.12-slim-bookworm
COPY --from=node /usr/local/bin/node /usr/local/bin/node
RUN apt-get update && apt-get install -y --no-install-recommends libgomp1 libstdc++6 && rm -rf /var/lib/apt/lists/*
RUN python -m pip install --no-cache-dir torch==2.7.1+cpu --index-url https://download.pytorch.org/whl/cpu && python -m pip install --no-cache-dir transformers==5.22.2 peft==0.21.3 accelerate==1.15.0
ENV HF_HUB_DISABLE_TELEMETRY=1 HF_HUB_OFFLINE=1 DO_NOT_TRACK=1 OMP_NUM_THREADS=2 MKL_NUM_THREADS=2
WORKDIR /app
