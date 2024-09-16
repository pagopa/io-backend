{
  "swagger": "2.0",
  "info": {
    "version": "1.0.0",
    "title": "Proxy API",
    "description": "Mobile and web proxy API gateway."
  },
  "host": "${host}",
  "basePath": "/api/v1",
  "schemes": [
    "https"
  ],
  "security": [
    {
      "Token": []
    }
  ],
  "paths": {
    "/notify": {
      "x-swagger-router-controller": "NotificationController",
      "post": {
        "operationId": "notify",
        "summary": "Notify a user",
        "description": "Post the notification to the user using a push notification.",
        "parameters": [
          {
            "in": "body",
            "name": "body",
            "required": true,
            "schema": {
              "$ref": "#/definitions/Notification"
            },
            "x-examples": {
              "application/json": {
                "message": {
                  "content": {
                    "subject": "message subject, aliquip sint nulla in estinut",
                    "markdown": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas et mollis felis. Vivamus orci nisl, commodo ut sodales ut, eleifend a libero. Donec dapibus, turpis in mattis tempor, risus nunc malesuada ex, non aliquet metus nunc a lacus. Aenean in arcu vitae nisl porta fermentum nec non nibh. Phasellus tortor tellus, semper in metus eget, eleifend laoreet nibh. Aenean feugiat lectus ut nisl eleifend gravida."
                  },
                  "created_at": "2018-05-03T16:21:38.167Z",
                  "fiscal_code": "TMMEXQ60A10Y526X",
                  "id": "01CCKCY7QQ7WCHWTH8NB504386",
                  "sender_service_id": "5a25abf4fcc89605c082f042c49a"
                },
                "sender_metadata": {
                  "department_name": "Department name",
                  "organization_name": "Organization name",
                  "service_name": "Service name"
                }
              }
            }
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
            "description": "Bad request",
            "schema": {
              "$ref": "#/definitions/ProblemJson"
            }
          },
          "401": {
            "description": "Token null or invalid."
          },
          "500": {
            "description": "There was an error in forwarding the notification to the Notification Hub.",
            "schema": {
              "$ref": "#/definitions/ProblemJson"
            }
          }
        }
      }
    }
  },
  "definitions": {
    "CreatedMessageWithContent": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v21.0.0/openapi/definitions.yaml#/CreatedMessageWithContent"
    },
    "CreatedMessageWithoutContent": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v21.0.0/openapi/definitions.yaml#/CreatedMessageWithoutContent"
    },
    "TimeToLiveSeconds": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v21.0.0/openapi/definitions.yaml#/TimeToLiveSeconds"
    },
    "SenderMetadata": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v21.0.0/openapi/definitions.yaml#/SenderMetadata"
    },
    "ServiceId": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v21.0.0/openapi/definitions.yaml#/ServiceId"
    },
    "ServiceName": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v21.0.0/openapi/definitions.yaml#/ServiceName"
    },
    "OrganizationName": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v21.0.0/openapi/definitions.yaml#/OrganizationName"
    },
    "DepartmentName": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v21.0.0/openapi/definitions.yaml#/DepartmentName"
    },
    "Timestamp": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v21.0.0/openapi/definitions.yaml#/Timestamp"
    },
    "FiscalCode": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v21.0.0/openapi/definitions.yaml#/FiscalCode"
    },
    "MessageContent": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v21.0.0/openapi/definitions.yaml#/MessageContent"
    },
    "MessageSubject": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v21.0.0/openapi/definitions.yaml#/MessageSubject"
    },
    "MessageBodyMarkdown": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v21.0.0/openapi/definitions.yaml#/MessageBodyMarkdown"
    },
    "PaymentNoticeNumber": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v21.0.0/openapi/definitions.yaml#/PaymentNoticeNumber"
    },
    "PaymentAmount": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v21.0.0/openapi/definitions.yaml#/PaymentAmount"
    },
    "PaymentData": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v21.0.0/openapi/definitions.yaml#/PaymentData"
    },
    "ProblemJson": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v21.0.0/openapi/definitions.yaml#/ProblemJson"
    },
    "NotificationMessage": {
      "x-one-of": true,
      "allOf": [
        {
          "$ref": "#/definitions/CreatedMessageWithContent"
        },
        {
          "$ref": "#/definitions/CreatedMessageWithoutContent"
        }
      ]
    },
    "Notification": {
      "title": "Notification",
      "description": "A received Notification.",
      "type": "object",
      "properties": {
        "message": {
          "$ref": "#/definitions/NotificationMessage"
        },
        "sender_metadata": {
          "$ref": "#/definitions/SenderMetadata"
        }
      },
      "required": [
        "message",
        "sender_metadata"
      ]
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
