{
  "swagger": "2.0",
  "info": {
    "version": "1.0.0",
    "title": "Proxy API",
    "description": "Mobile and web proxy API gateway."
  },
  "host": "${host}",
  "basePath": "/pagopa/api/v1",
  "schemes": [
    "https"
  ],
  "security": [
    {
      "Token": []
    }
  ],
  "paths": {
    "/user": {
      "x-swagger-router-controller": "PagoPAController",
      "get": {
        "operationId": "getUser",
        "summary": "Get user's data",
        "description": "Returns the user data needed by PagoPA Wallet backend.",
        "parameters": [
          {
            "in": "query",
            "name": "version",
            "type": "string",
            "enum": [
              "20200114"
            ]
          }
        ],
        "responses": {
          "200": {
            "description": "Found.",
            "schema": {
              "$ref": "#/definitions/PagoPAUser"
            },
            "examples": {
              "application/json": {
                "email": "email@example.com",
                "name": "Name",
                "family_name": "Surname"
              }
            }
          },
          "400": {
            "description": "Bad request.",
            "schema": {
              "$ref": "#/definitions/ProblemJson"
            }
          },
          "401": {
            "description": "Token null or invalid."
          },
          "404": {
            "description": "User Profile not found",
            "schema": {
              "$ref": "#/definitions/ProblemJson"
            }
          },
          "429": {
            "description": "Too many requests",
            "schema": {
              "$ref": "#/definitions/ProblemJson"
            }
          },
          "500": {
            "description": "There was an error in retrieving the user data.",
            "schema": {
              "$ref": "#/definitions/ProblemJson"
            }
          }
        }
      }
    }
  },
  "definitions": {
    "EmailAddress": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v5.0.0/openapi/definitions.yaml#/EmailAddress"
    },
    "ProblemJson": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v5.0.0/openapi/definitions.yaml#/ProblemJson"
    },
    "FiscalCode": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v5.0.0/openapi/definitions.yaml#/FiscalCode"
    },
    "FederatedUser": {
      "$ref": "api_backend.yaml#/definitions/FederatedUser"
    },
    "PagoPAUser": {
      "title": "PagoPA user",
      "description": "User data needed by PagaPA proxy.",
      "allOf": [
        {
          "$ref": "#/definitions/FederatedUser"
        },
        {
          "type": "object",
          "properties": {
            "spid_email": {
              "$ref": "#/definitions/EmailAddress"
            },
            "notice_email": {
              "$ref": "#/definitions/EmailAddress"
            }
          },
          "required": [
            "notice_email"
          ]
        }
      ]
    }
  },
  "responses": {},
  "parameters": {},
  "consumes": [
    "application/json"
  ],
  "produces": [
    "application/json"
  ],
  "securityDefinitions": {
    "Token": {
      "type": "apiKey",
      "name": "token",
      "in": "query"
    }
  }
}
