-include env_make

NODE_VER ?= 8.6.0-alpine
TAG ?= 1.0.0

REPO = teamdigitale/italia-backend

.PHONY: build

default: build

build:
	scripts/yarn.sh
	docker build -t $(REPO):$(TAG) --build-arg NODE_VER=$(NODE_VER) ./
