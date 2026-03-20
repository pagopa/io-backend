FROM node:22.22.0@sha256:20a424ecd1d2064a44e12fe287bf3dae443aab31dc5e0c0cb6c74bef9c78911c
LABEL maintainer="https://teamdigitale.governo.it"
RUN apt-get update && apt-get install -y --no-install-recommends libunwind8 \
    && \
    apt-get clean
