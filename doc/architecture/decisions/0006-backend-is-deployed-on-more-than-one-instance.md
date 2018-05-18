# 6. Backend is deployed on more than one instance

Date: 2018-05-18

## Status

Draft

## Context

We need to deploy the backend to multiple instances to guarantee the horizontal scalability of the system.
At the moment the only external component used is the Redis server that maintains the users sessions. 

## Decision

We decided to use the Redis service provided by [Azure](https://azure.microsoft.com/en-us/services/cache).
We decided to use the Premium version that provides us the following features:

* Redis data persistence
* Redis cluster
* Scale out to multiple cache units
* Azure Virtual Network

## Consequences

Connections to the Redis cluster will be managed by the `redis-clustr`
[package](https://github.com/gosquared/redis-clustr).
