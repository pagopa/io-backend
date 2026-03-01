FROM node:18.13.0@sha256:d871edd5b68105ebcbfcde3fe8c79d24cbdbb30430d9bd6251c57c56c7bd7646
LABEL maintainer="https://teamdigitale.governo.it"
RUN apt-get update && apt-get install -y --no-install-recommends libunwind8 \
&& \
apt-get clean
