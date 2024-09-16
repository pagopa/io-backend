{
  "swagger": "2.0",
  "info": {
    "version": "0.0.1",
    "title": "EU Covid Certificate service for IO App"
  },
  "host": "${host}",
  "basePath": "/api/v1/eucovidcert",
  "schemes": [
    "https"
  ],
  "security": [
    {
      "Bearer": []
    }
  ],
  "paths": {
    "/certificate": {
      "post": {
        "operationId": "getCertificate",
        "summary": "Retrieve a certificate for a given Citizen",
        "description": "Given a Citizen's fiscal code and an OTP (the auth code previously sent via IO Message), a Certificate is returned with ID, encoded QR-code, expiration date and a markdown text with all meaningful information to be shown to Citizens.",
        "parameters": [
          {
            "name": "accessData",
            "in": "body",
            "schema": {
              "$ref": "#/definitions/GetCertificateParams"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "A Certificate exists and it's found for the given access data. It is retrieved regardless of it's expired or its current status",
            "schema": {
              "$ref": "#/definitions/Certificate"
            }
          },
          "400": {
            "description": "Payload has bad format",
            "schema": {
              "$ref": "#/definitions/ProblemJson"
            }
          },
          "401": {
            "description": "Bearer token null or expired"
          },
          "403": {
            "description": "Access data provided are invalid or no Certificate has been emitted for the given Citizen"
          },
          "410": {
            "description": "Endpoint no longer available"
          },
          "500": {
            "description": "Generic server error",
            "schema": {
              "$ref": "#/definitions/ProblemJson"
            }
          },
          "504": {
            "description": "Gateway Timeout"
          }
        }
      }
    }
  },
  "definitions": {
    "GetCertificateParams": {
      "type": "object",
      "properties": {
        "auth_code": {
          "type": "string",
          "description": "OTP previously sent to the Citizen"
        },
        "preferred_languages": {
          "$ref": "#/definitions/PreferredLanguages"
        }
      },
      "required": [
        "auth_code"
      ]
    },
    "Certificate": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-eucovidcerts/master/openapi/index.yaml#/definitions/Certificate"
    },
    "ValidCertificate": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-eucovidcerts/master/openapi/index.yaml#/definitions/ValidCertificate"
    },
    "RevokedCertificate": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-eucovidcerts/master/openapi/index.yaml#/definitions/RevokedCertificate"
    },
    "ExpiredCertificate": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-eucovidcerts/master/openapi/index.yaml#/definitions/ExpiredCertificate"
    },
    "QRCode": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-eucovidcerts/master/openapi/index.yaml#/definitions/QRCode"
    },
    "PreferredLanguages": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-eucovidcerts/master/openapi/index.yaml#/definitions/PreferredLanguages"
    },
    "ProblemJson": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v20.5.3/openapi/definitions.yaml#/ProblemJson"
    }
  },
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
