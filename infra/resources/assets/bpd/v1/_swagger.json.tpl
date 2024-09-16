{
  "swagger": "2.0",
  "info": {
    "version": "1.0.0",
    "title": "BPD API",
    "description": "Bonus Pagamenti Digitali API for user authentication."
  },
  "host": "${host}",
  "basePath": "/bpd/api/v1",
  "schemes": [
    "https"
  ],
  "security": [
    {
      "Bearer": []
    }
  ],
  "paths": {
    "/user": {
      "x-swagger-router-controller": "SSOController",
      "get": {
        "operationId": "getUserForBPD",
        "summary": "Get user's data",
        "description": "Returns the user data needed by BPD backend.",
        "responses": {
          "200": {
            "description": "Found.",
            "schema": {
              "$ref": "#/definitions/BPDUser"
            },
            "examples": {
              "application/json": {
                "name": "Name",
                "family_name": "Surname",
                "fiscal_code": "AAABBB01C02D123Z"
              }
            }
          },
          "401": {
            "description": "Token null or expired."
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
    "BPDUser": {
      "$ref": "api_backend.yaml#/definitions/FederatedUser"
    },
    "ProblemJson": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v5.0.0/openapi/definitions.yaml#/ProblemJson"
    },
    "FiscalCode": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v5.0.0/openapi/definitions.yaml#/FiscalCode"
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
    "Bearer": {
      "type": "apiKey",
      "name": "Authorization",
      "in": "header"
    }
  }
}
