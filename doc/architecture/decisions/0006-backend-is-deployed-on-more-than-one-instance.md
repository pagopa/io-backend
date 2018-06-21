# 6. Backend is deployed on more than one instance

Date: 2018-05-29

## Status

Accepted

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

When the cluster is scaled up Azure will create more nodes, it then copies a number of keys from the
existing nodes to the new ones, removing that keys from the existing nodes only if the operation completes successfully.

The Azure Redis cluster is only accessible from the Azure VNet so during development we continue to use a Redis instance
running as a Docker container.

## Consequences

To connect to the cluster we need a client library that supports clustering.

* add the `redis-clustr` package to add a thin wrapper around the node
[redis_client](https://github.com/mranney/node_redis) to enable use of
[Redis Cluster](http://redis.io/topics/cluster-spec).
* only use the Redis database 0 (Azure does't allow us to use the SELECT command to switch to database other than 0) 
* remove the Docker container used to test Redis and add a new set of environment variables to store the data needed
to connect to Azure.

Locally we don't use a Redis cluster so there is a switch in code to use a client that supports clustering only when the
`NODE_ENV` environment variable is not `dev`.
