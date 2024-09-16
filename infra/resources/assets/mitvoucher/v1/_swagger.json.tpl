{
  "swagger": "2.0",
  "info": {
    "version": "0.0.1",
    "title": "MIT Voucher service for IO App"
  },
  "host": "${host}",
  "basePath": "/api/v1/mitvoucher/auth",
  "schemes": [
    "https"
  ],
  "security": [
    {
      "Bearer": []
    }
  ],
  "paths": {
    "/token": {
      "get": {
        "operationId": "getMitVoucherToken",
        "summary": "Retrieve a token for Mit Voucher API integration",
        "description": "Generate a JWT to use on every MIT Voucher remote API call",
        "responses": {
          "200": {
            "description": "Payload with Json Web Token",
            "schema": {
              "$ref": "#/definitions/MitVoucherToken"
            }
          },
          "400": {
            "description": "Payload has bad format"
          },
          "401": {
            "description": "Bearer token null or expired"
          },
          "403": {
            "description": "Access data provided are invalid"
          },
          "410": {
            "description": "Endpoint no longer available"
          },
          "500": {
            "description": "Generic server error"
          },
          "504": {
            "description": "Gateway Timeout"
          }
        }
      }
    }
  },
  "definitions": {
    "ProblemJson": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v10.7.0/openapi/definitions.yaml#/ProblemJson"
    },
    "SuccessResponse": {
      "$ref": "api_backend.yaml#/definitions/SuccessResponse"
    },
    "MitVoucherToken": {
      "title": "Mit Voucher Token",
      "description": "A Json Web Token used to call Mit Voucher APIs",
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
  "securityDefinitions": {
    "Bearer": {
      "type": "apiKey",
      "name": "Authorization",
      "in": "header"
    }
  }
}
