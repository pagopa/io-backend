{
  "swagger": "2.0",
  "info": {
    "version": "1.0.0",
    "title": "Public API",
    "description": "Mobile and web proxy API gateway."
  },
  "host": "${host}",
  "basePath": "/",
  "schemes": [
    "https"
  ],
  "paths": {
    "/info": {
      "x-swagger-router-controller": "ServerInfoController",
      "get": {
        "operationId": "getServerInfo",
        "summary": "Runtime server info",
        "description": "Returns runtime information about the server.\n",
        "responses": {
          "200": {
            "description": "Runtime server info.",
            "schema": {
              "$ref": "#/definitions/ServerInfo"
            },
            "examples": {
              "application/json": {
                "version": "0.0.1",
                "min_app_version": "0.0.0",
                "min_app_version_pagopa": "0.0.0"
              }
            }
          }
        }
      }
    },
    "/test-login": {
      "x-swagger-router-controller": "AuthenticationController",
      "post": {
        "operationId": "testLogin",
        "summary": "Login Test User with password",
        "description": "Login Test User with password and Fiscal Code",
        "parameters": [
          {
            "in": "body",
            "name": "body",
            "schema": {
              "$ref": "#/definitions/PasswordLogin"
            },
            "required": true,
            "x-examples": {
              "application/json": {
                "username": "AAABBB01C02D345Z",
                "password": "secret"
              }
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Access token",
            "schema": {
              "$ref": "#/definitions/AccessToken"
            }
          },
          "401": {
            "description": "Invalid credentials"
          },
          "500": {
            "description": "Unavailable service",
            "schema": {
              "$ref": "#/definitions/ProblemJson"
            }
          }
        }
      }
    }
  },
  "definitions": {
    "FiscalCode": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v5.0.0/openapi/definitions.yaml#/FiscalCode"
    },
    "ProblemJson": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v5.0.0/openapi/definitions.yaml#/ProblemJson"
    },
    "ServerInfo": {
      "type": "object",
      "title": "Server information",
      "properties": {
        "version": {
          "type": "string"
        },
        "min_app_version": {
          "$ref": "#/definitions/VersionPerPlatform"
        },
        "min_app_version_pagopa": {
          "$ref": "#/definitions/VersionPerPlatform"
        }
      },
      "required": [
        "version",
        "min_app_version",
        "min_app_version_pagopa"
      ]
    },
    "VersionPerPlatform": {
      "type": "object",
      "title": "Specify a version for ios and another for android",
      "properties": {
        "ios": {
          "type": "string"
        },
        "android": {
          "type": "string"
        }
      },
      "required": [
        "ios",
        "android"
      ]
    },
    "PasswordLogin": {
      "type": "object",
      "properties": {
        "username": {
          "$ref": "#/definitions/FiscalCode"
        },
        "password": {
          "type": "string",
          "minLength": 1
        }
      },
      "required": [
        "username",
        "password"
      ]
    },
    "AccessToken": {
      "type": "object",
      "properties": {
        "token": {
          "type": "string",
          "minLength": 1
        }
      },
      "required": [
        "token"
      ]
    }
  },
  "consumes": [
    "application/json"
  ],
  "produces": [
    "application/json"
  ]
}
