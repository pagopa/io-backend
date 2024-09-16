{
  "swagger": "2.0",
  "info": {
    "version": "1.0.0",
    "title": "MyPortal API",
    "description": "MyPortal API for user authentication."
  },
  "host": "${host}",
  "basePath": "/myportal/api/v1",
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
        "operationId": "getUserForMyPortal",
        "summary": "Get user's data",
        "description": "Returns the user data needed by MyPortal backend.",
        "responses": {
          "200": {
            "description": "Found.",
            "schema": {
              "$ref": "#/definitions/MyPortalUser"
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
    "LimitedFederatedUser": {
      "$ref": "api_backend.yaml#/definitions/LimitedFederatedUser"
    },
    "MyPortalUser": {
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
