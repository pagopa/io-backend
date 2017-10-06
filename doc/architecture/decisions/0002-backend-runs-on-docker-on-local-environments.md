# 2. Backend runs on Docker on local environments

Date: 2017-09-21

## Status

Accepted

## Context

We need a reliable infrastructure definition that will allow developers to replicate the environment on their local
machine.

## Decision

We use Docker (1.13.0+) to encapsulate all architecture components. We use Docker Compose (1.13.0+) to orchestrate
the containers in a local environment.

## Consequences

Backend code will be built and executed inside of a Docker container. On developers machine the only tools needed to
build and run the application will be Docker and Docker Compose.
