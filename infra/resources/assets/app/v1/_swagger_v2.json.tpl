{
  "swagger": "2.0",
  "info": {
    "version": "1.0.0",
    "title": "Backend Proxy API",
    "description": "Mobile and web proxy API gateway."
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
    "/services/{service_id}": {
      "x-swagger-router-controller": "ServicesController",
      "parameters": [
        {
          "name": "service_id",
          "in": "path",
          "type": "string",
          "required": true,
          "description": "The ID of an existing Service."
        }
      ],
      "get": {
        "operationId": "getService",
        "summary": "Get Service",
        "description": "A previously created service with the provided service ID is returned.",
        "responses": {
          "200": {
            "description": "Service found.",
            "schema": {
              "$ref": "#/definitions/ServicePublic"
            },
            "examples": {
              "application/json": {
                "department_name": "IO",
                "organization_fiscal_code": "00000000000",
                "organization_name": "IO",
                "service_id": "5a563817fcc896087002ea46c49a",
                "service_name": "App IO",
                "version": 1
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
          "404": {
            "description": "No service found for the provided ID.",
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
            "description": "There was an error in retrieving the service.",
            "schema": {
              "$ref": "#/definitions/ProblemJson"
            }
          }
        },
        "parameters": []
      }
    },
    "/services/{service_id}/preferences": {
      "post": {
        "operationId": "upsertServicePreferences",
        "summary": "UpsertServicePreferences",
        "parameters": [
          {
            "name": "service_id",
            "in": "path",
            "type": "string",
            "required": true,
            "description": "The ID of an existing Service."
          },
          {
            "in": "body",
            "name": "body",
            "schema": {
              "$ref": "#/definitions/ServicePreference"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Service Preference found.",
            "schema": {
              "$ref": "#/definitions/ServicePreference"
            },
            "examples": {
              "application/json": {
                "is_inbox_enabled": true,
                "is_email_enabled": false,
                "is_webhook_enabled": true,
                "settings_version": 1
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
            "description": "Unauthorized"
          },
          "404": {
            "description": "No service found for the provided ID."
          },
          "409": {
            "description": "Conflict. Either the provided preference setting version is not consistent with the current version stored in the Profile\nor the Profile is not in the correct preference mode."
          },
          "429": {
            "description": "Too many requests"
          },
          "500": {
            "description": "Internal Server Error"
          }
        }
      },
      "get": {
        "operationId": "getServicePreferences",
        "summary": "GetServicePreferences",
        "parameters": [
          {
            "name": "service_id",
            "in": "path",
            "type": "string",
            "required": true,
            "description": "The ID of an existing Service."
          }
        ],
        "responses": {
          "200": {
            "description": "Service Preference found.",
            "schema": {
              "$ref": "#/definitions/ServicePreference"
            },
            "examples": {
              "application/json": {
                "is_inbox_enabled": true,
                "is_email_enabled": false,
                "is_webhook_enabled": true,
                "settings_version": 1
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
            "description": "Unauthorized"
          },
          "404": {
            "description": "No service found for the provided ID."
          },
          "409": {
            "description": "Conflict. The Profile is not in the correct preference mode."
          },
          "429": {
            "description": "Too many requests"
          },
          "500": {
            "description": "Internal Server Error"
          }
        }
      }
    },
    "/services": {
      "x-swagger-router-controller": "ServicesController",
      "get": {
        "operationId": "getVisibleServices",
        "summary": "Get all visible services",
        "description": "Returns the description of all visible services.",
        "responses": {
          "200": {
            "description": "Found.",
            "schema": {
              "$ref": "#/definitions/PaginatedServiceTupleCollection"
            },
            "examples": {
              "application/json": {
                "items": [
                  {
                    "service_id": "AzureDeployc49a",
                    "version": 1
                  },
                  {
                    "service_id": "5a25abf4fcc89605c082f042c49a",
                    "version": 0
                  }
                ],
                "page_size": 1
              }
            }
          },
          "401": {
            "description": "Bearer token null or expired."
          },
          "429": {
            "description": "Too many requests",
            "schema": {
              "$ref": "#/definitions/ProblemJson"
            }
          },
          "500": {
            "description": "There was an error in retrieving the services.",
            "schema": {
              "$ref": "#/definitions/ProblemJson"
            }
          }
        },
        "parameters": [
          {
            "$ref": "#/parameters/PaginationRequest"
          }
        ]
      }
    },
    "/messages": {
      "x-swagger-router-controller": "MessagesController",
      "parameters": [
        {
          "$ref": "#/parameters/PageSize"
        },
        {
          "$ref": "#/parameters/EnrichResultData"
        },
        {
          "$ref": "#/parameters/MaximumId"
        },
        {
          "$ref": "#/parameters/MinimumId"
        }
      ],
      "get": {
        "operationId": "getUserMessages",
        "summary": "Get user's messages",
        "description": "Returns the messages for the user identified by the provided fiscal code.\nMessages will be returned in inverse acceptance order (from last to first).\nThe \"next\" field, when present, contains an URL pointing to the next page of results.",
        "responses": {
          "200": {
            "description": "Found.",
            "schema": {
              "$ref": "#/definitions/PaginatedPublicMessagesCollection"
            },
            "examples": {
              "application/json": {
                "items": [
                  {
                    "created_at": "2018-05-21T07:36:41.209Z",
                    "fiscal_code": "LSSLCU79B24L219P",
                    "id": "01CE0T1Z18T3NT9ECK5NJ09YR3",
                    "sender_service_id": "5a563817fcc896087002ea46c49a",
                    "time_to_live": 3600
                  },
                  {
                    "created_at": "2018-05-21T07:41:01.361Z",
                    "fiscal_code": "LSSLCU79B24L219P",
                    "id": "01CE0T9X1HT595GEF8FH9NRSW7",
                    "sender_service_id": "5a563817fcc896087002ea46c49a",
                    "time_to_live": 3600
                  }
                ],
                "next": "01CE0T9X1HT595GEF8FH9NRSW7"
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
          "404": {
            "description": "No message found.",
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
            "description": "There was an error in retrieving the messages.",
            "schema": {
              "$ref": "#/definitions/ProblemJson"
            }
          }
        }
      }
    },
    "/messages/{id}": {
      "x-swagger-router-controller": "MessagesController",
      "parameters": [
        {
          "name": "id",
          "in": "path",
          "type": "string",
          "required": true,
          "description": "The ID of the message."
        }
      ],
      "get": {
        "operationId": "getUserMessage",
        "summary": "Get message",
        "description": "Returns the message with the provided message ID.",
        "responses": {
          "200": {
            "description": "Found.",
            "schema": {
              "$ref": "#/definitions/CreatedMessageWithContentAndAttachments"
            },
            "examples": {
              "application/json": "content: {\n  markdown: \"hey hey !! <a style=\\\"color: red\\\" href=\\\"http://example.com\\\"> some content here ..... this is a link with a style applied, some other content</a>\",\n  subject: \"my subject ............\",\n  attachments: [{name:\"attachment\", content:\"aBase64Encoding\", mime_type: \"image/png\"}]\n},\ncreated_at: \"2018-06-06T12:22:24.523Z\",\nfiscal_code: \"LSSLCU79B24L219P\",\nid: \"01CFAGRMGB9XCA8B2CQ4QA7K76\",\nsender_service_id: \"5a25abf4fcc89605c082f042c49a\",\ntime_to_live: 3600\n"
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
          "404": {
            "description": "No message found for the provided ID.",
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
            "description": "There was an error in retrieving the message.",
            "schema": {
              "$ref": "#/definitions/ProblemJson"
            }
          }
        }
      }
    },
    "/legal-messages/{id}": {
      "x-swagger-router-controller": "MessagesController",
      "parameters": [
        {
          "name": "id",
          "in": "path",
          "type": "string",
          "required": true,
          "description": "The ID of the message."
        }
      ],
      "get": {
        "operationId": "getUserLegalMessage",
        "summary": "Get legal message",
        "description": "Returns the legal message with the provided message ID.",
        "responses": {
          "200": {
            "description": "Found.",
            "schema": {
              "$ref": "#/definitions/LegalMessageWithContent"
            },
            "examples": {
              "application/json": "content: {\n  markdown: \"hey hey !! <a style=\\\"color: red\\\" href=\\\"http://example.com\\\"> some content here ..... this is a link with a style applied, some other content</a>\",\n  subject: \"my subject ............\",\n  attachments: [{name:\"attachment\", content:\"aBase64Encoding\", mime_type: \"image/png\"}]\n},\ncreated_at: \"2018-06-06T12:22:24.523Z\",\nfiscal_code: \"LSSLCU79B24L219P\",\nid: \"01CFAGRMGB9XCA8B2CQ4QA7K76\",\nsender_service_id: \"5a25abf4fcc89605c082f042c49a\",\ntime_to_live: 3600\n"
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
          "404": {
            "description": "No message found for the provided ID.",
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
            "description": "There was an error in retrieving the message.",
            "schema": {
              "$ref": "#/definitions/ProblemJson"
            }
          }
        }
      }
    },
    "/legal-messages/{legal_message_unique_id}/attachments/{attachment_id}": {
      "x-swagger-router-controller": "MessagesController",
      "get": {
        "operationId": "getLegalMessageAttachment",
        "summary": "Retrieve an attachment of a legal message",
        "produces": [
          "application/octet-stream"
        ],
        "parameters": [
          {
            "in": "path",
            "name": "legal_message_unique_id",
            "required": true,
            "type": "string"
          },
          {
            "in": "path",
            "name": "attachment_id",
            "required": true,
            "type": "string"
          }
        ],
        "responses": {
          "200": {
            "description": "Success",
            "schema": {
              "format": "binary",
              "type": "string"
            }
          },
          "400": {
            "description": "Bad Request"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          },
          "429": {
            "description": "Too Many Requests"
          },
          "500": {
            "description": "Internal Server Error"
          }
        }
      }
    },
    "/profile": {
      "x-swagger-router-controller": "ProfileController",
      "get": {
        "operationId": "getUserProfile",
        "summary": "Get user's profile",
        "description": "Returns the profile for the user identified by the provided fiscal code.",
        "responses": {
          "200": {
            "description": "Found.",
            "schema": {
              "$ref": "#/definitions/InitializedProfile"
            },
            "examples": {
              "application/json": {
                "email": "email@example.com",
                "family_name": "Rossi",
                "fiscal_code": "TMMEXQ60A10Y526X",
                "has_profile": true,
                "is_email_set": true,
                "is_inbox_enabled": true,
                "is_webhook_enabled": true,
                "name": "Mario",
                "spid_email": "preferred@example.com",
                "service_preferences_settings": [
                  {
                    "mode": "LEGACY"
                  }
                ],
                "version": 1
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
          "429": {
            "description": "Too many requests",
            "schema": {
              "$ref": "#/definitions/ProblemJson"
            }
          },
          "500": {
            "description": "There was an error in retrieving the user profile.",
            "schema": {
              "$ref": "#/definitions/ProblemJson"
            }
          }
        }
      },
      "post": {
        "operationId": "updateProfile",
        "summary": "Update the User's profile",
        "description": "Update the profile for the user identified by the provided fiscal code.",
        "parameters": [
          {
            "in": "body",
            "name": "body",
            "schema": {
              "$ref": "#/definitions/Profile"
            },
            "required": true,
            "x-examples": {
              "application/json": {
                "email": "foobar@example.com",
                "preferred_languages": [
                  "it_IT"
                ],
                "is_inbox_enabled": true,
                "is_webhook_enabled": false,
                "version": 1
              }
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Profile updated.",
            "schema": {
              "$ref": "#/definitions/InitializedProfile"
            },
            "examples": {
              "application/json": {
                "email": "email@example.com",
                "family_name": "Rossi",
                "fiscal_code": "TMMEXQ60A10Y526X",
                "has_profile": true,
                "is_email_set": true,
                "is_inbox_enabled": true,
                "is_webhook_enabled": true,
                "name": "Mario",
                "spid_email": "preferred@example.com",
                "version": 0
              }
            }
          },
          "400": {
            "description": "Invalid payload.",
            "schema": {
              "$ref": "#/definitions/ProblemJson"
            }
          },
          "401": {
            "description": "Bearer token null or expired."
          },
          "404": {
            "description": "User not found",
            "schema": {
              "$ref": "#/definitions/ProblemJson"
            }
          },
          "409": {
            "description": "Conflict.",
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
            "description": "Profile cannot be updated.",
            "schema": {
              "$ref": "#/definitions/ProblemJson"
            }
          }
        }
      }
    },
    "/api-profile": {
      "x-swagger-router-controller": "ProfileController",
      "get": {
        "operationId": "getApiUserProfile",
        "summary": "Get user's profile stored into the API",
        "description": "Returns the profile for the user identified by the provided fiscal code.",
        "responses": {
          "200": {
            "description": "Found.",
            "schema": {
              "$ref": "#/definitions/ExtendedProfile"
            },
            "examples": {
              "application/json": {
                "email": "email@example.com",
                "preferred_languages": [
                  "it_IT"
                ],
                "is_inbox_enabled": true,
                "accepted_tos_version": 1,
                "is_webhook_enabled": true,
                "is_email_enabled": true,
                "version": 1,
                "sender_allowed": true
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
          "404": {
            "description": "Profile not found",
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
            "description": "There was an error in retrieving the user profile.",
            "schema": {
              "$ref": "#/definitions/ProblemJson"
            }
          }
        }
      }
    },
    "/email-validation-process": {
      "x-swagger-router-controller": "ProfileController",
      "post": {
        "operationId": "startEmailValidationProcess",
        "summary": "Start the Email Validation Process",
        "description": "Start the email validation process that create the validation token\nand send the validation email",
        "responses": {
          "202": {
            "description": "Accepted"
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
          "404": {
            "description": "Profile not found",
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
            "description": "There was an error starting email validation process",
            "schema": {
              "$ref": "#/definitions/ProblemJson"
            }
          }
        }
      }
    },
    "/user-metadata": {
      "x-swagger-router-controller": "userMetadataController",
      "get": {
        "operationId": "getUserMetadata",
        "summary": "Get user's metadata",
        "description": "Returns metadata for the current authenticated user.",
        "responses": {
          "200": {
            "description": "Found.",
            "schema": {
              "$ref": "#/definitions/UserMetadata"
            }
          },
          "204": {
            "description": "No Content."
          },
          "401": {
            "description": "Bearer token null or expired."
          },
          "500": {
            "description": "There was an error in retrieving the user metadata.",
            "schema": {
              "$ref": "#/definitions/ProblemJson"
            }
          }
        }
      },
      "post": {
        "operationId": "upsertUserMetadata",
        "summary": "Set User's metadata",
        "description": "Create or update metadata for the current authenticated user.",
        "parameters": [
          {
            "in": "body",
            "name": "body",
            "schema": {
              "$ref": "#/definitions/UserMetadata"
            },
            "required": true
          }
        ],
        "responses": {
          "200": {
            "description": "User Metadata updated.",
            "schema": {
              "$ref": "#/definitions/UserMetadata"
            }
          },
          "400": {
            "description": "Invalid payload.",
            "schema": {
              "$ref": "#/definitions/ProblemJson"
            }
          },
          "401": {
            "description": "Bearer token null or expired."
          },
          "409": {
            "description": "Conflict.",
            "schema": {
              "$ref": "#/definitions/ProblemJson"
            }
          },
          "500": {
            "description": "Profile cannot be updated.",
            "schema": {
              "$ref": "#/definitions/ProblemJson"
            }
          }
        }
      }
    },
    "/installations/{installationID}": {
      "x-swagger-router-controller": "NotificationController",
      "parameters": [
        {
          "name": "installationID",
          "in": "path",
          "required": true,
          "description": "The ID of the message.",
          "type": "string"
        }
      ],
      "put": {
        "operationId": "createOrUpdateInstallation",
        "summary": "Create or update an Installation",
        "description": "Create or update an Installation to the Azure Notification hub.",
        "parameters": [
          {
            "name": "body",
            "in": "body",
            "schema": {
              "$ref": "#/definitions/Installation"
            },
            "required": true,
            "x-examples": {
              "application/json": {
                "platform": "gcm",
                "pushChannel": "fLKP3EATnBI:APA91bEy4go681jeSEpLkNqhtIrdPnEKu6Dfi-STtUiEnQn8RwMfBiPGYaqdWrmzJyXIh5Yms4017MYRS9O1LGPZwA4sOLCNIoKl4Fwg7cSeOkliAAtlQ0rVg71Kr5QmQiLlDJyxcq3p"
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
          "401": {
            "description": "Bearer token null or expired."
          },
          "500": {
            "description": "There was an error in registering the device to the Notification Hub.",
            "schema": {
              "$ref": "#/definitions/ProblemJson"
            }
          }
        }
      }
    },
    "/session": {
      "x-swagger-router-controller": "AuthenticationController",
      "get": {
        "operationId": "getSessionState",
        "summary": "Get the user current session",
        "description": "Return the session state for the current authenticated user.",
        "responses": {
          "200": {
            "description": "Found.",
            "schema": {
              "$ref": "#/definitions/PublicSession"
            },
            "examples": {
              "application/json": {
                "spidLevel": "https://www.spid.gov.it/SpidL2",
                "walletToken": "c77de47586c841adbd1a1caeb90dce25dcecebed620488a4f932a6280b10ee99a77b6c494a8a6e6884ccbeb6d3fe736b"
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
            "description": "Internal server error",
            "schema": {
              "$ref": "#/definitions/ProblemJson"
            }
          }
        }
      }
    },
    "/sessions": {
      "x-swagger-router-controller": "AuthenticationController",
      "get": {
        "operationId": "listUserSessions",
        "summary": "List sessions of a User",
        "description": "Return all the active sessions for an authenticated User.",
        "responses": {
          "200": {
            "description": "Found.",
            "schema": {
              "$ref": "#/definitions/SessionsList"
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
            "description": "Unavailable service",
            "schema": {
              "$ref": "#/definitions/ProblemJson"
            }
          }
        }
      }
    },
    "/token/support": {
      "x-swagger-router-controller": "SupportController",
      "get": {
        "operationId": "getSupportToken",
        "summary": "Get a JWT Support Token",
        "description": "Return a JWT Support Token for the authenticated user.",
        "responses": {
          "200": {
            "description": "Created.",
            "schema": {
              "$ref": "#/definitions/SupportToken"
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
            "description": "Unavailable service",
            "schema": {
              "$ref": "#/definitions/ProblemJson"
            }
          }
        }
      }
    },
    "/payment-requests/{rptId}": {
      "x-swagger-router-controller": "PagoPAProxyController",
      "parameters": [
        {
          "name": "rptId",
          "in": "path",
          "required": true,
          "description": "Unique identifier for payments.",
          "type": "string"
        },
        {
          "name": "test",
          "in": "query",
          "description": "Use test environment of PagoPAClient",
          "type": "boolean",
          "required": false
        }
      ],
      "get": {
        "operationId": "getPaymentInfo",
        "summary": "Get Payment Info",
        "description": "Retrieve information about a payment",
        "responses": {
          "200": {
            "description": "Payment information retrieved",
            "schema": {
              "$ref": "#/definitions/PaymentRequestsGetResponse"
            },
            "examples": {
              "application/json": {
                "importoSingoloVersamento": "200,",
                "codiceContestoPagamento": "ABC123"
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
            "description": "PagoPA services are not available or request is rejected",
            "schema": {
              "$ref": "#/definitions/PaymentProblemJson"
            }
          }
        }
      }
    },
    "/payment-activations": {
      "x-swagger-router-controller": "PagoPAProxyController",
      "parameters": [
        {
          "name": "test",
          "in": "query",
          "description": "Use test environment of PagoPAClient",
          "type": "boolean",
          "required": false
        }
      ],
      "post": {
        "operationId": "activatePayment",
        "summary": "Activate Payment",
        "description": "Require a lock (activation) for a payment",
        "parameters": [
          {
            "in": "body",
            "name": "body",
            "schema": {
              "$ref": "#/definitions/PaymentActivationsPostRequest"
            },
            "required": true,
            "x-examples": {
              "application/json": {
                "rptId": "12345678901012123456789012345",
                "importoSingoloVersamento": 200,
                "codiceContestoPagamento": "ABC123"
              }
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Payment activation process started",
            "schema": {
              "$ref": "#/definitions/PaymentActivationsPostResponse"
            },
            "examples": {
              "application/json": {
                "importoSingoloVersamento": 200
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
            "description": "PagoPA services are not available or request is rejected",
            "schema": {
              "$ref": "#/definitions/PaymentProblemJson"
            }
          }
        }
      }
    },
    "/payment-activations/{codiceContestoPagamento}": {
      "x-swagger-router-controller": "PagoPAProxyController",
      "parameters": [
        {
          "name": "codiceContestoPagamento",
          "in": "path",
          "required": true,
          "description": "Transaction Id used to identify the communication flow.",
          "type": "string"
        },
        {
          "name": "test",
          "in": "query",
          "description": "Use test environment of PagoPAClient",
          "type": "boolean",
          "required": false
        }
      ],
      "get": {
        "operationId": "getActivationStatus",
        "summary": "Get Activation status",
        "description": "Check the activation status to retrieve the paymentId",
        "responses": {
          "200": {
            "description": "Payment information",
            "schema": {
              "$ref": "#/definitions/PaymentActivationsGetResponse"
            },
            "examples": {
              "application/json": {
                "idPagamento": "123455"
              }
            }
          },
          "400": {
            "description": "Invalid input",
            "schema": {
              "$ref": "#/definitions/ProblemJson"
            }
          },
          "401": {
            "description": "Bearer token null or expired."
          },
          "404": {
            "description": "Activation status not found",
            "schema": {
              "$ref": "#/definitions/ProblemJson"
            }
          },
          "500": {
            "description": "Unavailable service",
            "schema": {
              "$ref": "#/definitions/ProblemJson"
            }
          }
        }
      }
    },
    "/user-data-processing": {
      "x-swagger-router-controller": "UserDataProcessingController",
      "post": {
        "operationId": "upsertUserDataProcessing",
        "summary": "Set User's data processing choices",
        "description": "Let the authenticated user express his will to retrieve or delete his stored data.",
        "parameters": [
          {
            "in": "body",
            "name": "body",
            "schema": {
              "$ref": "#/definitions/UserDataProcessingChoiceRequest"
            },
            "required": true
          }
        ],
        "responses": {
          "200": {
            "description": "User Data processing created / updated.",
            "schema": {
              "$ref": "#/definitions/UserDataProcessing"
            }
          },
          "400": {
            "description": "Invalid payload.",
            "schema": {
              "$ref": "#/definitions/ProblemJson"
            }
          },
          "401": {
            "description": "Bearer token null or expired."
          },
          "409": {
            "description": "Conflict.",
            "schema": {
              "$ref": "#/definitions/ProblemJson"
            }
          },
          "429": {
            "description": "Too may requests"
          },
          "500": {
            "description": "User Data processing choice cannot be taken in charge.",
            "schema": {
              "$ref": "#/definitions/ProblemJson"
            }
          }
        }
      }
    },
    "/user-data-processing/{choice}": {
      "x-swagger-router-controller": "UserDataProcessingController",
      "get": {
        "operationId": "getUserDataProcessing",
        "summary": "Get User's data processing",
        "description": "Get the user's request to delete or download his stored data by providing a kind of choice.",
        "parameters": [
          {
            "$ref": "#/parameters/UserDataProcessingChoiceParam"
          }
        ],
        "responses": {
          "200": {
            "description": "User data processing retrieved",
            "schema": {
              "$ref": "#/definitions/UserDataProcessing"
            }
          },
          "401": {
            "description": "Bearer token null or expired."
          },
          "404": {
            "description": "Not found.",
            "schema": {
              "$ref": "#/definitions/ProblemJson"
            }
          },
          "429": {
            "description": "Too many requests"
          }
        }
      },
      "delete": {
        "operationId": "abortUserDataProcessing",
        "summary": "Abort User's revious data processing request",
        "description": "Ask for a request to abort, if present",
        "tags": [
          "restricted"
        ],
        "parameters": [
          {
            "$ref": "#/parameters/UserDataProcessingChoiceParam"
          }
        ],
        "responses": {
          "202": {
            "description": "The abort request has been recorded"
          },
          "400": {
            "description": "Invalid request.",
            "schema": {
              "$ref": "#/definitions/ProblemJson"
            }
          },
          "401": {
            "description": "Unauthorized"
          },
          "404": {
            "description": "Not Found"
          },
          "409": {
            "description": "Conflict",
            "schema": {
              "$ref": "#/definitions/ProblemJson"
            }
          },
          "429": {
            "description": "Too many requests"
          },
          "500": {
            "description": "Server Error",
            "schema": {
              "$ref": "#/definitions/ProblemJson"
            }
          }
        }
      }
    }
  },
  "definitions": {
    "AcceptedTosVersion": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v22.5.0/openapi/definitions.yaml#/AcceptedTosVersion"
    },
    "BlockedInboxOrChannels": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v22.5.0/openapi/definitions.yaml#/BlockedInboxOrChannels"
    },
    "DepartmentName": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v22.5.0/openapi/definitions.yaml#/DepartmentName"
    },
    "EmailAddress": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v22.5.0/openapi/definitions.yaml#/EmailAddress"
    },
    "PreferredLanguage": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v22.5.0/openapi/definitions.yaml#/PreferredLanguage"
    },
    "PreferredLanguages": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v22.5.0/openapi/definitions.yaml#/PreferredLanguages"
    },
    "Profile": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v22.5.0/openapi/definitions.yaml#/Profile"
    },
    "ExtendedProfile": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v22.5.0/openapi/definitions.yaml#/ExtendedProfile"
    },
    "FiscalCode": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v22.5.0/openapi/definitions.yaml#/FiscalCode"
    },
    "IsEmailEnabled": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v22.5.0/openapi/definitions.yaml#/IsEmailEnabled"
    },
    "IsInboxEnabled": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v22.5.0/openapi/definitions.yaml#/IsInboxEnabled"
    },
    "IsEmailValidated": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v22.5.0/openapi/definitions.yaml#/IsEmailValidated"
    },
    "IsTestProfile": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v22.5.0/openapi/definitions.yaml#/IsTestProfile"
    },
    "IsWebhookEnabled": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v22.5.0/openapi/definitions.yaml#/IsWebhookEnabled"
    },
    "LimitedProfile": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v22.5.0/openapi/definitions.yaml#/LimitedProfile"
    },
    "MessageBodyMarkdown": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v22.5.0/openapi/definitions.yaml#/MessageBodyMarkdown"
    },
    "MessageContent": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v22.5.0/openapi/definitions.yaml#/MessageContent"
    },
    "MessageResponseNotificationStatus": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v22.5.0/openapi/definitions.yaml#/MessageResponseNotificationStatus"
    },
    "NotificationChannelStatusValue": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v22.5.0/openapi/definitions.yaml#/NotificationChannelStatusValue"
    },
    "NotificationChannel": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v22.5.0/openapi/definitions.yaml#/NotificationChannel"
    },
    "MessageSubject": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v22.5.0/openapi/definitions.yaml#/MessageSubject"
    },
    "MessageContentBase": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v22.5.0/openapi/definitions.yaml#/MessageContentBase"
    },
    "EUCovidCert": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v22.5.0/openapi/definitions.yaml#/EUCovidCert"
    },
    "OrganizationFiscalCode": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v22.5.0/openapi/definitions.yaml#/OrganizationFiscalCode"
    },
    "NewMessageContent": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v22.5.0/openapi/definitions.yaml#/NewMessageContent"
    },
    "Payee": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v22.5.0/openapi/definitions.yaml#/Payee"
    },
    "PaymentDataBase": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v22.5.0/openapi/definitions.yaml#/PaymentDataBase"
    },
    "PaymentDataWithRequiredPayee": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v22.5.0/openapi/definitions.yaml#/PaymentDataWithRequiredPayee"
    },
    "OrganizationName": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v22.5.0/openapi/definitions.yaml#/OrganizationName"
    },
    "PaginationResponse": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v22.5.0/openapi/definitions.yaml#/PaginationResponse"
    },
    "PrescriptionData": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v22.5.0/openapi/definitions.yaml#/PrescriptionData"
    },
    "ProblemJson": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v22.5.0/openapi/definitions.yaml#/ProblemJson"
    },
    "ServiceId": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v22.5.0/openapi/definitions.yaml#/ServiceId"
    },
    "ServiceName": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v22.5.0/openapi/definitions.yaml#/ServiceName"
    },
    "ServicePublic": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v22.5.0/openapi/definitions.yaml#/ServicePublic"
    },
    "ServiceMetadata": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v22.5.0/openapi/definitions.yaml#/ServiceMetadata"
    },
    "CommonServiceMetadata": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v22.5.0/openapi/definitions.yaml#/CommonServiceMetadata"
    },
    "StandardServiceMetadata": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v22.5.0/openapi/definitions.yaml#/StandardServiceMetadata"
    },
    "SpecialServiceMetadata": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v22.5.0/openapi/definitions.yaml#/SpecialServiceMetadata"
    },
    "ServiceTuple": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v22.5.0/openapi/definitions.yaml#/ServiceTuple"
    },
    "ServiceScope": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v22.5.0/openapi/definitions.yaml#/ServiceScope"
    },
    "ServiceCategory": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v22.5.0/openapi/definitions.yaml#/ServiceCategory"
    },
    "SpecialServiceCategory": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v22.5.0/openapi/definitions.yaml#/SpecialServiceCategory"
    },
    "StandardServiceCategory": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v22.5.0/openapi/definitions.yaml#/StandardServiceCategory"
    },
    "PaginatedServiceTupleCollection": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v22.5.0/openapi/definitions.yaml#/PaginatedServiceTupleCollection"
    },
    "Timestamp": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v22.5.0/openapi/definitions.yaml#/Timestamp"
    },
    "PaymentNoticeNumber": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v22.5.0/openapi/definitions.yaml#/PaymentNoticeNumber"
    },
    "PaymentAmount": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v22.5.0/openapi/definitions.yaml#/PaymentAmount"
    },
    "PaymentData": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v22.5.0/openapi/definitions.yaml#/PaymentData"
    },
    "TimeToLiveSeconds": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v22.5.0/openapi/definitions.yaml#/TimeToLiveSeconds"
    },
    "CreatedMessageWithContent": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v22.5.0/openapi/definitions.yaml#/CreatedMessageWithContent"
    },
    "CreatedMessageWithoutContent": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v22.5.0/openapi/definitions.yaml#/CreatedMessageWithoutContent"
    },
    "CreatedMessageWithoutContentCollection": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v22.5.0/openapi/definitions.yaml#/CreatedMessageWithoutContentCollection"
    },
    "PaginatedCreatedMessageWithoutContentCollection": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v22.5.0/openapi/definitions.yaml#/PaginatedCreatedMessageWithoutContentCollection"
    },
    "UserDataProcessingStatus": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v22.5.0/openapi/definitions.yaml#/UserDataProcessingStatus"
    },
    "UserDataProcessingChoice": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v22.5.0/openapi/definitions.yaml#/UserDataProcessingChoice"
    },
    "UserDataProcessingChoiceRequest": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v22.5.0/openapi/definitions.yaml#/UserDataProcessingChoiceRequest"
    },
    "UserDataProcessing": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v22.5.0/openapi/definitions.yaml#/UserDataProcessing"
    },
    "MessageResponseWithContent": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v22.5.0/openapi/definitions.yaml#/MessageResponseWithContent"
    },
    "ServicePreferencesSettings": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v22.5.0/openapi/definitions.yaml#/ServicePreferencesSettings"
    },
    "ServicesPreferencesMode": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v22.5.0/openapi/definitions.yaml#/ServicesPreferencesMode"
    },
    "ServicePreference": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v22.5.0/openapi/definitions.yaml#/ServicePreference"
    },
    "EnrichedMessage": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v22.5.0/openapi/definitions.yaml#/EnrichedMessage"
    },
    "PublicMessage": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v22.5.0/openapi/definitions.yaml#/PublicMessage"
    },
    "PublicMessagesCollection": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v22.5.0/openapi/definitions.yaml#/PublicMessagesCollection"
    },
    "PaginatedPublicMessagesCollection": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v22.5.0/openapi/definitions.yaml#/PaginatedPublicMessagesCollection"
    },
    "MessageCategory": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v22.5.0/openapi/definitions.yaml#/MessageCategory"
    },
    "MessageCategoryBase": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v22.5.0/openapi/definitions.yaml#/MessageCategoryBase"
    },
    "MessageCategoryPayment": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v22.5.0/openapi/definitions.yaml#/MessageCategoryPayment"
    },
    "LegalMessageWithContent": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v22.5.0/openapi/definitions.yaml#/LegalMessageWithContent"
    },
    "LegalMessage": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v22.5.0/openapi/definitions.yaml#/LegalMessage"
    },
    "LegalMessageEml": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v22.5.0/openapi/definitions.yaml#/LegalMessageEml"
    },
    "LegalMessageCertData": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v22.5.0/openapi/definitions.yaml#/LegalMessageCertData"
    },
    "CertData": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v22.5.0/openapi/definitions.yaml#/CertData"
    },
    "CertDataHeader": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v22.5.0/openapi/definitions.yaml#/CertDataHeader"
    },
    "Attachment": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v22.5.0/openapi/definitions.yaml#/Attachment"
    },
    "LegalData": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-functions-commons/v22.5.0/openapi/definitions.yaml#/LegalData"
    },
    "PaymentProblemJson": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-pagopa-proxy/v0.14.1/api_pagopa.yaml#/definitions/PaymentProblemJson"
    },
    "CodiceContestoPagamento": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-pagopa-proxy/v0.14.1/api_pagopa.yaml#/definitions/CodiceContestoPagamento"
    },
    "EnteBeneficiario": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-pagopa-proxy/v0.14.1/api_pagopa.yaml#/definitions/EnteBeneficiario"
    },
    "Iban": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-pagopa-proxy/v0.14.1/api_pagopa.yaml#/definitions/Iban"
    },
    "ImportoEuroCents": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-pagopa-proxy/v0.14.1/api_pagopa.yaml#/definitions/ImportoEuroCents"
    },
    "PaymentActivationsGetResponse": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-pagopa-proxy/v0.14.1/api_pagopa.yaml#/definitions/PaymentActivationsGetResponse"
    },
    "PaymentActivationsPostRequest": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-pagopa-proxy/v0.14.1/api_pagopa.yaml#/definitions/PaymentActivationsPostRequest"
    },
    "PaymentActivationsPostResponse": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-pagopa-proxy/v0.14.1/api_pagopa.yaml#/definitions/PaymentActivationsPostResponse"
    },
    "PaymentRequestsGetResponse": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-pagopa-proxy/v0.14.1/api_pagopa.yaml#/definitions/PaymentRequestsGetResponse"
    },
    "RptId": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-pagopa-proxy/v0.14.1/api_pagopa.yaml#/definitions/RptId"
    },
    "SpezzoneStrutturatoCausaleVersamento": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-pagopa-proxy/v0.14.1/api_pagopa.yaml#/definitions/SpezzoneStrutturatoCausaleVersamento"
    },
    "SpezzoniCausaleVersamento": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-pagopa-proxy/v0.14.1/api_pagopa.yaml#/definitions/SpezzoniCausaleVersamento"
    },
    "SpezzoniCausaleVersamentoItem": {
      "$ref": "https://raw.githubusercontent.com/pagopa/io-pagopa-proxy/v0.14.1/api_pagopa.yaml#/definitions/SpezzoniCausaleVersamentoItem"
    },
    "MessageContentWithAttachments": {
      "allOf": [
        {
          "type": "object",
          "properties": {
            "attachments": {
              "type": "array",
              "items": {
                "$ref": "#/definitions/MessageAttachment"
              }
            }
          }
        },
        {
          "$ref": "#/definitions/NewMessageContent"
        }
      ]
    },
    "MessageAttachment": {
      "type": "object",
      "title": "MessageAttachment",
      "description": "Describes a message's attachment",
      "properties": {
        "name": {
          "type": "string"
        },
        "content": {
          "type": "string"
        },
        "mime_type": {
          "type": "string"
        }
      },
      "required": [
        "name",
        "content",
        "mime_type"
      ]
    },
    "CreatedMessageWithContentAndAttachments": {
      "allOf": [
        {
          "type": "object",
          "properties": {
            "content": {
              "$ref": "#/definitions/MessageContentWithAttachments"
            }
          },
          "required": [
            "content"
          ]
        },
        {
          "$ref": "#/definitions/CreatedMessageWithoutContent"
        }
      ]
    },
    "Installation": {
      "type": "object",
      "title": "Installation",
      "description": "Describes an app installation.",
      "properties": {
        "platform": {
          "$ref": "#/definitions/Platform"
        },
        "pushChannel": {
          "$ref": "#/definitions/PushChannel"
        }
      },
      "required": [
        "platform",
        "pushChannel"
      ]
    },
    "InitializedProfile": {
      "type": "object",
      "title": "Initialized profile",
      "description": "Describes the user's profile after it has been stored in the Profile API.",
      "properties": {
        "accepted_tos_version": {
          "$ref": "#/definitions/AcceptedTosVersion"
        },
        "email": {
          "$ref": "#/definitions/EmailAddress"
        },
        "blocked_inbox_or_channels": {
          "$ref": "#/definitions/BlockedInboxOrChannels"
        },
        "preferred_languages": {
          "$ref": "#/definitions/PreferredLanguages"
        },
        "is_inbox_enabled": {
          "$ref": "#/definitions/IsInboxEnabled"
        },
        "is_email_validated": {
          "$ref": "#/definitions/IsEmailValidated"
        },
        "is_email_enabled": {
          "$ref": "#/definitions/IsEmailEnabled"
        },
        "is_webhook_enabled": {
          "$ref": "#/definitions/IsWebhookEnabled"
        },
        "family_name": {
          "type": "string"
        },
        "fiscal_code": {
          "$ref": "#/definitions/FiscalCode"
        },
        "has_profile": {
          "$ref": "#/definitions/HasProfile"
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
        },
        "service_preferences_settings": {
          "$ref": "#/definitions/ServicePreferencesSettings"
        },
        "version": {
          "$ref": "#/definitions/Version"
        }
      },
      "required": [
        "family_name",
        "fiscal_code",
        "has_profile",
        "is_inbox_enabled",
        "is_email_enabled",
        "is_webhook_enabled",
        "name",
        "service_preferences_settings",
        "version"
      ]
    },
    "UserMetadata": {
      "type": "object",
      "title": "User Metadata information",
      "properties": {
        "version": {
          "type": "number"
        },
        "metadata": {
          "type": "string"
        }
      },
      "required": [
        "version",
        "metadata"
      ]
    },
    "PublicSession": {
      "type": "object",
      "title": "User session data",
      "description": "Describe the current session of an authenticated user.",
      "properties": {
        "spidLevel": {
          "$ref": "#/definitions/SpidLevel"
        },
        "walletToken": {
          "type": "string"
        },
        "myPortalToken": {
          "type": "string"
        },
        "bpdToken": {
          "type": "string"
        },
        "zendeskToken": {
          "type": "string"
        }
      },
      "required": [
        "spidLevel",
        "walletToken",
        "myPortalToken",
        "bpdToken",
        "zendeskToken"
      ]
    },
    "SessionInfo": {
      "type": "object",
      "title": "Session info of a user",
      "description": "Decribe a session of an authenticated user.",
      "properties": {
        "createdAt": {
          "$ref": "#/definitions/Timestamp"
        },
        "sessionToken": {
          "type": "string"
        }
      },
      "required": [
        "createdAt",
        "sessionToken"
      ]
    },
    "SessionsList": {
      "description": "Contains all active sessions for an authenticated user.",
      "type": "object",
      "properties": {
        "sessions": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/SessionInfo"
          }
        }
      },
      "required": [
        "sessions"
      ]
    },
    "InstallationID": {
      "type": "string",
      "description": "The sixteen octets of an Installation ID are represented as 32 hexadecimal (base 16) digits, displayed in five groups\nseparated by hyphens, in the form 8-4-4-4-12 for a total of 36 characters (32 alphanumeric characters and four\nhyphens).\nSee https://en.wikipedia.org/wiki/Universally_unique_identifier",
      "minLength": 1
    },
    "HasProfile": {
      "type": "boolean",
      "default": false,
      "description": "True if the user has a remote profile."
    },
    "IsEmailSet": {
      "type": "boolean",
      "default": false,
      "description": "True if the user has presonalized the email."
    },
    "Version": {
      "type": "integer",
      "description": "The entity version."
    },
    "Platform": {
      "type": "string",
      "description": "The platform type where the installation happened.",
      "x-extensible-enum": [
        "apns",
        "gcm"
      ]
    },
    "PushChannel": {
      "type": "string",
      "description": "The Push Notification Service handle for this Installation.\nSee https://docs.microsoft.com/en-us/azure/notification-hubs/notification-hubs-push-notification-registration-management"
    },
    "SpidLevel": {
      "type": "string",
      "description": "A SPID level.",
      "x-extensible-enum": [
        "https://www.spid.gov.it/SpidL1",
        "https://www.spid.gov.it/SpidL2",
        "https://www.spid.gov.it/SpidL3"
      ]
    },
    "SuccessResponse": {
      "type": "object",
      "properties": {
        "message": {
          "type": "string"
        }
      }
    },
    "LimitedFederatedUser": {
      "title": "Federated user",
      "description": "User data needed by federated applications.",
      "type": "object",
      "properties": {
        "fiscal_code": {
          "$ref": "#/definitions/FiscalCode"
        }
      },
      "required": [
        "fiscal_code"
      ]
    },
    "FederatedUser": {
      "title": "Federated user",
      "description": "User data needed by federated applications.",
      "allOf": [
        {
          "type": "object",
          "properties": {
            "name": {
              "type": "string"
            },
            "family_name": {
              "type": "string"
            }
          },
          "required": [
            "name",
            "family_name"
          ]
        },
        {
          "$ref": "#/definitions/LimitedFederatedUser"
        }
      ]
    },
    "SupportToken": {
      "title": "Support token",
      "description": "A Support Token response",
      "type": "object",
      "properties": {
        "access_token": {
          "type": "string"
        },
        "expires_in": {
          "type": "number"
        }
      },
      "required": [
        "access_token",
        "expires_in"
      ]
    }
  },
  "responses": {},
  "parameters": {
    "EnrichResultData": {
      "name": "enrich_result_data",
      "type": "boolean",
      "in": "query",
      "required": false,
      "description": "Indicates whether result data should be enriched or not."
    },
    "PageSize": {
      "name": "page_size",
      "type": "integer",
      "in": "query",
      "minimum": 1,
      "maximum": 100,
      "required": false,
      "description": "How many items a page should include."
    },
    "MaximumId": {
      "name": "maximum_id",
      "type": "string",
      "in": "query",
      "required": false,
      "description": "The maximum id to get messages until to."
    },
    "MinimumId": {
      "name": "minimum_id",
      "type": "string",
      "in": "query",
      "required": false,
      "description": "The minimum id to get messages from."
    },
    "PaginationRequest": {
      "type": "string",
      "name": "cursor",
      "in": "query",
      "minimum": 1,
      "description": "An opaque identifier that points to the next item in the collection."
    },
    "UserDataProcessingChoiceParam": {
      "name": "choice",
      "in": "path",
      "type": "string",
      "enum": [
        "DOWNLOAD",
        "DELETE"
      ],
      "description": "A representation of a user data processing choice",
      "required": true,
      "x-example": "DOWNLOAD"
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
