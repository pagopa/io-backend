{
  "swagger": "2.0",
  "info": {
    "version": "1.0.0",
    "title": "Authentication API",
    "description": "Collection of endpoints to interact with user's auth session."
  },
  "host": "${host}",
  "basePath": "/",
  "schemes": [
    "https"
  ],
  "security": [
    {
      "Bearer": []
    }
  ],
  "paths": {
    "/login": {
      "get": {
        "operationId": "login",
        "summary": "Login",
        "description": "Redirect to IDP login page",
        "responses": {
          "302": {
            "description": "302 response",
            "headers": {
              "Location": {
                "type": "string"
              }
            }
          }
        }
      }
    },
    "/logout": {
      "x-swagger-router-controller": "AuthenticationController",
      "post": {
        "operationId": "logout",
        "summary": "Execute the logout",
        "description": "Delete user's active session and tokens.",
        "responses": {
          "200": {
            "description": "Logout succeeded",
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
            "description": "Bad request",
            "schema": {
              "$ref": "#/definitions/ProblemJson"
            }
          },
          "401": {
            "description": "Bearer token null or expired."
          },
          "500": {
            "description": "There was an error deleting user's session.",
            "schema": {
              "$ref": "#/definitions/ProblemJson"
            }
          }
        }
      }
    },
    "/user-identity": {
      "x-swagger-router-controller": "AuthenticationController",
      "get": {
        "operationId": "getUserIdentity",
        "summary": "Get stored user's identity",
        "description": "Returns the user's identity stored during the login phase",
        "responses": {
          "200": {
            "description": "Found.",
            "schema": {
              "$ref": "#/definitions/UserIdentity"
            },
            "examples": {
              "application/json": {
                "family_name": "Rossi",
                "fiscal_code": "TMMEXQ60A10Y526X",
                "name": "Mario",
                "spid_email": "preferred@example.com",
                "spid_mobile_phone": "1234567890"
              }
            }
          },
          "400": {
            "description": "Bad request",
            "schema": {
              "$ref": "#/definitions/ProblemJson"
            }
          },
          "401": {
            "description": "Bearer token null or expired."
          },
          "500": {
            "description": "There was an error retrieving user's profile.",
            "schema": {
              "$ref": "#/definitions/ProblemJson"
            }
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
    "EmailAddress": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v10.7.0/openapi/definitions.yaml#/EmailAddress"
    },
    "FiscalCode": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v10.7.0/openapi/definitions.yaml#/FiscalCode"
    },
    "SpidUserIdentity": {
      "type": "object",
      "title": "SPID User Identity",
      "description": "Describes the user's profile while it's authenticated with Spid.",
      "properties": {
        "family_name": {
          "type": "string"
        },
        "fiscal_code": {
          "$ref": "#/definitions/FiscalCode"
        },
        "name": {
          "type": "string"
        },
        "spid_email": {
          "$ref": "#/definitions/EmailAddress"
        },
        "date_of_birth": {
          "type": "string",
          "format": "date"
        }
      },
      "required": [
        "family_name",
        "fiscal_code",
        "name",
        "spid_email"
      ]
    },
    "CieUserIdentity": {
      "type": "object",
      "title": "CIE User Identity",
      "description": "Describes the user's profile while it's authenticated with CIE.",
      "properties": {
        "family_name": {
          "type": "string"
        },
        "fiscal_code": {
          "$ref": "#/definitions/FiscalCode"
        },
        "name": {
          "type": "string"
        },
        "date_of_birth": {
          "type": "string",
          "format": "date"
        }
      },
      "required": [
        "family_name",
        "fiscal_code",
        "name",
        "date_of_birth"
      ]
    },
    "UserIdentity": {
      "x-one-of": true,
      "allOf": [
        {
          "$ref": "#/definitions/SpidUserIdentity"
        },
        {
          "$ref": "#/definitions/CieUserIdentity"
        }
      ]
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
