{
  "swagger": "2.0",
  "info": {
    "version": "1.0.0",
    "title": "Session API",
    "description": "Collection of enpoints to interact with user session."
  },
  "host": "${host}",
  "basePath": "/api/v1",
  "schemes": [
    "https"
  ],
  "paths": {
    "/sessions/{fiscalcode}/lock": {
      "post": {
        "operationId": "lockUserSession",
        "summary": "Lock a user session and delete session data",
        "description": "Use this operation if you want to block a user to log in. The operation succeed if the user is already blocked",
        "parameters": [
          {
            "$ref": "#/parameters/FiscalCode"
          },
          {
            "$ref": "#/parameters/Token"
          }
        ],
        "responses": {
          "200": {
            "description": "Success.",
            "schema": {
              "$ref": "#/definitions/SuccessResponse"
            },
            "examples": {
              "application/json": {
                "message": "ok"
              }
            }
          },
          "400": {
            "description": "Bad request"
          },
          "401": {
            "description": "Token null or invalid."
          },
          "404": {
            "description": "User not found."
          },
          "500": {
            "description": "There was an error",
            "schema": {
              "$ref": "#/definitions/ProblemJson"
            }
          }
        }
      },
      "delete": {
        "operationId": "unlockUserSession",
        "summary": "Remove a lock to a user session",
        "description": "Use this operation if you want to unblock a user and re-allow to login. The operation succeed if the user wasn't blocked",
        "parameters": [
          {
            "$ref": "#/parameters/FiscalCode"
          },
          {
            "$ref": "#/parameters/Token"
          }
        ],
        "responses": {
          "200": {
            "description": "Success.",
            "schema": {
              "$ref": "#/definitions/SuccessResponse"
            },
            "examples": {
              "application/json": {
                "message": "ok"
              }
            }
          },
          "400": {
            "description": "Bad request"
          },
          "401": {
            "description": "Token null or invalid."
          },
          "500": {
            "description": "There was an error",
            "schema": {
              "$ref": "#/definitions/ProblemJson"
            }
          }
        }
      }
    }
  },
  "parameters": {
    "FiscalCode": {
      "name": "fiscalcode",
      "in": "path",
      "type": "string",
      "maxLength": 16,
      "minLength": 16,
      "required": true,
      "description": "The fiscal code of the user, all upper case.",
      "x-example": "SPNDNL80R13C555X"
    },
    "Token": {
      "name": "token",
      "in": "query",
      "type": "string",
      "required": true,
      "description": "The API key used to access this webhooks."
    }
  },
  "definitions": {
    "FiscalCode": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v21.5.3/openapi/definitions.yaml#/FiscalCode"
    },
    "ProblemJson": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v21.5.3/openapi/definitions.yaml#/ProblemJson"
    },
    "SuccessResponse": {
      "type": "object",
      "properties": {
        "message": {
          "type": "string"
        }
      }
    }
  },
  "responses": {},
  "consumes": [
    "application/json"
  ],
  "produces": [
    "application/json"
  ]
}
