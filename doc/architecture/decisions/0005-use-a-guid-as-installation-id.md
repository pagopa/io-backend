# 5. Use a GUID as Installation ID

Date: 2018-04-27

## Status

Accepted

## Context

When adding a new installation in the Notification Hub an Installation ID has to be provided by the App. Notification Hub
says nothing about the format of this field, just that it is a string. Complete documentation can be found 
[here](https://msdn.microsoft.com/en-us/library/azure/mt621153.aspx).

## Decision

We decided to enforce the type of the Installation ID field to be a canonical GUID as described
[here](https://en.wikipedia.org/wiki/Universally_unique_identifier). We suggest to use the
[version 4](https://en.wikipedia.org/wiki/Universally_unique_identifier#Version_4_(random)).

The sixteen octets of an Installation ID are represented as 32 hexadecimal (base 16) digits, displayed in five groups 
separated by hyphens, in the form `8-4-4-4-12` for a total of 36 characters (32 alphanumeric characters and four hyphens).

For example: `123e4567-e89b-12d3-a456-426655440000`

## Consequences

Client App MUST generate an unique identifier following this format or the installation will not be accepted by the
proxy.
