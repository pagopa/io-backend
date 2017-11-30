# 4. Use a dependency injection container

Date: 2017-11-30

## Status

Accepted

## Context

We need a simple way to decouple the code. We need a simple way to swap components with mocked one for testing purpose.

## Decision

We use [Awilix](https://github.com/jeffijoe/awilix) to provide an IoC container where all services and controllers are
registered.

## Consequences

All the system components will be encapsulated in classes registered to the IoC container with a well defined name. It
will be responsibility of the IoC container to manage class instantiation and dependency resolution.
