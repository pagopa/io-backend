{
  "swagger": "2.0",
  "info": {
    "version": "1.0.0",
    "title": "Carta Giovani Nazionale API"
  },
  "host": "${host}",
  "basePath": "/api/v1",
  "schemes": [
    "https"
  ],
  "security": [
    {
      "Bearer": []
    }
  ],
  "paths": {
    "/cgn/status": {
      "get": {
        "operationId": "getCgnStatus",
        "summary": "Get the CGN status details",
        "description": "Get the CGN status details \nby the provided fiscal code\n",
        "responses": {
          "200": {
            "description": "CGN status details.",
            "schema": {
              "$ref": "#/definitions/Card"
            }
          },
          "401": {
            "description": "Bearer token null or expired."
          },
          "403": {
            "description": "Forbidden."
          },
          "404": {
            "description": "No CGN found."
          },
          "500": {
            "description": "Service unavailable.",
            "schema": {
              "$ref": "#/definitions/ProblemJson"
            }
          }
        }
      }
    },
    "/cgn/activation": {
      "post": {
        "operationId": "startCgnActivation",
        "summary": "Start a CGN activation procedure",
        "description": "Start a new CGN activation procedure\nfor the logged user calculating if the user is\neligible to get a CGN.\n",
        "responses": {
          "201": {
            "description": "Request created.",
            "schema": {
              "$ref": "#/definitions/InstanceId"
            },
            "headers": {
              "Location": {
                "type": "string",
                "description": "Location (URL) of created request resource.\nA GET request to this URL returns the request status and details."
              }
            }
          },
          "202": {
            "description": "Processing request.",
            "schema": {
              "$ref": "#/definitions/InstanceId"
            }
          },
          "401": {
            "description": "Bearer token null or expired."
          },
          "403": {
            "description": "Cannot activate a new CGN because the user is ineligible to get the CGN.\n"
          },
          "409": {
            "description": "Cannot activate the user's cgn because another updateCgn request was found\nfor this user or it is already active.\n"
          },
          "500": {
            "description": "Service unavailable.",
            "schema": {
              "$ref": "#/definitions/ProblemJson"
            }
          }
        }
      },
      "get": {
        "operationId": "getCgnActivation",
        "summary": "Get CGN activation process status\n",
        "description": "Get informations about a CGN activation process\n",
        "responses": {
          "200": {
            "description": "Cgn activation details.",
            "schema": {
              "$ref": "#/definitions/CgnActivationDetail"
            }
          },
          "401": {
            "description": "Bearer token null or expired."
          },
          "403": {
            "description": "Forbidden."
          },
          "404": {
            "description": "No CGN activation process found."
          },
          "500": {
            "description": "Service unavailable.",
            "schema": {
              "$ref": "#/definitions/ProblemJson"
            }
          }
        }
      }
    },
    "/cgn/eyca/activation": {
      "post": {
        "operationId": "startEycaActivation",
        "summary": "Start an EYCA activation procedure",
        "description": "Start a new EYCA activation procedure\nfor the logged user calculating if the user is\neligible to enable EYCA on his CGN card.\n",
        "responses": {
          "201": {
            "description": "Request created.",
            "schema": {
              "$ref": "#/definitions/InstanceId"
            },
            "headers": {
              "Location": {
                "type": "string",
                "description": "Location (URL) of created request resource.\nA GET request to this URL returns the request status and details."
              }
            }
          },
          "202": {
            "description": "Processing request.",
            "schema": {
              "$ref": "#/definitions/InstanceId"
            }
          },
          "401": {
            "description": "Bearer token null or expired."
          },
          "403": {
            "description": "Cannot activate EYCA Card because the user is ineligible to enable EYCA.\n"
          },
          "409": {
            "description": "Cannot activate EYCA Card because another EYCA Card activation request was found\nfor this user or it is already active.\n"
          },
          "500": {
            "description": "Service unavailable.",
            "schema": {
              "$ref": "#/definitions/ProblemJson"
            }
          }
        }
      },
      "get": {
        "operationId": "getEycaActivation",
        "summary": "Get EYCA activation process' status\n",
        "description": "Get informations about an EYCA activation process\n",
        "responses": {
          "200": {
            "description": "Eyca Card activation details.",
            "schema": {
              "$ref": "#/definitions/EycaActivationDetail"
            }
          },
          "401": {
            "description": "Wrong or missing function key."
          },
          "403": {
            "description": "Forbidden."
          },
          "404": {
            "description": "No EYCA Card activation process found."
          },
          "500": {
            "description": "Service unavailable.",
            "schema": {
              "$ref": "#/definitions/ProblemJson"
            }
          }
        }
      }
    },
    "/cgn/eyca/status": {
      "get": {
        "operationId": "getEycaStatus",
        "summary": "Get the Eyca Card status details",
        "description": "Get the Eyca Card status details\n",
        "responses": {
          "200": {
            "description": "Eyca Card status details.",
            "schema": {
              "$ref": "#/definitions/EycaCard"
            }
          },
          "401": {
            "description": "Bearer token null or expired."
          },
          "403": {
            "description": "Forbidden."
          },
          "404": {
            "description": "No Eyca Card found."
          },
          "409": {
            "description": "Conflict."
          },
          "500": {
            "description": "Service unavailable.",
            "schema": {
              "$ref": "#/definitions/ProblemJson"
            }
          }
        }
      }
    },
    "/cgn/otp": {
      "post": {
        "operationId": "generateOtp",
        "summary": "Generate a new Otp related to a CGN\n",
        "description": "Generate a new Otp used to discount an online purchase\nthrough a valid CGN\n",
        "responses": {
          "200": {
            "description": "Otp generated.",
            "schema": {
              "$ref": "#/definitions/Otp"
            }
          },
          "401": {
            "description": "Bearer token null or expired."
          },
          "403": {
            "description": "Forbidden."
          },
          "500": {
            "description": "Service unavailable.",
            "schema": {
              "$ref": "#/definitions/ProblemJson"
            }
          }
        }
      }
    }
  },
  "definitions": {
    "Timestamp": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v17.3.0/openapi/definitions.yaml#/Timestamp"
    },
    "FiscalCode": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v17.3.0/openapi/definitions.yaml#/FiscalCode"
    },
    "ProblemJson": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v17.3.0/openapi/definitions.yaml#/ProblemJson"
    },
    "InstanceId": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-cgn/v0.2.0/openapi/index.yaml#/definitions/InstanceId"
    },
    "CommonCard": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-cgn/v0.2.0/openapi/index.yaml#/definitions/CommonCard"
    },
    "CardPending": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-cgn/v0.2.0/openapi/index.yaml#/definitions/CardPending"
    },
    "CardActivated": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-cgn/v0.2.0/openapi/index.yaml#/definitions/CardActivated"
    },
    "CardRevoked": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-cgn/v0.2.0/openapi/index.yaml#/definitions/CardRevoked"
    },
    "CardExpired": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-cgn/v0.2.0/openapi/index.yaml#/definitions/CardExpired"
    },
    "Card": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-cgn/v0.2.0/openapi/index.yaml#/definitions/Card"
    },
    "CgnActivationDetail": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-cgn/v0.2.0/openapi/index.yaml#/definitions/CgnActivationDetail"
    },
    "EycaActivationDetail": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-cgn/v0.2.0/openapi/index.yaml#/definitions/EycaActivationDetail"
    },
    "EycaCard": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-cgn/v0.2.0/openapi/index.yaml#/definitions/EycaCard"
    },
    "EycaCardActivated": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-cgn/v0.2.0/openapi/index.yaml#/definitions/EycaCardActivated"
    },
    "EycaCardExpired": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-cgn/v0.2.0/openapi/index.yaml#/definitions/EycaCardExpired"
    },
    "EycaCardRevoked": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-cgn/v0.2.0/openapi/index.yaml#/definitions/EycaCardRevoked"
    },
    "CcdbNumber": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-cgn/v0.2.0/openapi/index.yaml#/definitions/CcdbNumber"
    },
    "Otp": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-cgn/v0.2.0/openapi/index.yaml#/definitions/Otp"
    },
    "OtpCode": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-cgn/v0.2.0/openapi/index.yaml#/definitions/OtpCode"
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
