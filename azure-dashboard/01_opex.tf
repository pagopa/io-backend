
locals {
  name                = "${var.prefix}-${var.env_short}-Opexd_test"
  dashboard_base_addr = "https://portal.azure.com/#@pagopait.onmicrosoft.com/dashboard/arm"
}

data "azurerm_resource_group" "this" {
  name     = "dashboards"
}

resource "azurerm_portal_dashboard" "this" {
  name                = local.name
  resource_group_name = data.azurerm_resource_group.this.name
  location            = data.azurerm_resource_group.this.location

  dashboard_properties = <<-PROPS
    {
  "lenses": {
    "0": {
      "order": 0,
      "parts": {
        "0": {
          "position": {
            "x": 0,
            "y": 0,
            "colSpan": 6,
            "rowSpan": 4
          },
          "metadata": {
            "inputs": [
              {
                "name": "resourceTypeMode",
                "isOptional": true
              },
              {
                "name": "ComponentId",
                "isOptional": true
              },
              {
                "name": "Scope",
                "value": {
                  "resourceIds": [
                    "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
                  ]
                },
                "isOptional": true
              },
              {
                "name": "PartId",
                "isOptional": true
              },
              {
                "name": "Version",
                "value": "2.0",
                "isOptional": true
              },
              {
                "name": "TimeRange",
                "value": "PT4H",
                "isOptional": true
              },
              {
                "name": "DashboardId",
                "isOptional": true
              },
              {
                "name": "DraftRequestParameters",
                "value": {
                  "scope": "hierarchy"
                },
                "isOptional": true
              },
              {
                "name": "Query",
                "value": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 0.99;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/services/[^/]+\"\n| summarize\n  Total=count(),\n  Success=count(httpStatus_d < 500) by bin(TimeGenerated, 5m)\n| extend availability=toreal(Success) / Total\n\n| project TimeGenerated, availability, watermark=threshold\n| render timechart with (xtitle = \"time\", ytitle= \"availability(%)\")\n\n",
                "isOptional": true
              },
              {
                "name": "ControlType",
                "value": "FrameControlChart",
                "isOptional": true
              },
              {
                "name": "SpecificChart",
                "value": "Line",
                "isOptional": true
              },
              {
                "name": "PartTitle",
                "value": "Availability (5m)",
                "isOptional": true
              },
              {
                "name": "PartSubTitle",
                "value": "/api/v1/services/{service_id}",
                "isOptional": true
              },
              {
                "name": "Dimensions",
                "value": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "availability",
                      "type": "real"
                    },
                    {
                      "name": "watermark",
                      "type": "real"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                },
                "isOptional": true
              },
              {
                "name": "LegendOptions",
                "value": {
                  "isEnabled": true,
                  "position": "Bottom"
                },
                "isOptional": true
              },
              {
                "name": "IsQueryContainTimeRange",
                "value": false,
                "isOptional": true
              }
            ],
            "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart",
            "settings": {
              "content": {
                "Query": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 0.99;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/services/[^/]+\"\n| summarize\n  Total=count(),\n  Success=count(httpStatus_d < 500) by bin(TimeGenerated, 5m)\n| extend availability=toreal(Success) / Total\n\n| project TimeGenerated, availability, watermark=threshold\n| render timechart with (xtitle = \"time\", ytitle= \"availability(%)\")\n\n",
                "PartTitle": "Availability (5m)"
              }
            }
          }
        },
        "1": {
          "position": {
            "x": 6,
            "y": 0,
            "colSpan": 6,
            "rowSpan": 4
          },
          "metadata": {
            "inputs": [
              {
                "name": "resourceTypeMode",
                "isOptional": true
              },
              {
                "name": "ComponentId",
                "isOptional": true
              },
              {
                "name": "Scope",
                "value": {
                  "resourceIds": [
                    "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
                  ]
                },
                "isOptional": true
              },
              {
                "name": "PartId",
                "isOptional": true
              },
              {
                "name": "Version",
                "value": "2.0",
                "isOptional": true
              },
              {
                "name": "TimeRange",
                "value": "PT4H",
                "isOptional": true
              },
              {
                "name": "DashboardId",
                "isOptional": true
              },
              {
                "name": "DraftRequestParameters",
                "value": {
                  "scope": "hierarchy"
                },
                "isOptional": true
              },
              {
                "name": "Query",
                "value": "\nlet api_url = \"/api/v1/services/[^/]+\";\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex api_url\n| extend HTTPStatus = case(\n  httpStatus_d between (100 .. 199), \"1XX\",\n  httpStatus_d between (200 .. 299), \"2XX\",\n  httpStatus_d between (300 .. 399), \"3XX\",\n  httpStatus_d between (400 .. 499), \"4XX\",\n  \"5XX\")\n| summarize count() by HTTPStatus, bin(TimeGenerated, 5m)\n| render areachart with (xtitle = \"time\", ytitle= \"count\")\n",
                "isOptional": true
              },
              {
                "name": "ControlType",
                "value": "FrameControlChart",
                "isOptional": true
              },
              {
                "name": "SpecificChart",
                "value": "Pie",
                "isOptional": true
              },
              {
                "name": "PartTitle",
                "value": "Response Codes (5m)",
                "isOptional": true
              },
              {
                "name": "PartSubTitle",
                "value": "/api/v1/services/{service_id}",
                "isOptional": true
              },
              {
                "name": "Dimensions",
                "value": {
                  "xAxis": {
                    "name": "httpStatus_d",
                    "type": "string"
                  },
                  "yAxis": [
                    {
                      "name": "count_",
                      "type": "long"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                },
                "isOptional": true
              },
              {
                "name": "LegendOptions",
                "value": {
                  "isEnabled": true,
                  "position": "Bottom"
                },
                "isOptional": true
              },
              {
                "name": "IsQueryContainTimeRange",
                "value": false,
                "isOptional": true
              }
            ],
            "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart",
            "settings": {
              "content": {
                "Query": "\nlet api_url = \"/api/v1/services/[^/]+\";\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex api_url\n| extend HTTPStatus = case(\n  httpStatus_d between (100 .. 199), \"1XX\",\n  httpStatus_d between (200 .. 299), \"2XX\",\n  httpStatus_d between (300 .. 399), \"3XX\",\n  httpStatus_d between (400 .. 499), \"4XX\",\n  \"5XX\")\n| summarize count() by HTTPStatus, bin(TimeGenerated, 5m)\n| render areachart with (xtitle = \"time\", ytitle= \"count\")\n",
                "SpecificChart": "StackedArea",
                "PartTitle": "Response Codes (5m)",
                "Dimensions": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "count_",
                      "type": "long"
                    }
                  ],
                  "splitBy": [
                    {
                      "name": "HTTPStatus",
                      "type": "string"
                    }
                  ],
                  "aggregation": "Sum"
                }
              }
            }
          }
        },
        "2": {
          "position": {
            "x": 12,
            "y": 0,
            "colSpan": 6,
            "rowSpan": 4
          },
          "metadata": {
            "inputs": [
              {
                "name": "resourceTypeMode",
                "isOptional": true
              },
              {
                "name": "ComponentId",
                "isOptional": true
              },
              {
                "name": "Scope",
                "value": {
                  "resourceIds": [
                    "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
                  ]
                },
                "isOptional": true
              },
              {
                "name": "PartId",
                "isOptional": true
              },
              {
                "name": "Version",
                "value": "2.0",
                "isOptional": true
              },
              {
                "name": "TimeRange",
                "value": "PT4H",
                "isOptional": true
              },
              {
                "name": "DashboardId",
                "isOptional": true
              },
              {
                "name": "DraftRequestParameters",
                "value": {
                  "scope": "hierarchy"
                },
                "isOptional": true
              },
              {
                "name": "Query",
                "value": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 1;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/services/[^/]+\"\n| summarize\n    watermark=threshold,\n    percentiles(timeTaken_d, 95) by bin(TimeGenerated, 5m)\n\n| render timechart with (xtitle = \"time\", ytitle= \"response time(s)\")\n\n",
                "isOptional": true
              },
              {
                "name": "ControlType",
                "value": "FrameControlChart",
                "isOptional": true
              },
              {
                "name": "SpecificChart",
                "value": "StackedColumn",
                "isOptional": true
              },
              {
                "name": "PartTitle",
                "value": "Percentile Response Time (5m)",
                "isOptional": true
              },
              {
                "name": "PartSubTitle",
                "value": "/api/v1/services/{service_id}",
                "isOptional": true
              },
              {
                "name": "Dimensions",
                "value": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "percentile_timeTaken_d_95",
                      "type": "real"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                },
                "isOptional": true
              },
              {
                "name": "LegendOptions",
                "value": {
                  "isEnabled": true,
                  "position": "Bottom"
                },
                "isOptional": true
              },
              {
                "name": "IsQueryContainTimeRange",
                "value": false,
                "isOptional": true
              }
            ],
            "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart",
            "settings": {
              "content": {
                "Query": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 1;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/services/[^/]+\"\n| summarize\n    watermark=threshold,\n    percentiles(timeTaken_d, 95) by bin(TimeGenerated, 5m)\n\n| render timechart with (xtitle = \"time\", ytitle= \"response time(s)\")\n\n",
                "SpecificChart": "Line",
                "PartTitle": "Percentile Response Time (5m)",
                "Dimensions": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "watermark",
                      "type": "long"
                    },
                    {
                      "name": "percentile_timeTaken_d_95",
                      "type": "real"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                }
              }
            }
          }
        },
        "3": {
          "position": {
            "x": 0,
            "y": 4,
            "colSpan": 6,
            "rowSpan": 4
          },
          "metadata": {
            "inputs": [
              {
                "name": "resourceTypeMode",
                "isOptional": true
              },
              {
                "name": "ComponentId",
                "isOptional": true
              },
              {
                "name": "Scope",
                "value": {
                  "resourceIds": [
                    "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
                  ]
                },
                "isOptional": true
              },
              {
                "name": "PartId",
                "isOptional": true
              },
              {
                "name": "Version",
                "value": "2.0",
                "isOptional": true
              },
              {
                "name": "TimeRange",
                "value": "PT4H",
                "isOptional": true
              },
              {
                "name": "DashboardId",
                "isOptional": true
              },
              {
                "name": "DraftRequestParameters",
                "value": {
                  "scope": "hierarchy"
                },
                "isOptional": true
              },
              {
                "name": "Query",
                "value": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 0.99;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/services/[^/]+/preferences\"\n| summarize\n  Total=count(),\n  Success=count(httpStatus_d < 500) by bin(TimeGenerated, 5m)\n| extend availability=toreal(Success) / Total\n\n| project TimeGenerated, availability, watermark=threshold\n| render timechart with (xtitle = \"time\", ytitle= \"availability(%)\")\n\n",
                "isOptional": true
              },
              {
                "name": "ControlType",
                "value": "FrameControlChart",
                "isOptional": true
              },
              {
                "name": "SpecificChart",
                "value": "Line",
                "isOptional": true
              },
              {
                "name": "PartTitle",
                "value": "Availability (5m)",
                "isOptional": true
              },
              {
                "name": "PartSubTitle",
                "value": "/api/v1/services/{service_id}/preferences",
                "isOptional": true
              },
              {
                "name": "Dimensions",
                "value": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "availability",
                      "type": "real"
                    },
                    {
                      "name": "watermark",
                      "type": "real"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                },
                "isOptional": true
              },
              {
                "name": "LegendOptions",
                "value": {
                  "isEnabled": true,
                  "position": "Bottom"
                },
                "isOptional": true
              },
              {
                "name": "IsQueryContainTimeRange",
                "value": false,
                "isOptional": true
              }
            ],
            "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart",
            "settings": {
              "content": {
                "Query": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 0.99;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/services/[^/]+/preferences\"\n| summarize\n  Total=count(),\n  Success=count(httpStatus_d < 500) by bin(TimeGenerated, 5m)\n| extend availability=toreal(Success) / Total\n\n| project TimeGenerated, availability, watermark=threshold\n| render timechart with (xtitle = \"time\", ytitle= \"availability(%)\")\n\n",
                "PartTitle": "Availability (5m)"
              }
            }
          }
        },
        "4": {
          "position": {
            "x": 6,
            "y": 4,
            "colSpan": 6,
            "rowSpan": 4
          },
          "metadata": {
            "inputs": [
              {
                "name": "resourceTypeMode",
                "isOptional": true
              },
              {
                "name": "ComponentId",
                "isOptional": true
              },
              {
                "name": "Scope",
                "value": {
                  "resourceIds": [
                    "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
                  ]
                },
                "isOptional": true
              },
              {
                "name": "PartId",
                "isOptional": true
              },
              {
                "name": "Version",
                "value": "2.0",
                "isOptional": true
              },
              {
                "name": "TimeRange",
                "value": "PT4H",
                "isOptional": true
              },
              {
                "name": "DashboardId",
                "isOptional": true
              },
              {
                "name": "DraftRequestParameters",
                "value": {
                  "scope": "hierarchy"
                },
                "isOptional": true
              },
              {
                "name": "Query",
                "value": "\nlet api_url = \"/api/v1/services/[^/]+/preferences\";\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex api_url\n| extend HTTPStatus = case(\n  httpStatus_d between (100 .. 199), \"1XX\",\n  httpStatus_d between (200 .. 299), \"2XX\",\n  httpStatus_d between (300 .. 399), \"3XX\",\n  httpStatus_d between (400 .. 499), \"4XX\",\n  \"5XX\")\n| summarize count() by HTTPStatus, bin(TimeGenerated, 5m)\n| render areachart with (xtitle = \"time\", ytitle= \"count\")\n",
                "isOptional": true
              },
              {
                "name": "ControlType",
                "value": "FrameControlChart",
                "isOptional": true
              },
              {
                "name": "SpecificChart",
                "value": "Pie",
                "isOptional": true
              },
              {
                "name": "PartTitle",
                "value": "Response Codes (5m)",
                "isOptional": true
              },
              {
                "name": "PartSubTitle",
                "value": "/api/v1/services/{service_id}/preferences",
                "isOptional": true
              },
              {
                "name": "Dimensions",
                "value": {
                  "xAxis": {
                    "name": "httpStatus_d",
                    "type": "string"
                  },
                  "yAxis": [
                    {
                      "name": "count_",
                      "type": "long"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                },
                "isOptional": true
              },
              {
                "name": "LegendOptions",
                "value": {
                  "isEnabled": true,
                  "position": "Bottom"
                },
                "isOptional": true
              },
              {
                "name": "IsQueryContainTimeRange",
                "value": false,
                "isOptional": true
              }
            ],
            "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart",
            "settings": {
              "content": {
                "Query": "\nlet api_url = \"/api/v1/services/[^/]+/preferences\";\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex api_url\n| extend HTTPStatus = case(\n  httpStatus_d between (100 .. 199), \"1XX\",\n  httpStatus_d between (200 .. 299), \"2XX\",\n  httpStatus_d between (300 .. 399), \"3XX\",\n  httpStatus_d between (400 .. 499), \"4XX\",\n  \"5XX\")\n| summarize count() by HTTPStatus, bin(TimeGenerated, 5m)\n| render areachart with (xtitle = \"time\", ytitle= \"count\")\n",
                "SpecificChart": "StackedArea",
                "PartTitle": "Response Codes (5m)",
                "Dimensions": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "count_",
                      "type": "long"
                    }
                  ],
                  "splitBy": [
                    {
                      "name": "HTTPStatus",
                      "type": "string"
                    }
                  ],
                  "aggregation": "Sum"
                }
              }
            }
          }
        },
        "5": {
          "position": {
            "x": 12,
            "y": 4,
            "colSpan": 6,
            "rowSpan": 4
          },
          "metadata": {
            "inputs": [
              {
                "name": "resourceTypeMode",
                "isOptional": true
              },
              {
                "name": "ComponentId",
                "isOptional": true
              },
              {
                "name": "Scope",
                "value": {
                  "resourceIds": [
                    "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
                  ]
                },
                "isOptional": true
              },
              {
                "name": "PartId",
                "isOptional": true
              },
              {
                "name": "Version",
                "value": "2.0",
                "isOptional": true
              },
              {
                "name": "TimeRange",
                "value": "PT4H",
                "isOptional": true
              },
              {
                "name": "DashboardId",
                "isOptional": true
              },
              {
                "name": "DraftRequestParameters",
                "value": {
                  "scope": "hierarchy"
                },
                "isOptional": true
              },
              {
                "name": "Query",
                "value": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 1;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/services/[^/]+/preferences\"\n| summarize\n    watermark=threshold,\n    percentiles(timeTaken_d, 95) by bin(TimeGenerated, 5m)\n\n| render timechart with (xtitle = \"time\", ytitle= \"response time(s)\")\n\n",
                "isOptional": true
              },
              {
                "name": "ControlType",
                "value": "FrameControlChart",
                "isOptional": true
              },
              {
                "name": "SpecificChart",
                "value": "StackedColumn",
                "isOptional": true
              },
              {
                "name": "PartTitle",
                "value": "Percentile Response Time (5m)",
                "isOptional": true
              },
              {
                "name": "PartSubTitle",
                "value": "/api/v1/services/{service_id}/preferences",
                "isOptional": true
              },
              {
                "name": "Dimensions",
                "value": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "percentile_timeTaken_d_95",
                      "type": "real"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                },
                "isOptional": true
              },
              {
                "name": "LegendOptions",
                "value": {
                  "isEnabled": true,
                  "position": "Bottom"
                },
                "isOptional": true
              },
              {
                "name": "IsQueryContainTimeRange",
                "value": false,
                "isOptional": true
              }
            ],
            "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart",
            "settings": {
              "content": {
                "Query": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 1;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/services/[^/]+/preferences\"\n| summarize\n    watermark=threshold,\n    percentiles(timeTaken_d, 95) by bin(TimeGenerated, 5m)\n\n| render timechart with (xtitle = \"time\", ytitle= \"response time(s)\")\n\n",
                "SpecificChart": "Line",
                "PartTitle": "Percentile Response Time (5m)",
                "Dimensions": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "watermark",
                      "type": "long"
                    },
                    {
                      "name": "percentile_timeTaken_d_95",
                      "type": "real"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                }
              }
            }
          }
        },
        "6": {
          "position": {
            "x": 0,
            "y": 8,
            "colSpan": 6,
            "rowSpan": 4
          },
          "metadata": {
            "inputs": [
              {
                "name": "resourceTypeMode",
                "isOptional": true
              },
              {
                "name": "ComponentId",
                "isOptional": true
              },
              {
                "name": "Scope",
                "value": {
                  "resourceIds": [
                    "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
                  ]
                },
                "isOptional": true
              },
              {
                "name": "PartId",
                "isOptional": true
              },
              {
                "name": "Version",
                "value": "2.0",
                "isOptional": true
              },
              {
                "name": "TimeRange",
                "value": "PT4H",
                "isOptional": true
              },
              {
                "name": "DashboardId",
                "isOptional": true
              },
              {
                "name": "DraftRequestParameters",
                "value": {
                  "scope": "hierarchy"
                },
                "isOptional": true
              },
              {
                "name": "Query",
                "value": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 0.99;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/services\"\n| summarize\n  Total=count(),\n  Success=count(httpStatus_d < 500) by bin(TimeGenerated, 5m)\n| extend availability=toreal(Success) / Total\n\n| project TimeGenerated, availability, watermark=threshold\n| render timechart with (xtitle = \"time\", ytitle= \"availability(%)\")\n\n",
                "isOptional": true
              },
              {
                "name": "ControlType",
                "value": "FrameControlChart",
                "isOptional": true
              },
              {
                "name": "SpecificChart",
                "value": "Line",
                "isOptional": true
              },
              {
                "name": "PartTitle",
                "value": "Availability (5m)",
                "isOptional": true
              },
              {
                "name": "PartSubTitle",
                "value": "/api/v1/services",
                "isOptional": true
              },
              {
                "name": "Dimensions",
                "value": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "availability",
                      "type": "real"
                    },
                    {
                      "name": "watermark",
                      "type": "real"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                },
                "isOptional": true
              },
              {
                "name": "LegendOptions",
                "value": {
                  "isEnabled": true,
                  "position": "Bottom"
                },
                "isOptional": true
              },
              {
                "name": "IsQueryContainTimeRange",
                "value": false,
                "isOptional": true
              }
            ],
            "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart",
            "settings": {
              "content": {
                "Query": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 0.99;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/services\"\n| summarize\n  Total=count(),\n  Success=count(httpStatus_d < 500) by bin(TimeGenerated, 5m)\n| extend availability=toreal(Success) / Total\n\n| project TimeGenerated, availability, watermark=threshold\n| render timechart with (xtitle = \"time\", ytitle= \"availability(%)\")\n\n",
                "PartTitle": "Availability (5m)"
              }
            }
          }
        },
        "7": {
          "position": {
            "x": 6,
            "y": 8,
            "colSpan": 6,
            "rowSpan": 4
          },
          "metadata": {
            "inputs": [
              {
                "name": "resourceTypeMode",
                "isOptional": true
              },
              {
                "name": "ComponentId",
                "isOptional": true
              },
              {
                "name": "Scope",
                "value": {
                  "resourceIds": [
                    "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
                  ]
                },
                "isOptional": true
              },
              {
                "name": "PartId",
                "isOptional": true
              },
              {
                "name": "Version",
                "value": "2.0",
                "isOptional": true
              },
              {
                "name": "TimeRange",
                "value": "PT4H",
                "isOptional": true
              },
              {
                "name": "DashboardId",
                "isOptional": true
              },
              {
                "name": "DraftRequestParameters",
                "value": {
                  "scope": "hierarchy"
                },
                "isOptional": true
              },
              {
                "name": "Query",
                "value": "\nlet api_url = \"/api/v1/services\";\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex api_url\n| extend HTTPStatus = case(\n  httpStatus_d between (100 .. 199), \"1XX\",\n  httpStatus_d between (200 .. 299), \"2XX\",\n  httpStatus_d between (300 .. 399), \"3XX\",\n  httpStatus_d between (400 .. 499), \"4XX\",\n  \"5XX\")\n| summarize count() by HTTPStatus, bin(TimeGenerated, 5m)\n| render areachart with (xtitle = \"time\", ytitle= \"count\")\n",
                "isOptional": true
              },
              {
                "name": "ControlType",
                "value": "FrameControlChart",
                "isOptional": true
              },
              {
                "name": "SpecificChart",
                "value": "Pie",
                "isOptional": true
              },
              {
                "name": "PartTitle",
                "value": "Response Codes (5m)",
                "isOptional": true
              },
              {
                "name": "PartSubTitle",
                "value": "/api/v1/services",
                "isOptional": true
              },
              {
                "name": "Dimensions",
                "value": {
                  "xAxis": {
                    "name": "httpStatus_d",
                    "type": "string"
                  },
                  "yAxis": [
                    {
                      "name": "count_",
                      "type": "long"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                },
                "isOptional": true
              },
              {
                "name": "LegendOptions",
                "value": {
                  "isEnabled": true,
                  "position": "Bottom"
                },
                "isOptional": true
              },
              {
                "name": "IsQueryContainTimeRange",
                "value": false,
                "isOptional": true
              }
            ],
            "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart",
            "settings": {
              "content": {
                "Query": "\nlet api_url = \"/api/v1/services\";\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex api_url\n| extend HTTPStatus = case(\n  httpStatus_d between (100 .. 199), \"1XX\",\n  httpStatus_d between (200 .. 299), \"2XX\",\n  httpStatus_d between (300 .. 399), \"3XX\",\n  httpStatus_d between (400 .. 499), \"4XX\",\n  \"5XX\")\n| summarize count() by HTTPStatus, bin(TimeGenerated, 5m)\n| render areachart with (xtitle = \"time\", ytitle= \"count\")\n",
                "SpecificChart": "StackedArea",
                "PartTitle": "Response Codes (5m)",
                "Dimensions": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "count_",
                      "type": "long"
                    }
                  ],
                  "splitBy": [
                    {
                      "name": "HTTPStatus",
                      "type": "string"
                    }
                  ],
                  "aggregation": "Sum"
                }
              }
            }
          }
        },
        "8": {
          "position": {
            "x": 12,
            "y": 8,
            "colSpan": 6,
            "rowSpan": 4
          },
          "metadata": {
            "inputs": [
              {
                "name": "resourceTypeMode",
                "isOptional": true
              },
              {
                "name": "ComponentId",
                "isOptional": true
              },
              {
                "name": "Scope",
                "value": {
                  "resourceIds": [
                    "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
                  ]
                },
                "isOptional": true
              },
              {
                "name": "PartId",
                "isOptional": true
              },
              {
                "name": "Version",
                "value": "2.0",
                "isOptional": true
              },
              {
                "name": "TimeRange",
                "value": "PT4H",
                "isOptional": true
              },
              {
                "name": "DashboardId",
                "isOptional": true
              },
              {
                "name": "DraftRequestParameters",
                "value": {
                  "scope": "hierarchy"
                },
                "isOptional": true
              },
              {
                "name": "Query",
                "value": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 1;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/services\"\n| summarize\n    watermark=threshold,\n    percentiles(timeTaken_d, 95) by bin(TimeGenerated, 5m)\n\n| render timechart with (xtitle = \"time\", ytitle= \"response time(s)\")\n\n",
                "isOptional": true
              },
              {
                "name": "ControlType",
                "value": "FrameControlChart",
                "isOptional": true
              },
              {
                "name": "SpecificChart",
                "value": "StackedColumn",
                "isOptional": true
              },
              {
                "name": "PartTitle",
                "value": "Percentile Response Time (5m)",
                "isOptional": true
              },
              {
                "name": "PartSubTitle",
                "value": "/api/v1/services",
                "isOptional": true
              },
              {
                "name": "Dimensions",
                "value": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "percentile_timeTaken_d_95",
                      "type": "real"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                },
                "isOptional": true
              },
              {
                "name": "LegendOptions",
                "value": {
                  "isEnabled": true,
                  "position": "Bottom"
                },
                "isOptional": true
              },
              {
                "name": "IsQueryContainTimeRange",
                "value": false,
                "isOptional": true
              }
            ],
            "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart",
            "settings": {
              "content": {
                "Query": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 1;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/services\"\n| summarize\n    watermark=threshold,\n    percentiles(timeTaken_d, 95) by bin(TimeGenerated, 5m)\n\n| render timechart with (xtitle = \"time\", ytitle= \"response time(s)\")\n\n",
                "SpecificChart": "Line",
                "PartTitle": "Percentile Response Time (5m)",
                "Dimensions": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "watermark",
                      "type": "long"
                    },
                    {
                      "name": "percentile_timeTaken_d_95",
                      "type": "real"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                }
              }
            }
          }
        },
        "9": {
          "position": {
            "x": 0,
            "y": 12,
            "colSpan": 6,
            "rowSpan": 4
          },
          "metadata": {
            "inputs": [
              {
                "name": "resourceTypeMode",
                "isOptional": true
              },
              {
                "name": "ComponentId",
                "isOptional": true
              },
              {
                "name": "Scope",
                "value": {
                  "resourceIds": [
                    "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
                  ]
                },
                "isOptional": true
              },
              {
                "name": "PartId",
                "isOptional": true
              },
              {
                "name": "Version",
                "value": "2.0",
                "isOptional": true
              },
              {
                "name": "TimeRange",
                "value": "PT4H",
                "isOptional": true
              },
              {
                "name": "DashboardId",
                "isOptional": true
              },
              {
                "name": "DraftRequestParameters",
                "value": {
                  "scope": "hierarchy"
                },
                "isOptional": true
              },
              {
                "name": "Query",
                "value": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 0.99;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/messages\"\n| summarize\n  Total=count(),\n  Success=count(httpStatus_d < 500) by bin(TimeGenerated, 5m)\n| extend availability=toreal(Success) / Total\n\n| project TimeGenerated, availability, watermark=threshold\n| render timechart with (xtitle = \"time\", ytitle= \"availability(%)\")\n\n",
                "isOptional": true
              },
              {
                "name": "ControlType",
                "value": "FrameControlChart",
                "isOptional": true
              },
              {
                "name": "SpecificChart",
                "value": "Line",
                "isOptional": true
              },
              {
                "name": "PartTitle",
                "value": "Availability (5m)",
                "isOptional": true
              },
              {
                "name": "PartSubTitle",
                "value": "/api/v1/messages",
                "isOptional": true
              },
              {
                "name": "Dimensions",
                "value": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "availability",
                      "type": "real"
                    },
                    {
                      "name": "watermark",
                      "type": "real"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                },
                "isOptional": true
              },
              {
                "name": "LegendOptions",
                "value": {
                  "isEnabled": true,
                  "position": "Bottom"
                },
                "isOptional": true
              },
              {
                "name": "IsQueryContainTimeRange",
                "value": false,
                "isOptional": true
              }
            ],
            "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart",
            "settings": {
              "content": {
                "Query": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 0.99;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/messages\"\n| summarize\n  Total=count(),\n  Success=count(httpStatus_d < 500) by bin(TimeGenerated, 5m)\n| extend availability=toreal(Success) / Total\n\n| project TimeGenerated, availability, watermark=threshold\n| render timechart with (xtitle = \"time\", ytitle= \"availability(%)\")\n\n",
                "PartTitle": "Availability (5m)"
              }
            }
          }
        },
        "10": {
          "position": {
            "x": 6,
            "y": 12,
            "colSpan": 6,
            "rowSpan": 4
          },
          "metadata": {
            "inputs": [
              {
                "name": "resourceTypeMode",
                "isOptional": true
              },
              {
                "name": "ComponentId",
                "isOptional": true
              },
              {
                "name": "Scope",
                "value": {
                  "resourceIds": [
                    "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
                  ]
                },
                "isOptional": true
              },
              {
                "name": "PartId",
                "isOptional": true
              },
              {
                "name": "Version",
                "value": "2.0",
                "isOptional": true
              },
              {
                "name": "TimeRange",
                "value": "PT4H",
                "isOptional": true
              },
              {
                "name": "DashboardId",
                "isOptional": true
              },
              {
                "name": "DraftRequestParameters",
                "value": {
                  "scope": "hierarchy"
                },
                "isOptional": true
              },
              {
                "name": "Query",
                "value": "\nlet api_url = \"/api/v1/messages\";\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex api_url\n| extend HTTPStatus = case(\n  httpStatus_d between (100 .. 199), \"1XX\",\n  httpStatus_d between (200 .. 299), \"2XX\",\n  httpStatus_d between (300 .. 399), \"3XX\",\n  httpStatus_d between (400 .. 499), \"4XX\",\n  \"5XX\")\n| summarize count() by HTTPStatus, bin(TimeGenerated, 5m)\n| render areachart with (xtitle = \"time\", ytitle= \"count\")\n",
                "isOptional": true
              },
              {
                "name": "ControlType",
                "value": "FrameControlChart",
                "isOptional": true
              },
              {
                "name": "SpecificChart",
                "value": "Pie",
                "isOptional": true
              },
              {
                "name": "PartTitle",
                "value": "Response Codes (5m)",
                "isOptional": true
              },
              {
                "name": "PartSubTitle",
                "value": "/api/v1/messages",
                "isOptional": true
              },
              {
                "name": "Dimensions",
                "value": {
                  "xAxis": {
                    "name": "httpStatus_d",
                    "type": "string"
                  },
                  "yAxis": [
                    {
                      "name": "count_",
                      "type": "long"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                },
                "isOptional": true
              },
              {
                "name": "LegendOptions",
                "value": {
                  "isEnabled": true,
                  "position": "Bottom"
                },
                "isOptional": true
              },
              {
                "name": "IsQueryContainTimeRange",
                "value": false,
                "isOptional": true
              }
            ],
            "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart",
            "settings": {
              "content": {
                "Query": "\nlet api_url = \"/api/v1/messages\";\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex api_url\n| extend HTTPStatus = case(\n  httpStatus_d between (100 .. 199), \"1XX\",\n  httpStatus_d between (200 .. 299), \"2XX\",\n  httpStatus_d between (300 .. 399), \"3XX\",\n  httpStatus_d between (400 .. 499), \"4XX\",\n  \"5XX\")\n| summarize count() by HTTPStatus, bin(TimeGenerated, 5m)\n| render areachart with (xtitle = \"time\", ytitle= \"count\")\n",
                "SpecificChart": "StackedArea",
                "PartTitle": "Response Codes (5m)",
                "Dimensions": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "count_",
                      "type": "long"
                    }
                  ],
                  "splitBy": [
                    {
                      "name": "HTTPStatus",
                      "type": "string"
                    }
                  ],
                  "aggregation": "Sum"
                }
              }
            }
          }
        },
        "11": {
          "position": {
            "x": 12,
            "y": 12,
            "colSpan": 6,
            "rowSpan": 4
          },
          "metadata": {
            "inputs": [
              {
                "name": "resourceTypeMode",
                "isOptional": true
              },
              {
                "name": "ComponentId",
                "isOptional": true
              },
              {
                "name": "Scope",
                "value": {
                  "resourceIds": [
                    "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
                  ]
                },
                "isOptional": true
              },
              {
                "name": "PartId",
                "isOptional": true
              },
              {
                "name": "Version",
                "value": "2.0",
                "isOptional": true
              },
              {
                "name": "TimeRange",
                "value": "PT4H",
                "isOptional": true
              },
              {
                "name": "DashboardId",
                "isOptional": true
              },
              {
                "name": "DraftRequestParameters",
                "value": {
                  "scope": "hierarchy"
                },
                "isOptional": true
              },
              {
                "name": "Query",
                "value": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 1;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/messages\"\n| summarize\n    watermark=threshold,\n    percentiles(timeTaken_d, 95) by bin(TimeGenerated, 5m)\n\n| render timechart with (xtitle = \"time\", ytitle= \"response time(s)\")\n\n",
                "isOptional": true
              },
              {
                "name": "ControlType",
                "value": "FrameControlChart",
                "isOptional": true
              },
              {
                "name": "SpecificChart",
                "value": "StackedColumn",
                "isOptional": true
              },
              {
                "name": "PartTitle",
                "value": "Percentile Response Time (5m)",
                "isOptional": true
              },
              {
                "name": "PartSubTitle",
                "value": "/api/v1/messages",
                "isOptional": true
              },
              {
                "name": "Dimensions",
                "value": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "percentile_timeTaken_d_95",
                      "type": "real"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                },
                "isOptional": true
              },
              {
                "name": "LegendOptions",
                "value": {
                  "isEnabled": true,
                  "position": "Bottom"
                },
                "isOptional": true
              },
              {
                "name": "IsQueryContainTimeRange",
                "value": false,
                "isOptional": true
              }
            ],
            "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart",
            "settings": {
              "content": {
                "Query": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 1;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/messages\"\n| summarize\n    watermark=threshold,\n    percentiles(timeTaken_d, 95) by bin(TimeGenerated, 5m)\n\n| render timechart with (xtitle = \"time\", ytitle= \"response time(s)\")\n\n",
                "SpecificChart": "Line",
                "PartTitle": "Percentile Response Time (5m)",
                "Dimensions": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "watermark",
                      "type": "long"
                    },
                    {
                      "name": "percentile_timeTaken_d_95",
                      "type": "real"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                }
              }
            }
          }
        },
        "12": {
          "position": {
            "x": 0,
            "y": 16,
            "colSpan": 6,
            "rowSpan": 4
          },
          "metadata": {
            "inputs": [
              {
                "name": "resourceTypeMode",
                "isOptional": true
              },
              {
                "name": "ComponentId",
                "isOptional": true
              },
              {
                "name": "Scope",
                "value": {
                  "resourceIds": [
                    "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
                  ]
                },
                "isOptional": true
              },
              {
                "name": "PartId",
                "isOptional": true
              },
              {
                "name": "Version",
                "value": "2.0",
                "isOptional": true
              },
              {
                "name": "TimeRange",
                "value": "PT4H",
                "isOptional": true
              },
              {
                "name": "DashboardId",
                "isOptional": true
              },
              {
                "name": "DraftRequestParameters",
                "value": {
                  "scope": "hierarchy"
                },
                "isOptional": true
              },
              {
                "name": "Query",
                "value": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 0.99;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/messages/[^/]+\"\n| summarize\n  Total=count(),\n  Success=count(httpStatus_d < 500) by bin(TimeGenerated, 5m)\n| extend availability=toreal(Success) / Total\n\n| project TimeGenerated, availability, watermark=threshold\n| render timechart with (xtitle = \"time\", ytitle= \"availability(%)\")\n\n",
                "isOptional": true
              },
              {
                "name": "ControlType",
                "value": "FrameControlChart",
                "isOptional": true
              },
              {
                "name": "SpecificChart",
                "value": "Line",
                "isOptional": true
              },
              {
                "name": "PartTitle",
                "value": "Availability (5m)",
                "isOptional": true
              },
              {
                "name": "PartSubTitle",
                "value": "/api/v1/messages/{id}",
                "isOptional": true
              },
              {
                "name": "Dimensions",
                "value": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "availability",
                      "type": "real"
                    },
                    {
                      "name": "watermark",
                      "type": "real"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                },
                "isOptional": true
              },
              {
                "name": "LegendOptions",
                "value": {
                  "isEnabled": true,
                  "position": "Bottom"
                },
                "isOptional": true
              },
              {
                "name": "IsQueryContainTimeRange",
                "value": false,
                "isOptional": true
              }
            ],
            "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart",
            "settings": {
              "content": {
                "Query": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 0.99;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/messages/[^/]+\"\n| summarize\n  Total=count(),\n  Success=count(httpStatus_d < 500) by bin(TimeGenerated, 5m)\n| extend availability=toreal(Success) / Total\n\n| project TimeGenerated, availability, watermark=threshold\n| render timechart with (xtitle = \"time\", ytitle= \"availability(%)\")\n\n",
                "PartTitle": "Availability (5m)"
              }
            }
          }
        },
        "13": {
          "position": {
            "x": 6,
            "y": 16,
            "colSpan": 6,
            "rowSpan": 4
          },
          "metadata": {
            "inputs": [
              {
                "name": "resourceTypeMode",
                "isOptional": true
              },
              {
                "name": "ComponentId",
                "isOptional": true
              },
              {
                "name": "Scope",
                "value": {
                  "resourceIds": [
                    "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
                  ]
                },
                "isOptional": true
              },
              {
                "name": "PartId",
                "isOptional": true
              },
              {
                "name": "Version",
                "value": "2.0",
                "isOptional": true
              },
              {
                "name": "TimeRange",
                "value": "PT4H",
                "isOptional": true
              },
              {
                "name": "DashboardId",
                "isOptional": true
              },
              {
                "name": "DraftRequestParameters",
                "value": {
                  "scope": "hierarchy"
                },
                "isOptional": true
              },
              {
                "name": "Query",
                "value": "\nlet api_url = \"/api/v1/messages/[^/]+\";\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex api_url\n| extend HTTPStatus = case(\n  httpStatus_d between (100 .. 199), \"1XX\",\n  httpStatus_d between (200 .. 299), \"2XX\",\n  httpStatus_d between (300 .. 399), \"3XX\",\n  httpStatus_d between (400 .. 499), \"4XX\",\n  \"5XX\")\n| summarize count() by HTTPStatus, bin(TimeGenerated, 5m)\n| render areachart with (xtitle = \"time\", ytitle= \"count\")\n",
                "isOptional": true
              },
              {
                "name": "ControlType",
                "value": "FrameControlChart",
                "isOptional": true
              },
              {
                "name": "SpecificChart",
                "value": "Pie",
                "isOptional": true
              },
              {
                "name": "PartTitle",
                "value": "Response Codes (5m)",
                "isOptional": true
              },
              {
                "name": "PartSubTitle",
                "value": "/api/v1/messages/{id}",
                "isOptional": true
              },
              {
                "name": "Dimensions",
                "value": {
                  "xAxis": {
                    "name": "httpStatus_d",
                    "type": "string"
                  },
                  "yAxis": [
                    {
                      "name": "count_",
                      "type": "long"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                },
                "isOptional": true
              },
              {
                "name": "LegendOptions",
                "value": {
                  "isEnabled": true,
                  "position": "Bottom"
                },
                "isOptional": true
              },
              {
                "name": "IsQueryContainTimeRange",
                "value": false,
                "isOptional": true
              }
            ],
            "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart",
            "settings": {
              "content": {
                "Query": "\nlet api_url = \"/api/v1/messages/[^/]+\";\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex api_url\n| extend HTTPStatus = case(\n  httpStatus_d between (100 .. 199), \"1XX\",\n  httpStatus_d between (200 .. 299), \"2XX\",\n  httpStatus_d between (300 .. 399), \"3XX\",\n  httpStatus_d between (400 .. 499), \"4XX\",\n  \"5XX\")\n| summarize count() by HTTPStatus, bin(TimeGenerated, 5m)\n| render areachart with (xtitle = \"time\", ytitle= \"count\")\n",
                "SpecificChart": "StackedArea",
                "PartTitle": "Response Codes (5m)",
                "Dimensions": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "count_",
                      "type": "long"
                    }
                  ],
                  "splitBy": [
                    {
                      "name": "HTTPStatus",
                      "type": "string"
                    }
                  ],
                  "aggregation": "Sum"
                }
              }
            }
          }
        },
        "14": {
          "position": {
            "x": 12,
            "y": 16,
            "colSpan": 6,
            "rowSpan": 4
          },
          "metadata": {
            "inputs": [
              {
                "name": "resourceTypeMode",
                "isOptional": true
              },
              {
                "name": "ComponentId",
                "isOptional": true
              },
              {
                "name": "Scope",
                "value": {
                  "resourceIds": [
                    "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
                  ]
                },
                "isOptional": true
              },
              {
                "name": "PartId",
                "isOptional": true
              },
              {
                "name": "Version",
                "value": "2.0",
                "isOptional": true
              },
              {
                "name": "TimeRange",
                "value": "PT4H",
                "isOptional": true
              },
              {
                "name": "DashboardId",
                "isOptional": true
              },
              {
                "name": "DraftRequestParameters",
                "value": {
                  "scope": "hierarchy"
                },
                "isOptional": true
              },
              {
                "name": "Query",
                "value": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 1;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/messages/[^/]+\"\n| summarize\n    watermark=threshold,\n    percentiles(timeTaken_d, 95) by bin(TimeGenerated, 5m)\n\n| render timechart with (xtitle = \"time\", ytitle= \"response time(s)\")\n\n",
                "isOptional": true
              },
              {
                "name": "ControlType",
                "value": "FrameControlChart",
                "isOptional": true
              },
              {
                "name": "SpecificChart",
                "value": "StackedColumn",
                "isOptional": true
              },
              {
                "name": "PartTitle",
                "value": "Percentile Response Time (5m)",
                "isOptional": true
              },
              {
                "name": "PartSubTitle",
                "value": "/api/v1/messages/{id}",
                "isOptional": true
              },
              {
                "name": "Dimensions",
                "value": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "percentile_timeTaken_d_95",
                      "type": "real"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                },
                "isOptional": true
              },
              {
                "name": "LegendOptions",
                "value": {
                  "isEnabled": true,
                  "position": "Bottom"
                },
                "isOptional": true
              },
              {
                "name": "IsQueryContainTimeRange",
                "value": false,
                "isOptional": true
              }
            ],
            "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart",
            "settings": {
              "content": {
                "Query": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 1;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/messages/[^/]+\"\n| summarize\n    watermark=threshold,\n    percentiles(timeTaken_d, 95) by bin(TimeGenerated, 5m)\n\n| render timechart with (xtitle = \"time\", ytitle= \"response time(s)\")\n\n",
                "SpecificChart": "Line",
                "PartTitle": "Percentile Response Time (5m)",
                "Dimensions": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "watermark",
                      "type": "long"
                    },
                    {
                      "name": "percentile_timeTaken_d_95",
                      "type": "real"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                }
              }
            }
          }
        },
        "15": {
          "position": {
            "x": 0,
            "y": 20,
            "colSpan": 6,
            "rowSpan": 4
          },
          "metadata": {
            "inputs": [
              {
                "name": "resourceTypeMode",
                "isOptional": true
              },
              {
                "name": "ComponentId",
                "isOptional": true
              },
              {
                "name": "Scope",
                "value": {
                  "resourceIds": [
                    "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
                  ]
                },
                "isOptional": true
              },
              {
                "name": "PartId",
                "isOptional": true
              },
              {
                "name": "Version",
                "value": "2.0",
                "isOptional": true
              },
              {
                "name": "TimeRange",
                "value": "PT4H",
                "isOptional": true
              },
              {
                "name": "DashboardId",
                "isOptional": true
              },
              {
                "name": "DraftRequestParameters",
                "value": {
                  "scope": "hierarchy"
                },
                "isOptional": true
              },
              {
                "name": "Query",
                "value": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 0.99;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/messages/[^/]+/message-status\"\n| summarize\n  Total=count(),\n  Success=count(httpStatus_d < 500) by bin(TimeGenerated, 5m)\n| extend availability=toreal(Success) / Total\n\n| project TimeGenerated, availability, watermark=threshold\n| render timechart with (xtitle = \"time\", ytitle= \"availability(%)\")\n\n",
                "isOptional": true
              },
              {
                "name": "ControlType",
                "value": "FrameControlChart",
                "isOptional": true
              },
              {
                "name": "SpecificChart",
                "value": "Line",
                "isOptional": true
              },
              {
                "name": "PartTitle",
                "value": "Availability (5m)",
                "isOptional": true
              },
              {
                "name": "PartSubTitle",
                "value": "/api/v1/messages/{id}/message-status",
                "isOptional": true
              },
              {
                "name": "Dimensions",
                "value": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "availability",
                      "type": "real"
                    },
                    {
                      "name": "watermark",
                      "type": "real"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                },
                "isOptional": true
              },
              {
                "name": "LegendOptions",
                "value": {
                  "isEnabled": true,
                  "position": "Bottom"
                },
                "isOptional": true
              },
              {
                "name": "IsQueryContainTimeRange",
                "value": false,
                "isOptional": true
              }
            ],
            "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart",
            "settings": {
              "content": {
                "Query": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 0.99;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/messages/[^/]+/message-status\"\n| summarize\n  Total=count(),\n  Success=count(httpStatus_d < 500) by bin(TimeGenerated, 5m)\n| extend availability=toreal(Success) / Total\n\n| project TimeGenerated, availability, watermark=threshold\n| render timechart with (xtitle = \"time\", ytitle= \"availability(%)\")\n\n",
                "PartTitle": "Availability (5m)"
              }
            }
          }
        },
        "16": {
          "position": {
            "x": 6,
            "y": 20,
            "colSpan": 6,
            "rowSpan": 4
          },
          "metadata": {
            "inputs": [
              {
                "name": "resourceTypeMode",
                "isOptional": true
              },
              {
                "name": "ComponentId",
                "isOptional": true
              },
              {
                "name": "Scope",
                "value": {
                  "resourceIds": [
                    "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
                  ]
                },
                "isOptional": true
              },
              {
                "name": "PartId",
                "isOptional": true
              },
              {
                "name": "Version",
                "value": "2.0",
                "isOptional": true
              },
              {
                "name": "TimeRange",
                "value": "PT4H",
                "isOptional": true
              },
              {
                "name": "DashboardId",
                "isOptional": true
              },
              {
                "name": "DraftRequestParameters",
                "value": {
                  "scope": "hierarchy"
                },
                "isOptional": true
              },
              {
                "name": "Query",
                "value": "\nlet api_url = \"/api/v1/messages/[^/]+/message-status\";\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex api_url\n| extend HTTPStatus = case(\n  httpStatus_d between (100 .. 199), \"1XX\",\n  httpStatus_d between (200 .. 299), \"2XX\",\n  httpStatus_d between (300 .. 399), \"3XX\",\n  httpStatus_d between (400 .. 499), \"4XX\",\n  \"5XX\")\n| summarize count() by HTTPStatus, bin(TimeGenerated, 5m)\n| render areachart with (xtitle = \"time\", ytitle= \"count\")\n",
                "isOptional": true
              },
              {
                "name": "ControlType",
                "value": "FrameControlChart",
                "isOptional": true
              },
              {
                "name": "SpecificChart",
                "value": "Pie",
                "isOptional": true
              },
              {
                "name": "PartTitle",
                "value": "Response Codes (5m)",
                "isOptional": true
              },
              {
                "name": "PartSubTitle",
                "value": "/api/v1/messages/{id}/message-status",
                "isOptional": true
              },
              {
                "name": "Dimensions",
                "value": {
                  "xAxis": {
                    "name": "httpStatus_d",
                    "type": "string"
                  },
                  "yAxis": [
                    {
                      "name": "count_",
                      "type": "long"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                },
                "isOptional": true
              },
              {
                "name": "LegendOptions",
                "value": {
                  "isEnabled": true,
                  "position": "Bottom"
                },
                "isOptional": true
              },
              {
                "name": "IsQueryContainTimeRange",
                "value": false,
                "isOptional": true
              }
            ],
            "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart",
            "settings": {
              "content": {
                "Query": "\nlet api_url = \"/api/v1/messages/[^/]+/message-status\";\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex api_url\n| extend HTTPStatus = case(\n  httpStatus_d between (100 .. 199), \"1XX\",\n  httpStatus_d between (200 .. 299), \"2XX\",\n  httpStatus_d between (300 .. 399), \"3XX\",\n  httpStatus_d between (400 .. 499), \"4XX\",\n  \"5XX\")\n| summarize count() by HTTPStatus, bin(TimeGenerated, 5m)\n| render areachart with (xtitle = \"time\", ytitle= \"count\")\n",
                "SpecificChart": "StackedArea",
                "PartTitle": "Response Codes (5m)",
                "Dimensions": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "count_",
                      "type": "long"
                    }
                  ],
                  "splitBy": [
                    {
                      "name": "HTTPStatus",
                      "type": "string"
                    }
                  ],
                  "aggregation": "Sum"
                }
              }
            }
          }
        },
        "17": {
          "position": {
            "x": 12,
            "y": 20,
            "colSpan": 6,
            "rowSpan": 4
          },
          "metadata": {
            "inputs": [
              {
                "name": "resourceTypeMode",
                "isOptional": true
              },
              {
                "name": "ComponentId",
                "isOptional": true
              },
              {
                "name": "Scope",
                "value": {
                  "resourceIds": [
                    "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
                  ]
                },
                "isOptional": true
              },
              {
                "name": "PartId",
                "isOptional": true
              },
              {
                "name": "Version",
                "value": "2.0",
                "isOptional": true
              },
              {
                "name": "TimeRange",
                "value": "PT4H",
                "isOptional": true
              },
              {
                "name": "DashboardId",
                "isOptional": true
              },
              {
                "name": "DraftRequestParameters",
                "value": {
                  "scope": "hierarchy"
                },
                "isOptional": true
              },
              {
                "name": "Query",
                "value": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 1;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/messages/[^/]+/message-status\"\n| summarize\n    watermark=threshold,\n    percentiles(timeTaken_d, 95) by bin(TimeGenerated, 5m)\n\n| render timechart with (xtitle = \"time\", ytitle= \"response time(s)\")\n\n",
                "isOptional": true
              },
              {
                "name": "ControlType",
                "value": "FrameControlChart",
                "isOptional": true
              },
              {
                "name": "SpecificChart",
                "value": "StackedColumn",
                "isOptional": true
              },
              {
                "name": "PartTitle",
                "value": "Percentile Response Time (5m)",
                "isOptional": true
              },
              {
                "name": "PartSubTitle",
                "value": "/api/v1/messages/{id}/message-status",
                "isOptional": true
              },
              {
                "name": "Dimensions",
                "value": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "percentile_timeTaken_d_95",
                      "type": "real"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                },
                "isOptional": true
              },
              {
                "name": "LegendOptions",
                "value": {
                  "isEnabled": true,
                  "position": "Bottom"
                },
                "isOptional": true
              },
              {
                "name": "IsQueryContainTimeRange",
                "value": false,
                "isOptional": true
              }
            ],
            "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart",
            "settings": {
              "content": {
                "Query": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 1;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/messages/[^/]+/message-status\"\n| summarize\n    watermark=threshold,\n    percentiles(timeTaken_d, 95) by bin(TimeGenerated, 5m)\n\n| render timechart with (xtitle = \"time\", ytitle= \"response time(s)\")\n\n",
                "SpecificChart": "Line",
                "PartTitle": "Percentile Response Time (5m)",
                "Dimensions": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "watermark",
                      "type": "long"
                    },
                    {
                      "name": "percentile_timeTaken_d_95",
                      "type": "real"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                }
              }
            }
          }
        },
        "18": {
          "position": {
            "x": 0,
            "y": 24,
            "colSpan": 6,
            "rowSpan": 4
          },
          "metadata": {
            "inputs": [
              {
                "name": "resourceTypeMode",
                "isOptional": true
              },
              {
                "name": "ComponentId",
                "isOptional": true
              },
              {
                "name": "Scope",
                "value": {
                  "resourceIds": [
                    "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
                  ]
                },
                "isOptional": true
              },
              {
                "name": "PartId",
                "isOptional": true
              },
              {
                "name": "Version",
                "value": "2.0",
                "isOptional": true
              },
              {
                "name": "TimeRange",
                "value": "PT4H",
                "isOptional": true
              },
              {
                "name": "DashboardId",
                "isOptional": true
              },
              {
                "name": "DraftRequestParameters",
                "value": {
                  "scope": "hierarchy"
                },
                "isOptional": true
              },
              {
                "name": "Query",
                "value": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 0.99;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/legal-messages/[^/]+\"\n| summarize\n  Total=count(),\n  Success=count(httpStatus_d < 500) by bin(TimeGenerated, 5m)\n| extend availability=toreal(Success) / Total\n\n| project TimeGenerated, availability, watermark=threshold\n| render timechart with (xtitle = \"time\", ytitle= \"availability(%)\")\n\n",
                "isOptional": true
              },
              {
                "name": "ControlType",
                "value": "FrameControlChart",
                "isOptional": true
              },
              {
                "name": "SpecificChart",
                "value": "Line",
                "isOptional": true
              },
              {
                "name": "PartTitle",
                "value": "Availability (5m)",
                "isOptional": true
              },
              {
                "name": "PartSubTitle",
                "value": "/api/v1/legal-messages/{id}",
                "isOptional": true
              },
              {
                "name": "Dimensions",
                "value": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "availability",
                      "type": "real"
                    },
                    {
                      "name": "watermark",
                      "type": "real"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                },
                "isOptional": true
              },
              {
                "name": "LegendOptions",
                "value": {
                  "isEnabled": true,
                  "position": "Bottom"
                },
                "isOptional": true
              },
              {
                "name": "IsQueryContainTimeRange",
                "value": false,
                "isOptional": true
              }
            ],
            "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart",
            "settings": {
              "content": {
                "Query": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 0.99;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/legal-messages/[^/]+\"\n| summarize\n  Total=count(),\n  Success=count(httpStatus_d < 500) by bin(TimeGenerated, 5m)\n| extend availability=toreal(Success) / Total\n\n| project TimeGenerated, availability, watermark=threshold\n| render timechart with (xtitle = \"time\", ytitle= \"availability(%)\")\n\n",
                "PartTitle": "Availability (5m)"
              }
            }
          }
        },
        "19": {
          "position": {
            "x": 6,
            "y": 24,
            "colSpan": 6,
            "rowSpan": 4
          },
          "metadata": {
            "inputs": [
              {
                "name": "resourceTypeMode",
                "isOptional": true
              },
              {
                "name": "ComponentId",
                "isOptional": true
              },
              {
                "name": "Scope",
                "value": {
                  "resourceIds": [
                    "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
                  ]
                },
                "isOptional": true
              },
              {
                "name": "PartId",
                "isOptional": true
              },
              {
                "name": "Version",
                "value": "2.0",
                "isOptional": true
              },
              {
                "name": "TimeRange",
                "value": "PT4H",
                "isOptional": true
              },
              {
                "name": "DashboardId",
                "isOptional": true
              },
              {
                "name": "DraftRequestParameters",
                "value": {
                  "scope": "hierarchy"
                },
                "isOptional": true
              },
              {
                "name": "Query",
                "value": "\nlet api_url = \"/api/v1/legal-messages/[^/]+\";\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex api_url\n| extend HTTPStatus = case(\n  httpStatus_d between (100 .. 199), \"1XX\",\n  httpStatus_d between (200 .. 299), \"2XX\",\n  httpStatus_d between (300 .. 399), \"3XX\",\n  httpStatus_d between (400 .. 499), \"4XX\",\n  \"5XX\")\n| summarize count() by HTTPStatus, bin(TimeGenerated, 5m)\n| render areachart with (xtitle = \"time\", ytitle= \"count\")\n",
                "isOptional": true
              },
              {
                "name": "ControlType",
                "value": "FrameControlChart",
                "isOptional": true
              },
              {
                "name": "SpecificChart",
                "value": "Pie",
                "isOptional": true
              },
              {
                "name": "PartTitle",
                "value": "Response Codes (5m)",
                "isOptional": true
              },
              {
                "name": "PartSubTitle",
                "value": "/api/v1/legal-messages/{id}",
                "isOptional": true
              },
              {
                "name": "Dimensions",
                "value": {
                  "xAxis": {
                    "name": "httpStatus_d",
                    "type": "string"
                  },
                  "yAxis": [
                    {
                      "name": "count_",
                      "type": "long"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                },
                "isOptional": true
              },
              {
                "name": "LegendOptions",
                "value": {
                  "isEnabled": true,
                  "position": "Bottom"
                },
                "isOptional": true
              },
              {
                "name": "IsQueryContainTimeRange",
                "value": false,
                "isOptional": true
              }
            ],
            "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart",
            "settings": {
              "content": {
                "Query": "\nlet api_url = \"/api/v1/legal-messages/[^/]+\";\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex api_url\n| extend HTTPStatus = case(\n  httpStatus_d between (100 .. 199), \"1XX\",\n  httpStatus_d between (200 .. 299), \"2XX\",\n  httpStatus_d between (300 .. 399), \"3XX\",\n  httpStatus_d between (400 .. 499), \"4XX\",\n  \"5XX\")\n| summarize count() by HTTPStatus, bin(TimeGenerated, 5m)\n| render areachart with (xtitle = \"time\", ytitle= \"count\")\n",
                "SpecificChart": "StackedArea",
                "PartTitle": "Response Codes (5m)",
                "Dimensions": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "count_",
                      "type": "long"
                    }
                  ],
                  "splitBy": [
                    {
                      "name": "HTTPStatus",
                      "type": "string"
                    }
                  ],
                  "aggregation": "Sum"
                }
              }
            }
          }
        },
        "20": {
          "position": {
            "x": 12,
            "y": 24,
            "colSpan": 6,
            "rowSpan": 4
          },
          "metadata": {
            "inputs": [
              {
                "name": "resourceTypeMode",
                "isOptional": true
              },
              {
                "name": "ComponentId",
                "isOptional": true
              },
              {
                "name": "Scope",
                "value": {
                  "resourceIds": [
                    "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
                  ]
                },
                "isOptional": true
              },
              {
                "name": "PartId",
                "isOptional": true
              },
              {
                "name": "Version",
                "value": "2.0",
                "isOptional": true
              },
              {
                "name": "TimeRange",
                "value": "PT4H",
                "isOptional": true
              },
              {
                "name": "DashboardId",
                "isOptional": true
              },
              {
                "name": "DraftRequestParameters",
                "value": {
                  "scope": "hierarchy"
                },
                "isOptional": true
              },
              {
                "name": "Query",
                "value": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 1;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/legal-messages/[^/]+\"\n| summarize\n    watermark=threshold,\n    percentiles(timeTaken_d, 95) by bin(TimeGenerated, 5m)\n\n| render timechart with (xtitle = \"time\", ytitle= \"response time(s)\")\n\n",
                "isOptional": true
              },
              {
                "name": "ControlType",
                "value": "FrameControlChart",
                "isOptional": true
              },
              {
                "name": "SpecificChart",
                "value": "StackedColumn",
                "isOptional": true
              },
              {
                "name": "PartTitle",
                "value": "Percentile Response Time (5m)",
                "isOptional": true
              },
              {
                "name": "PartSubTitle",
                "value": "/api/v1/legal-messages/{id}",
                "isOptional": true
              },
              {
                "name": "Dimensions",
                "value": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "percentile_timeTaken_d_95",
                      "type": "real"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                },
                "isOptional": true
              },
              {
                "name": "LegendOptions",
                "value": {
                  "isEnabled": true,
                  "position": "Bottom"
                },
                "isOptional": true
              },
              {
                "name": "IsQueryContainTimeRange",
                "value": false,
                "isOptional": true
              }
            ],
            "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart",
            "settings": {
              "content": {
                "Query": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 1;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/legal-messages/[^/]+\"\n| summarize\n    watermark=threshold,\n    percentiles(timeTaken_d, 95) by bin(TimeGenerated, 5m)\n\n| render timechart with (xtitle = \"time\", ytitle= \"response time(s)\")\n\n",
                "SpecificChart": "Line",
                "PartTitle": "Percentile Response Time (5m)",
                "Dimensions": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "watermark",
                      "type": "long"
                    },
                    {
                      "name": "percentile_timeTaken_d_95",
                      "type": "real"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                }
              }
            }
          }
        },
        "21": {
          "position": {
            "x": 0,
            "y": 28,
            "colSpan": 6,
            "rowSpan": 4
          },
          "metadata": {
            "inputs": [
              {
                "name": "resourceTypeMode",
                "isOptional": true
              },
              {
                "name": "ComponentId",
                "isOptional": true
              },
              {
                "name": "Scope",
                "value": {
                  "resourceIds": [
                    "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
                  ]
                },
                "isOptional": true
              },
              {
                "name": "PartId",
                "isOptional": true
              },
              {
                "name": "Version",
                "value": "2.0",
                "isOptional": true
              },
              {
                "name": "TimeRange",
                "value": "PT4H",
                "isOptional": true
              },
              {
                "name": "DashboardId",
                "isOptional": true
              },
              {
                "name": "DraftRequestParameters",
                "value": {
                  "scope": "hierarchy"
                },
                "isOptional": true
              },
              {
                "name": "Query",
                "value": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 0.99;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/legal-messages/[^/]+/attachments/[^/]+\"\n| summarize\n  Total=count(),\n  Success=count(httpStatus_d < 500) by bin(TimeGenerated, 5m)\n| extend availability=toreal(Success) / Total\n\n| project TimeGenerated, availability, watermark=threshold\n| render timechart with (xtitle = \"time\", ytitle= \"availability(%)\")\n\n",
                "isOptional": true
              },
              {
                "name": "ControlType",
                "value": "FrameControlChart",
                "isOptional": true
              },
              {
                "name": "SpecificChart",
                "value": "Line",
                "isOptional": true
              },
              {
                "name": "PartTitle",
                "value": "Availability (5m)",
                "isOptional": true
              },
              {
                "name": "PartSubTitle",
                "value": "/api/v1/legal-messages/{id}/attachments/{attachment_id}",
                "isOptional": true
              },
              {
                "name": "Dimensions",
                "value": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "availability",
                      "type": "real"
                    },
                    {
                      "name": "watermark",
                      "type": "real"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                },
                "isOptional": true
              },
              {
                "name": "LegendOptions",
                "value": {
                  "isEnabled": true,
                  "position": "Bottom"
                },
                "isOptional": true
              },
              {
                "name": "IsQueryContainTimeRange",
                "value": false,
                "isOptional": true
              }
            ],
            "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart",
            "settings": {
              "content": {
                "Query": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 0.99;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/legal-messages/[^/]+/attachments/[^/]+\"\n| summarize\n  Total=count(),\n  Success=count(httpStatus_d < 500) by bin(TimeGenerated, 5m)\n| extend availability=toreal(Success) / Total\n\n| project TimeGenerated, availability, watermark=threshold\n| render timechart with (xtitle = \"time\", ytitle= \"availability(%)\")\n\n",
                "PartTitle": "Availability (5m)"
              }
            }
          }
        },
        "22": {
          "position": {
            "x": 6,
            "y": 28,
            "colSpan": 6,
            "rowSpan": 4
          },
          "metadata": {
            "inputs": [
              {
                "name": "resourceTypeMode",
                "isOptional": true
              },
              {
                "name": "ComponentId",
                "isOptional": true
              },
              {
                "name": "Scope",
                "value": {
                  "resourceIds": [
                    "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
                  ]
                },
                "isOptional": true
              },
              {
                "name": "PartId",
                "isOptional": true
              },
              {
                "name": "Version",
                "value": "2.0",
                "isOptional": true
              },
              {
                "name": "TimeRange",
                "value": "PT4H",
                "isOptional": true
              },
              {
                "name": "DashboardId",
                "isOptional": true
              },
              {
                "name": "DraftRequestParameters",
                "value": {
                  "scope": "hierarchy"
                },
                "isOptional": true
              },
              {
                "name": "Query",
                "value": "\nlet api_url = \"/api/v1/legal-messages/[^/]+/attachments/[^/]+\";\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex api_url\n| extend HTTPStatus = case(\n  httpStatus_d between (100 .. 199), \"1XX\",\n  httpStatus_d between (200 .. 299), \"2XX\",\n  httpStatus_d between (300 .. 399), \"3XX\",\n  httpStatus_d between (400 .. 499), \"4XX\",\n  \"5XX\")\n| summarize count() by HTTPStatus, bin(TimeGenerated, 5m)\n| render areachart with (xtitle = \"time\", ytitle= \"count\")\n",
                "isOptional": true
              },
              {
                "name": "ControlType",
                "value": "FrameControlChart",
                "isOptional": true
              },
              {
                "name": "SpecificChart",
                "value": "Pie",
                "isOptional": true
              },
              {
                "name": "PartTitle",
                "value": "Response Codes (5m)",
                "isOptional": true
              },
              {
                "name": "PartSubTitle",
                "value": "/api/v1/legal-messages/{id}/attachments/{attachment_id}",
                "isOptional": true
              },
              {
                "name": "Dimensions",
                "value": {
                  "xAxis": {
                    "name": "httpStatus_d",
                    "type": "string"
                  },
                  "yAxis": [
                    {
                      "name": "count_",
                      "type": "long"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                },
                "isOptional": true
              },
              {
                "name": "LegendOptions",
                "value": {
                  "isEnabled": true,
                  "position": "Bottom"
                },
                "isOptional": true
              },
              {
                "name": "IsQueryContainTimeRange",
                "value": false,
                "isOptional": true
              }
            ],
            "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart",
            "settings": {
              "content": {
                "Query": "\nlet api_url = \"/api/v1/legal-messages/[^/]+/attachments/[^/]+\";\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex api_url\n| extend HTTPStatus = case(\n  httpStatus_d between (100 .. 199), \"1XX\",\n  httpStatus_d between (200 .. 299), \"2XX\",\n  httpStatus_d between (300 .. 399), \"3XX\",\n  httpStatus_d between (400 .. 499), \"4XX\",\n  \"5XX\")\n| summarize count() by HTTPStatus, bin(TimeGenerated, 5m)\n| render areachart with (xtitle = \"time\", ytitle= \"count\")\n",
                "SpecificChart": "StackedArea",
                "PartTitle": "Response Codes (5m)",
                "Dimensions": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "count_",
                      "type": "long"
                    }
                  ],
                  "splitBy": [
                    {
                      "name": "HTTPStatus",
                      "type": "string"
                    }
                  ],
                  "aggregation": "Sum"
                }
              }
            }
          }
        },
        "23": {
          "position": {
            "x": 12,
            "y": 28,
            "colSpan": 6,
            "rowSpan": 4
          },
          "metadata": {
            "inputs": [
              {
                "name": "resourceTypeMode",
                "isOptional": true
              },
              {
                "name": "ComponentId",
                "isOptional": true
              },
              {
                "name": "Scope",
                "value": {
                  "resourceIds": [
                    "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
                  ]
                },
                "isOptional": true
              },
              {
                "name": "PartId",
                "isOptional": true
              },
              {
                "name": "Version",
                "value": "2.0",
                "isOptional": true
              },
              {
                "name": "TimeRange",
                "value": "PT4H",
                "isOptional": true
              },
              {
                "name": "DashboardId",
                "isOptional": true
              },
              {
                "name": "DraftRequestParameters",
                "value": {
                  "scope": "hierarchy"
                },
                "isOptional": true
              },
              {
                "name": "Query",
                "value": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 1;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/legal-messages/[^/]+/attachments/[^/]+\"\n| summarize\n    watermark=threshold,\n    percentiles(timeTaken_d, 95) by bin(TimeGenerated, 5m)\n\n| render timechart with (xtitle = \"time\", ytitle= \"response time(s)\")\n\n",
                "isOptional": true
              },
              {
                "name": "ControlType",
                "value": "FrameControlChart",
                "isOptional": true
              },
              {
                "name": "SpecificChart",
                "value": "StackedColumn",
                "isOptional": true
              },
              {
                "name": "PartTitle",
                "value": "Percentile Response Time (5m)",
                "isOptional": true
              },
              {
                "name": "PartSubTitle",
                "value": "/api/v1/legal-messages/{id}/attachments/{attachment_id}",
                "isOptional": true
              },
              {
                "name": "Dimensions",
                "value": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "percentile_timeTaken_d_95",
                      "type": "real"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                },
                "isOptional": true
              },
              {
                "name": "LegendOptions",
                "value": {
                  "isEnabled": true,
                  "position": "Bottom"
                },
                "isOptional": true
              },
              {
                "name": "IsQueryContainTimeRange",
                "value": false,
                "isOptional": true
              }
            ],
            "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart",
            "settings": {
              "content": {
                "Query": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 1;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/legal-messages/[^/]+/attachments/[^/]+\"\n| summarize\n    watermark=threshold,\n    percentiles(timeTaken_d, 95) by bin(TimeGenerated, 5m)\n\n| render timechart with (xtitle = \"time\", ytitle= \"response time(s)\")\n\n",
                "SpecificChart": "Line",
                "PartTitle": "Percentile Response Time (5m)",
                "Dimensions": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "watermark",
                      "type": "long"
                    },
                    {
                      "name": "percentile_timeTaken_d_95",
                      "type": "real"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                }
              }
            }
          }
        },
        "24": {
          "position": {
            "x": 0,
            "y": 32,
            "colSpan": 6,
            "rowSpan": 4
          },
          "metadata": {
            "inputs": [
              {
                "name": "resourceTypeMode",
                "isOptional": true
              },
              {
                "name": "ComponentId",
                "isOptional": true
              },
              {
                "name": "Scope",
                "value": {
                  "resourceIds": [
                    "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
                  ]
                },
                "isOptional": true
              },
              {
                "name": "PartId",
                "isOptional": true
              },
              {
                "name": "Version",
                "value": "2.0",
                "isOptional": true
              },
              {
                "name": "TimeRange",
                "value": "PT4H",
                "isOptional": true
              },
              {
                "name": "DashboardId",
                "isOptional": true
              },
              {
                "name": "DraftRequestParameters",
                "value": {
                  "scope": "hierarchy"
                },
                "isOptional": true
              },
              {
                "name": "Query",
                "value": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 0.99;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/third-party-messages/[^/]+\"\n| summarize\n  Total=count(),\n  Success=count(httpStatus_d < 500) by bin(TimeGenerated, 5m)\n| extend availability=toreal(Success) / Total\n\n| project TimeGenerated, availability, watermark=threshold\n| render timechart with (xtitle = \"time\", ytitle= \"availability(%)\")\n\n",
                "isOptional": true
              },
              {
                "name": "ControlType",
                "value": "FrameControlChart",
                "isOptional": true
              },
              {
                "name": "SpecificChart",
                "value": "Line",
                "isOptional": true
              },
              {
                "name": "PartTitle",
                "value": "Availability (5m)",
                "isOptional": true
              },
              {
                "name": "PartSubTitle",
                "value": "/api/v1/third-party-messages/{id}",
                "isOptional": true
              },
              {
                "name": "Dimensions",
                "value": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "availability",
                      "type": "real"
                    },
                    {
                      "name": "watermark",
                      "type": "real"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                },
                "isOptional": true
              },
              {
                "name": "LegendOptions",
                "value": {
                  "isEnabled": true,
                  "position": "Bottom"
                },
                "isOptional": true
              },
              {
                "name": "IsQueryContainTimeRange",
                "value": false,
                "isOptional": true
              }
            ],
            "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart",
            "settings": {
              "content": {
                "Query": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 0.99;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/third-party-messages/[^/]+\"\n| summarize\n  Total=count(),\n  Success=count(httpStatus_d < 500) by bin(TimeGenerated, 5m)\n| extend availability=toreal(Success) / Total\n\n| project TimeGenerated, availability, watermark=threshold\n| render timechart with (xtitle = \"time\", ytitle= \"availability(%)\")\n\n",
                "PartTitle": "Availability (5m)"
              }
            }
          }
        },
        "25": {
          "position": {
            "x": 6,
            "y": 32,
            "colSpan": 6,
            "rowSpan": 4
          },
          "metadata": {
            "inputs": [
              {
                "name": "resourceTypeMode",
                "isOptional": true
              },
              {
                "name": "ComponentId",
                "isOptional": true
              },
              {
                "name": "Scope",
                "value": {
                  "resourceIds": [
                    "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
                  ]
                },
                "isOptional": true
              },
              {
                "name": "PartId",
                "isOptional": true
              },
              {
                "name": "Version",
                "value": "2.0",
                "isOptional": true
              },
              {
                "name": "TimeRange",
                "value": "PT4H",
                "isOptional": true
              },
              {
                "name": "DashboardId",
                "isOptional": true
              },
              {
                "name": "DraftRequestParameters",
                "value": {
                  "scope": "hierarchy"
                },
                "isOptional": true
              },
              {
                "name": "Query",
                "value": "\nlet api_url = \"/api/v1/third-party-messages/[^/]+\";\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex api_url\n| extend HTTPStatus = case(\n  httpStatus_d between (100 .. 199), \"1XX\",\n  httpStatus_d between (200 .. 299), \"2XX\",\n  httpStatus_d between (300 .. 399), \"3XX\",\n  httpStatus_d between (400 .. 499), \"4XX\",\n  \"5XX\")\n| summarize count() by HTTPStatus, bin(TimeGenerated, 5m)\n| render areachart with (xtitle = \"time\", ytitle= \"count\")\n",
                "isOptional": true
              },
              {
                "name": "ControlType",
                "value": "FrameControlChart",
                "isOptional": true
              },
              {
                "name": "SpecificChart",
                "value": "Pie",
                "isOptional": true
              },
              {
                "name": "PartTitle",
                "value": "Response Codes (5m)",
                "isOptional": true
              },
              {
                "name": "PartSubTitle",
                "value": "/api/v1/third-party-messages/{id}",
                "isOptional": true
              },
              {
                "name": "Dimensions",
                "value": {
                  "xAxis": {
                    "name": "httpStatus_d",
                    "type": "string"
                  },
                  "yAxis": [
                    {
                      "name": "count_",
                      "type": "long"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                },
                "isOptional": true
              },
              {
                "name": "LegendOptions",
                "value": {
                  "isEnabled": true,
                  "position": "Bottom"
                },
                "isOptional": true
              },
              {
                "name": "IsQueryContainTimeRange",
                "value": false,
                "isOptional": true
              }
            ],
            "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart",
            "settings": {
              "content": {
                "Query": "\nlet api_url = \"/api/v1/third-party-messages/[^/]+\";\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex api_url\n| extend HTTPStatus = case(\n  httpStatus_d between (100 .. 199), \"1XX\",\n  httpStatus_d between (200 .. 299), \"2XX\",\n  httpStatus_d between (300 .. 399), \"3XX\",\n  httpStatus_d between (400 .. 499), \"4XX\",\n  \"5XX\")\n| summarize count() by HTTPStatus, bin(TimeGenerated, 5m)\n| render areachart with (xtitle = \"time\", ytitle= \"count\")\n",
                "SpecificChart": "StackedArea",
                "PartTitle": "Response Codes (5m)",
                "Dimensions": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "count_",
                      "type": "long"
                    }
                  ],
                  "splitBy": [
                    {
                      "name": "HTTPStatus",
                      "type": "string"
                    }
                  ],
                  "aggregation": "Sum"
                }
              }
            }
          }
        },
        "26": {
          "position": {
            "x": 12,
            "y": 32,
            "colSpan": 6,
            "rowSpan": 4
          },
          "metadata": {
            "inputs": [
              {
                "name": "resourceTypeMode",
                "isOptional": true
              },
              {
                "name": "ComponentId",
                "isOptional": true
              },
              {
                "name": "Scope",
                "value": {
                  "resourceIds": [
                    "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
                  ]
                },
                "isOptional": true
              },
              {
                "name": "PartId",
                "isOptional": true
              },
              {
                "name": "Version",
                "value": "2.0",
                "isOptional": true
              },
              {
                "name": "TimeRange",
                "value": "PT4H",
                "isOptional": true
              },
              {
                "name": "DashboardId",
                "isOptional": true
              },
              {
                "name": "DraftRequestParameters",
                "value": {
                  "scope": "hierarchy"
                },
                "isOptional": true
              },
              {
                "name": "Query",
                "value": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 1;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/third-party-messages/[^/]+\"\n| summarize\n    watermark=threshold,\n    percentiles(timeTaken_d, 95) by bin(TimeGenerated, 5m)\n\n| render timechart with (xtitle = \"time\", ytitle= \"response time(s)\")\n\n",
                "isOptional": true
              },
              {
                "name": "ControlType",
                "value": "FrameControlChart",
                "isOptional": true
              },
              {
                "name": "SpecificChart",
                "value": "StackedColumn",
                "isOptional": true
              },
              {
                "name": "PartTitle",
                "value": "Percentile Response Time (5m)",
                "isOptional": true
              },
              {
                "name": "PartSubTitle",
                "value": "/api/v1/third-party-messages/{id}",
                "isOptional": true
              },
              {
                "name": "Dimensions",
                "value": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "percentile_timeTaken_d_95",
                      "type": "real"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                },
                "isOptional": true
              },
              {
                "name": "LegendOptions",
                "value": {
                  "isEnabled": true,
                  "position": "Bottom"
                },
                "isOptional": true
              },
              {
                "name": "IsQueryContainTimeRange",
                "value": false,
                "isOptional": true
              }
            ],
            "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart",
            "settings": {
              "content": {
                "Query": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 1;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/third-party-messages/[^/]+\"\n| summarize\n    watermark=threshold,\n    percentiles(timeTaken_d, 95) by bin(TimeGenerated, 5m)\n\n| render timechart with (xtitle = \"time\", ytitle= \"response time(s)\")\n\n",
                "SpecificChart": "Line",
                "PartTitle": "Percentile Response Time (5m)",
                "Dimensions": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "watermark",
                      "type": "long"
                    },
                    {
                      "name": "percentile_timeTaken_d_95",
                      "type": "real"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                }
              }
            }
          }
        },
        "27": {
          "position": {
            "x": 0,
            "y": 36,
            "colSpan": 6,
            "rowSpan": 4
          },
          "metadata": {
            "inputs": [
              {
                "name": "resourceTypeMode",
                "isOptional": true
              },
              {
                "name": "ComponentId",
                "isOptional": true
              },
              {
                "name": "Scope",
                "value": {
                  "resourceIds": [
                    "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
                  ]
                },
                "isOptional": true
              },
              {
                "name": "PartId",
                "isOptional": true
              },
              {
                "name": "Version",
                "value": "2.0",
                "isOptional": true
              },
              {
                "name": "TimeRange",
                "value": "PT4H",
                "isOptional": true
              },
              {
                "name": "DashboardId",
                "isOptional": true
              },
              {
                "name": "DraftRequestParameters",
                "value": {
                  "scope": "hierarchy"
                },
                "isOptional": true
              },
              {
                "name": "Query",
                "value": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 0.99;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/third-party-messages/[^/]+/attachments/[^/]+\"\n| summarize\n  Total=count(),\n  Success=count(httpStatus_d < 500) by bin(TimeGenerated, 5m)\n| extend availability=toreal(Success) / Total\n\n| project TimeGenerated, availability, watermark=threshold\n| render timechart with (xtitle = \"time\", ytitle= \"availability(%)\")\n\n",
                "isOptional": true
              },
              {
                "name": "ControlType",
                "value": "FrameControlChart",
                "isOptional": true
              },
              {
                "name": "SpecificChart",
                "value": "Line",
                "isOptional": true
              },
              {
                "name": "PartTitle",
                "value": "Availability (5m)",
                "isOptional": true
              },
              {
                "name": "PartSubTitle",
                "value": "/api/v1/third-party-messages/{id}/attachments/{attachment_url}",
                "isOptional": true
              },
              {
                "name": "Dimensions",
                "value": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "availability",
                      "type": "real"
                    },
                    {
                      "name": "watermark",
                      "type": "real"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                },
                "isOptional": true
              },
              {
                "name": "LegendOptions",
                "value": {
                  "isEnabled": true,
                  "position": "Bottom"
                },
                "isOptional": true
              },
              {
                "name": "IsQueryContainTimeRange",
                "value": false,
                "isOptional": true
              }
            ],
            "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart",
            "settings": {
              "content": {
                "Query": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 0.99;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/third-party-messages/[^/]+/attachments/[^/]+\"\n| summarize\n  Total=count(),\n  Success=count(httpStatus_d < 500) by bin(TimeGenerated, 5m)\n| extend availability=toreal(Success) / Total\n\n| project TimeGenerated, availability, watermark=threshold\n| render timechart with (xtitle = \"time\", ytitle= \"availability(%)\")\n\n",
                "PartTitle": "Availability (5m)"
              }
            }
          }
        },
        "28": {
          "position": {
            "x": 6,
            "y": 36,
            "colSpan": 6,
            "rowSpan": 4
          },
          "metadata": {
            "inputs": [
              {
                "name": "resourceTypeMode",
                "isOptional": true
              },
              {
                "name": "ComponentId",
                "isOptional": true
              },
              {
                "name": "Scope",
                "value": {
                  "resourceIds": [
                    "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
                  ]
                },
                "isOptional": true
              },
              {
                "name": "PartId",
                "isOptional": true
              },
              {
                "name": "Version",
                "value": "2.0",
                "isOptional": true
              },
              {
                "name": "TimeRange",
                "value": "PT4H",
                "isOptional": true
              },
              {
                "name": "DashboardId",
                "isOptional": true
              },
              {
                "name": "DraftRequestParameters",
                "value": {
                  "scope": "hierarchy"
                },
                "isOptional": true
              },
              {
                "name": "Query",
                "value": "\nlet api_url = \"/api/v1/third-party-messages/[^/]+/attachments/[^/]+\";\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex api_url\n| extend HTTPStatus = case(\n  httpStatus_d between (100 .. 199), \"1XX\",\n  httpStatus_d between (200 .. 299), \"2XX\",\n  httpStatus_d between (300 .. 399), \"3XX\",\n  httpStatus_d between (400 .. 499), \"4XX\",\n  \"5XX\")\n| summarize count() by HTTPStatus, bin(TimeGenerated, 5m)\n| render areachart with (xtitle = \"time\", ytitle= \"count\")\n",
                "isOptional": true
              },
              {
                "name": "ControlType",
                "value": "FrameControlChart",
                "isOptional": true
              },
              {
                "name": "SpecificChart",
                "value": "Pie",
                "isOptional": true
              },
              {
                "name": "PartTitle",
                "value": "Response Codes (5m)",
                "isOptional": true
              },
              {
                "name": "PartSubTitle",
                "value": "/api/v1/third-party-messages/{id}/attachments/{attachment_url}",
                "isOptional": true
              },
              {
                "name": "Dimensions",
                "value": {
                  "xAxis": {
                    "name": "httpStatus_d",
                    "type": "string"
                  },
                  "yAxis": [
                    {
                      "name": "count_",
                      "type": "long"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                },
                "isOptional": true
              },
              {
                "name": "LegendOptions",
                "value": {
                  "isEnabled": true,
                  "position": "Bottom"
                },
                "isOptional": true
              },
              {
                "name": "IsQueryContainTimeRange",
                "value": false,
                "isOptional": true
              }
            ],
            "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart",
            "settings": {
              "content": {
                "Query": "\nlet api_url = \"/api/v1/third-party-messages/[^/]+/attachments/[^/]+\";\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex api_url\n| extend HTTPStatus = case(\n  httpStatus_d between (100 .. 199), \"1XX\",\n  httpStatus_d between (200 .. 299), \"2XX\",\n  httpStatus_d between (300 .. 399), \"3XX\",\n  httpStatus_d between (400 .. 499), \"4XX\",\n  \"5XX\")\n| summarize count() by HTTPStatus, bin(TimeGenerated, 5m)\n| render areachart with (xtitle = \"time\", ytitle= \"count\")\n",
                "SpecificChart": "StackedArea",
                "PartTitle": "Response Codes (5m)",
                "Dimensions": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "count_",
                      "type": "long"
                    }
                  ],
                  "splitBy": [
                    {
                      "name": "HTTPStatus",
                      "type": "string"
                    }
                  ],
                  "aggregation": "Sum"
                }
              }
            }
          }
        },
        "29": {
          "position": {
            "x": 12,
            "y": 36,
            "colSpan": 6,
            "rowSpan": 4
          },
          "metadata": {
            "inputs": [
              {
                "name": "resourceTypeMode",
                "isOptional": true
              },
              {
                "name": "ComponentId",
                "isOptional": true
              },
              {
                "name": "Scope",
                "value": {
                  "resourceIds": [
                    "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
                  ]
                },
                "isOptional": true
              },
              {
                "name": "PartId",
                "isOptional": true
              },
              {
                "name": "Version",
                "value": "2.0",
                "isOptional": true
              },
              {
                "name": "TimeRange",
                "value": "PT4H",
                "isOptional": true
              },
              {
                "name": "DashboardId",
                "isOptional": true
              },
              {
                "name": "DraftRequestParameters",
                "value": {
                  "scope": "hierarchy"
                },
                "isOptional": true
              },
              {
                "name": "Query",
                "value": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 1;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/third-party-messages/[^/]+/attachments/[^/]+\"\n| summarize\n    watermark=threshold,\n    percentiles(timeTaken_d, 95) by bin(TimeGenerated, 5m)\n\n| render timechart with (xtitle = \"time\", ytitle= \"response time(s)\")\n\n",
                "isOptional": true
              },
              {
                "name": "ControlType",
                "value": "FrameControlChart",
                "isOptional": true
              },
              {
                "name": "SpecificChart",
                "value": "StackedColumn",
                "isOptional": true
              },
              {
                "name": "PartTitle",
                "value": "Percentile Response Time (5m)",
                "isOptional": true
              },
              {
                "name": "PartSubTitle",
                "value": "/api/v1/third-party-messages/{id}/attachments/{attachment_url}",
                "isOptional": true
              },
              {
                "name": "Dimensions",
                "value": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "percentile_timeTaken_d_95",
                      "type": "real"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                },
                "isOptional": true
              },
              {
                "name": "LegendOptions",
                "value": {
                  "isEnabled": true,
                  "position": "Bottom"
                },
                "isOptional": true
              },
              {
                "name": "IsQueryContainTimeRange",
                "value": false,
                "isOptional": true
              }
            ],
            "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart",
            "settings": {
              "content": {
                "Query": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 1;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/third-party-messages/[^/]+/attachments/[^/]+\"\n| summarize\n    watermark=threshold,\n    percentiles(timeTaken_d, 95) by bin(TimeGenerated, 5m)\n\n| render timechart with (xtitle = \"time\", ytitle= \"response time(s)\")\n\n",
                "SpecificChart": "Line",
                "PartTitle": "Percentile Response Time (5m)",
                "Dimensions": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "watermark",
                      "type": "long"
                    },
                    {
                      "name": "percentile_timeTaken_d_95",
                      "type": "real"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                }
              }
            }
          }
        },
        "30": {
          "position": {
            "x": 0,
            "y": 40,
            "colSpan": 6,
            "rowSpan": 4
          },
          "metadata": {
            "inputs": [
              {
                "name": "resourceTypeMode",
                "isOptional": true
              },
              {
                "name": "ComponentId",
                "isOptional": true
              },
              {
                "name": "Scope",
                "value": {
                  "resourceIds": [
                    "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
                  ]
                },
                "isOptional": true
              },
              {
                "name": "PartId",
                "isOptional": true
              },
              {
                "name": "Version",
                "value": "2.0",
                "isOptional": true
              },
              {
                "name": "TimeRange",
                "value": "PT4H",
                "isOptional": true
              },
              {
                "name": "DashboardId",
                "isOptional": true
              },
              {
                "name": "DraftRequestParameters",
                "value": {
                  "scope": "hierarchy"
                },
                "isOptional": true
              },
              {
                "name": "Query",
                "value": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 0.99;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/profile\"\n| summarize\n  Total=count(),\n  Success=count(httpStatus_d < 500) by bin(TimeGenerated, 5m)\n| extend availability=toreal(Success) / Total\n\n| project TimeGenerated, availability, watermark=threshold\n| render timechart with (xtitle = \"time\", ytitle= \"availability(%)\")\n\n",
                "isOptional": true
              },
              {
                "name": "ControlType",
                "value": "FrameControlChart",
                "isOptional": true
              },
              {
                "name": "SpecificChart",
                "value": "Line",
                "isOptional": true
              },
              {
                "name": "PartTitle",
                "value": "Availability (5m)",
                "isOptional": true
              },
              {
                "name": "PartSubTitle",
                "value": "/api/v1/profile",
                "isOptional": true
              },
              {
                "name": "Dimensions",
                "value": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "availability",
                      "type": "real"
                    },
                    {
                      "name": "watermark",
                      "type": "real"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                },
                "isOptional": true
              },
              {
                "name": "LegendOptions",
                "value": {
                  "isEnabled": true,
                  "position": "Bottom"
                },
                "isOptional": true
              },
              {
                "name": "IsQueryContainTimeRange",
                "value": false,
                "isOptional": true
              }
            ],
            "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart",
            "settings": {
              "content": {
                "Query": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 0.99;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/profile\"\n| summarize\n  Total=count(),\n  Success=count(httpStatus_d < 500) by bin(TimeGenerated, 5m)\n| extend availability=toreal(Success) / Total\n\n| project TimeGenerated, availability, watermark=threshold\n| render timechart with (xtitle = \"time\", ytitle= \"availability(%)\")\n\n",
                "PartTitle": "Availability (5m)"
              }
            }
          }
        },
        "31": {
          "position": {
            "x": 6,
            "y": 40,
            "colSpan": 6,
            "rowSpan": 4
          },
          "metadata": {
            "inputs": [
              {
                "name": "resourceTypeMode",
                "isOptional": true
              },
              {
                "name": "ComponentId",
                "isOptional": true
              },
              {
                "name": "Scope",
                "value": {
                  "resourceIds": [
                    "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
                  ]
                },
                "isOptional": true
              },
              {
                "name": "PartId",
                "isOptional": true
              },
              {
                "name": "Version",
                "value": "2.0",
                "isOptional": true
              },
              {
                "name": "TimeRange",
                "value": "PT4H",
                "isOptional": true
              },
              {
                "name": "DashboardId",
                "isOptional": true
              },
              {
                "name": "DraftRequestParameters",
                "value": {
                  "scope": "hierarchy"
                },
                "isOptional": true
              },
              {
                "name": "Query",
                "value": "\nlet api_url = \"/api/v1/profile\";\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex api_url\n| extend HTTPStatus = case(\n  httpStatus_d between (100 .. 199), \"1XX\",\n  httpStatus_d between (200 .. 299), \"2XX\",\n  httpStatus_d between (300 .. 399), \"3XX\",\n  httpStatus_d between (400 .. 499), \"4XX\",\n  \"5XX\")\n| summarize count() by HTTPStatus, bin(TimeGenerated, 5m)\n| render areachart with (xtitle = \"time\", ytitle= \"count\")\n",
                "isOptional": true
              },
              {
                "name": "ControlType",
                "value": "FrameControlChart",
                "isOptional": true
              },
              {
                "name": "SpecificChart",
                "value": "Pie",
                "isOptional": true
              },
              {
                "name": "PartTitle",
                "value": "Response Codes (5m)",
                "isOptional": true
              },
              {
                "name": "PartSubTitle",
                "value": "/api/v1/profile",
                "isOptional": true
              },
              {
                "name": "Dimensions",
                "value": {
                  "xAxis": {
                    "name": "httpStatus_d",
                    "type": "string"
                  },
                  "yAxis": [
                    {
                      "name": "count_",
                      "type": "long"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                },
                "isOptional": true
              },
              {
                "name": "LegendOptions",
                "value": {
                  "isEnabled": true,
                  "position": "Bottom"
                },
                "isOptional": true
              },
              {
                "name": "IsQueryContainTimeRange",
                "value": false,
                "isOptional": true
              }
            ],
            "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart",
            "settings": {
              "content": {
                "Query": "\nlet api_url = \"/api/v1/profile\";\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex api_url\n| extend HTTPStatus = case(\n  httpStatus_d between (100 .. 199), \"1XX\",\n  httpStatus_d between (200 .. 299), \"2XX\",\n  httpStatus_d between (300 .. 399), \"3XX\",\n  httpStatus_d between (400 .. 499), \"4XX\",\n  \"5XX\")\n| summarize count() by HTTPStatus, bin(TimeGenerated, 5m)\n| render areachart with (xtitle = \"time\", ytitle= \"count\")\n",
                "SpecificChart": "StackedArea",
                "PartTitle": "Response Codes (5m)",
                "Dimensions": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "count_",
                      "type": "long"
                    }
                  ],
                  "splitBy": [
                    {
                      "name": "HTTPStatus",
                      "type": "string"
                    }
                  ],
                  "aggregation": "Sum"
                }
              }
            }
          }
        },
        "32": {
          "position": {
            "x": 12,
            "y": 40,
            "colSpan": 6,
            "rowSpan": 4
          },
          "metadata": {
            "inputs": [
              {
                "name": "resourceTypeMode",
                "isOptional": true
              },
              {
                "name": "ComponentId",
                "isOptional": true
              },
              {
                "name": "Scope",
                "value": {
                  "resourceIds": [
                    "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
                  ]
                },
                "isOptional": true
              },
              {
                "name": "PartId",
                "isOptional": true
              },
              {
                "name": "Version",
                "value": "2.0",
                "isOptional": true
              },
              {
                "name": "TimeRange",
                "value": "PT4H",
                "isOptional": true
              },
              {
                "name": "DashboardId",
                "isOptional": true
              },
              {
                "name": "DraftRequestParameters",
                "value": {
                  "scope": "hierarchy"
                },
                "isOptional": true
              },
              {
                "name": "Query",
                "value": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 1;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/profile\"\n| summarize\n    watermark=threshold,\n    percentiles(timeTaken_d, 95) by bin(TimeGenerated, 5m)\n\n| render timechart with (xtitle = \"time\", ytitle= \"response time(s)\")\n\n",
                "isOptional": true
              },
              {
                "name": "ControlType",
                "value": "FrameControlChart",
                "isOptional": true
              },
              {
                "name": "SpecificChart",
                "value": "StackedColumn",
                "isOptional": true
              },
              {
                "name": "PartTitle",
                "value": "Percentile Response Time (5m)",
                "isOptional": true
              },
              {
                "name": "PartSubTitle",
                "value": "/api/v1/profile",
                "isOptional": true
              },
              {
                "name": "Dimensions",
                "value": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "percentile_timeTaken_d_95",
                      "type": "real"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                },
                "isOptional": true
              },
              {
                "name": "LegendOptions",
                "value": {
                  "isEnabled": true,
                  "position": "Bottom"
                },
                "isOptional": true
              },
              {
                "name": "IsQueryContainTimeRange",
                "value": false,
                "isOptional": true
              }
            ],
            "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart",
            "settings": {
              "content": {
                "Query": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 1;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/profile\"\n| summarize\n    watermark=threshold,\n    percentiles(timeTaken_d, 95) by bin(TimeGenerated, 5m)\n\n| render timechart with (xtitle = \"time\", ytitle= \"response time(s)\")\n\n",
                "SpecificChart": "Line",
                "PartTitle": "Percentile Response Time (5m)",
                "Dimensions": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "watermark",
                      "type": "long"
                    },
                    {
                      "name": "percentile_timeTaken_d_95",
                      "type": "real"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                }
              }
            }
          }
        },
        "33": {
          "position": {
            "x": 0,
            "y": 44,
            "colSpan": 6,
            "rowSpan": 4
          },
          "metadata": {
            "inputs": [
              {
                "name": "resourceTypeMode",
                "isOptional": true
              },
              {
                "name": "ComponentId",
                "isOptional": true
              },
              {
                "name": "Scope",
                "value": {
                  "resourceIds": [
                    "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
                  ]
                },
                "isOptional": true
              },
              {
                "name": "PartId",
                "isOptional": true
              },
              {
                "name": "Version",
                "value": "2.0",
                "isOptional": true
              },
              {
                "name": "TimeRange",
                "value": "PT4H",
                "isOptional": true
              },
              {
                "name": "DashboardId",
                "isOptional": true
              },
              {
                "name": "DraftRequestParameters",
                "value": {
                  "scope": "hierarchy"
                },
                "isOptional": true
              },
              {
                "name": "Query",
                "value": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 0.99;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/api-profile\"\n| summarize\n  Total=count(),\n  Success=count(httpStatus_d < 500) by bin(TimeGenerated, 5m)\n| extend availability=toreal(Success) / Total\n\n| project TimeGenerated, availability, watermark=threshold\n| render timechart with (xtitle = \"time\", ytitle= \"availability(%)\")\n\n",
                "isOptional": true
              },
              {
                "name": "ControlType",
                "value": "FrameControlChart",
                "isOptional": true
              },
              {
                "name": "SpecificChart",
                "value": "Line",
                "isOptional": true
              },
              {
                "name": "PartTitle",
                "value": "Availability (5m)",
                "isOptional": true
              },
              {
                "name": "PartSubTitle",
                "value": "/api/v1/api-profile",
                "isOptional": true
              },
              {
                "name": "Dimensions",
                "value": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "availability",
                      "type": "real"
                    },
                    {
                      "name": "watermark",
                      "type": "real"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                },
                "isOptional": true
              },
              {
                "name": "LegendOptions",
                "value": {
                  "isEnabled": true,
                  "position": "Bottom"
                },
                "isOptional": true
              },
              {
                "name": "IsQueryContainTimeRange",
                "value": false,
                "isOptional": true
              }
            ],
            "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart",
            "settings": {
              "content": {
                "Query": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 0.99;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/api-profile\"\n| summarize\n  Total=count(),\n  Success=count(httpStatus_d < 500) by bin(TimeGenerated, 5m)\n| extend availability=toreal(Success) / Total\n\n| project TimeGenerated, availability, watermark=threshold\n| render timechart with (xtitle = \"time\", ytitle= \"availability(%)\")\n\n",
                "PartTitle": "Availability (5m)"
              }
            }
          }
        },
        "34": {
          "position": {
            "x": 6,
            "y": 44,
            "colSpan": 6,
            "rowSpan": 4
          },
          "metadata": {
            "inputs": [
              {
                "name": "resourceTypeMode",
                "isOptional": true
              },
              {
                "name": "ComponentId",
                "isOptional": true
              },
              {
                "name": "Scope",
                "value": {
                  "resourceIds": [
                    "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
                  ]
                },
                "isOptional": true
              },
              {
                "name": "PartId",
                "isOptional": true
              },
              {
                "name": "Version",
                "value": "2.0",
                "isOptional": true
              },
              {
                "name": "TimeRange",
                "value": "PT4H",
                "isOptional": true
              },
              {
                "name": "DashboardId",
                "isOptional": true
              },
              {
                "name": "DraftRequestParameters",
                "value": {
                  "scope": "hierarchy"
                },
                "isOptional": true
              },
              {
                "name": "Query",
                "value": "\nlet api_url = \"/api/v1/api-profile\";\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex api_url\n| extend HTTPStatus = case(\n  httpStatus_d between (100 .. 199), \"1XX\",\n  httpStatus_d between (200 .. 299), \"2XX\",\n  httpStatus_d between (300 .. 399), \"3XX\",\n  httpStatus_d between (400 .. 499), \"4XX\",\n  \"5XX\")\n| summarize count() by HTTPStatus, bin(TimeGenerated, 5m)\n| render areachart with (xtitle = \"time\", ytitle= \"count\")\n",
                "isOptional": true
              },
              {
                "name": "ControlType",
                "value": "FrameControlChart",
                "isOptional": true
              },
              {
                "name": "SpecificChart",
                "value": "Pie",
                "isOptional": true
              },
              {
                "name": "PartTitle",
                "value": "Response Codes (5m)",
                "isOptional": true
              },
              {
                "name": "PartSubTitle",
                "value": "/api/v1/api-profile",
                "isOptional": true
              },
              {
                "name": "Dimensions",
                "value": {
                  "xAxis": {
                    "name": "httpStatus_d",
                    "type": "string"
                  },
                  "yAxis": [
                    {
                      "name": "count_",
                      "type": "long"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                },
                "isOptional": true
              },
              {
                "name": "LegendOptions",
                "value": {
                  "isEnabled": true,
                  "position": "Bottom"
                },
                "isOptional": true
              },
              {
                "name": "IsQueryContainTimeRange",
                "value": false,
                "isOptional": true
              }
            ],
            "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart",
            "settings": {
              "content": {
                "Query": "\nlet api_url = \"/api/v1/api-profile\";\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex api_url\n| extend HTTPStatus = case(\n  httpStatus_d between (100 .. 199), \"1XX\",\n  httpStatus_d between (200 .. 299), \"2XX\",\n  httpStatus_d between (300 .. 399), \"3XX\",\n  httpStatus_d between (400 .. 499), \"4XX\",\n  \"5XX\")\n| summarize count() by HTTPStatus, bin(TimeGenerated, 5m)\n| render areachart with (xtitle = \"time\", ytitle= \"count\")\n",
                "SpecificChart": "StackedArea",
                "PartTitle": "Response Codes (5m)",
                "Dimensions": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "count_",
                      "type": "long"
                    }
                  ],
                  "splitBy": [
                    {
                      "name": "HTTPStatus",
                      "type": "string"
                    }
                  ],
                  "aggregation": "Sum"
                }
              }
            }
          }
        },
        "35": {
          "position": {
            "x": 12,
            "y": 44,
            "colSpan": 6,
            "rowSpan": 4
          },
          "metadata": {
            "inputs": [
              {
                "name": "resourceTypeMode",
                "isOptional": true
              },
              {
                "name": "ComponentId",
                "isOptional": true
              },
              {
                "name": "Scope",
                "value": {
                  "resourceIds": [
                    "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
                  ]
                },
                "isOptional": true
              },
              {
                "name": "PartId",
                "isOptional": true
              },
              {
                "name": "Version",
                "value": "2.0",
                "isOptional": true
              },
              {
                "name": "TimeRange",
                "value": "PT4H",
                "isOptional": true
              },
              {
                "name": "DashboardId",
                "isOptional": true
              },
              {
                "name": "DraftRequestParameters",
                "value": {
                  "scope": "hierarchy"
                },
                "isOptional": true
              },
              {
                "name": "Query",
                "value": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 1;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/api-profile\"\n| summarize\n    watermark=threshold,\n    percentiles(timeTaken_d, 95) by bin(TimeGenerated, 5m)\n\n| render timechart with (xtitle = \"time\", ytitle= \"response time(s)\")\n\n",
                "isOptional": true
              },
              {
                "name": "ControlType",
                "value": "FrameControlChart",
                "isOptional": true
              },
              {
                "name": "SpecificChart",
                "value": "StackedColumn",
                "isOptional": true
              },
              {
                "name": "PartTitle",
                "value": "Percentile Response Time (5m)",
                "isOptional": true
              },
              {
                "name": "PartSubTitle",
                "value": "/api/v1/api-profile",
                "isOptional": true
              },
              {
                "name": "Dimensions",
                "value": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "percentile_timeTaken_d_95",
                      "type": "real"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                },
                "isOptional": true
              },
              {
                "name": "LegendOptions",
                "value": {
                  "isEnabled": true,
                  "position": "Bottom"
                },
                "isOptional": true
              },
              {
                "name": "IsQueryContainTimeRange",
                "value": false,
                "isOptional": true
              }
            ],
            "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart",
            "settings": {
              "content": {
                "Query": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 1;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/api-profile\"\n| summarize\n    watermark=threshold,\n    percentiles(timeTaken_d, 95) by bin(TimeGenerated, 5m)\n\n| render timechart with (xtitle = \"time\", ytitle= \"response time(s)\")\n\n",
                "SpecificChart": "Line",
                "PartTitle": "Percentile Response Time (5m)",
                "Dimensions": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "watermark",
                      "type": "long"
                    },
                    {
                      "name": "percentile_timeTaken_d_95",
                      "type": "real"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                }
              }
            }
          }
        },
        "36": {
          "position": {
            "x": 0,
            "y": 48,
            "colSpan": 6,
            "rowSpan": 4
          },
          "metadata": {
            "inputs": [
              {
                "name": "resourceTypeMode",
                "isOptional": true
              },
              {
                "name": "ComponentId",
                "isOptional": true
              },
              {
                "name": "Scope",
                "value": {
                  "resourceIds": [
                    "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
                  ]
                },
                "isOptional": true
              },
              {
                "name": "PartId",
                "isOptional": true
              },
              {
                "name": "Version",
                "value": "2.0",
                "isOptional": true
              },
              {
                "name": "TimeRange",
                "value": "PT4H",
                "isOptional": true
              },
              {
                "name": "DashboardId",
                "isOptional": true
              },
              {
                "name": "DraftRequestParameters",
                "value": {
                  "scope": "hierarchy"
                },
                "isOptional": true
              },
              {
                "name": "Query",
                "value": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 0.99;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/email-validation-process\"\n| summarize\n  Total=count(),\n  Success=count(httpStatus_d < 500) by bin(TimeGenerated, 5m)\n| extend availability=toreal(Success) / Total\n\n| project TimeGenerated, availability, watermark=threshold\n| render timechart with (xtitle = \"time\", ytitle= \"availability(%)\")\n\n",
                "isOptional": true
              },
              {
                "name": "ControlType",
                "value": "FrameControlChart",
                "isOptional": true
              },
              {
                "name": "SpecificChart",
                "value": "Line",
                "isOptional": true
              },
              {
                "name": "PartTitle",
                "value": "Availability (5m)",
                "isOptional": true
              },
              {
                "name": "PartSubTitle",
                "value": "/api/v1/email-validation-process",
                "isOptional": true
              },
              {
                "name": "Dimensions",
                "value": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "availability",
                      "type": "real"
                    },
                    {
                      "name": "watermark",
                      "type": "real"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                },
                "isOptional": true
              },
              {
                "name": "LegendOptions",
                "value": {
                  "isEnabled": true,
                  "position": "Bottom"
                },
                "isOptional": true
              },
              {
                "name": "IsQueryContainTimeRange",
                "value": false,
                "isOptional": true
              }
            ],
            "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart",
            "settings": {
              "content": {
                "Query": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 0.99;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/email-validation-process\"\n| summarize\n  Total=count(),\n  Success=count(httpStatus_d < 500) by bin(TimeGenerated, 5m)\n| extend availability=toreal(Success) / Total\n\n| project TimeGenerated, availability, watermark=threshold\n| render timechart with (xtitle = \"time\", ytitle= \"availability(%)\")\n\n",
                "PartTitle": "Availability (5m)"
              }
            }
          }
        },
        "37": {
          "position": {
            "x": 6,
            "y": 48,
            "colSpan": 6,
            "rowSpan": 4
          },
          "metadata": {
            "inputs": [
              {
                "name": "resourceTypeMode",
                "isOptional": true
              },
              {
                "name": "ComponentId",
                "isOptional": true
              },
              {
                "name": "Scope",
                "value": {
                  "resourceIds": [
                    "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
                  ]
                },
                "isOptional": true
              },
              {
                "name": "PartId",
                "isOptional": true
              },
              {
                "name": "Version",
                "value": "2.0",
                "isOptional": true
              },
              {
                "name": "TimeRange",
                "value": "PT4H",
                "isOptional": true
              },
              {
                "name": "DashboardId",
                "isOptional": true
              },
              {
                "name": "DraftRequestParameters",
                "value": {
                  "scope": "hierarchy"
                },
                "isOptional": true
              },
              {
                "name": "Query",
                "value": "\nlet api_url = \"/api/v1/email-validation-process\";\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex api_url\n| extend HTTPStatus = case(\n  httpStatus_d between (100 .. 199), \"1XX\",\n  httpStatus_d between (200 .. 299), \"2XX\",\n  httpStatus_d between (300 .. 399), \"3XX\",\n  httpStatus_d between (400 .. 499), \"4XX\",\n  \"5XX\")\n| summarize count() by HTTPStatus, bin(TimeGenerated, 5m)\n| render areachart with (xtitle = \"time\", ytitle= \"count\")\n",
                "isOptional": true
              },
              {
                "name": "ControlType",
                "value": "FrameControlChart",
                "isOptional": true
              },
              {
                "name": "SpecificChart",
                "value": "Pie",
                "isOptional": true
              },
              {
                "name": "PartTitle",
                "value": "Response Codes (5m)",
                "isOptional": true
              },
              {
                "name": "PartSubTitle",
                "value": "/api/v1/email-validation-process",
                "isOptional": true
              },
              {
                "name": "Dimensions",
                "value": {
                  "xAxis": {
                    "name": "httpStatus_d",
                    "type": "string"
                  },
                  "yAxis": [
                    {
                      "name": "count_",
                      "type": "long"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                },
                "isOptional": true
              },
              {
                "name": "LegendOptions",
                "value": {
                  "isEnabled": true,
                  "position": "Bottom"
                },
                "isOptional": true
              },
              {
                "name": "IsQueryContainTimeRange",
                "value": false,
                "isOptional": true
              }
            ],
            "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart",
            "settings": {
              "content": {
                "Query": "\nlet api_url = \"/api/v1/email-validation-process\";\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex api_url\n| extend HTTPStatus = case(\n  httpStatus_d between (100 .. 199), \"1XX\",\n  httpStatus_d between (200 .. 299), \"2XX\",\n  httpStatus_d between (300 .. 399), \"3XX\",\n  httpStatus_d between (400 .. 499), \"4XX\",\n  \"5XX\")\n| summarize count() by HTTPStatus, bin(TimeGenerated, 5m)\n| render areachart with (xtitle = \"time\", ytitle= \"count\")\n",
                "SpecificChart": "StackedArea",
                "PartTitle": "Response Codes (5m)",
                "Dimensions": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "count_",
                      "type": "long"
                    }
                  ],
                  "splitBy": [
                    {
                      "name": "HTTPStatus",
                      "type": "string"
                    }
                  ],
                  "aggregation": "Sum"
                }
              }
            }
          }
        },
        "38": {
          "position": {
            "x": 12,
            "y": 48,
            "colSpan": 6,
            "rowSpan": 4
          },
          "metadata": {
            "inputs": [
              {
                "name": "resourceTypeMode",
                "isOptional": true
              },
              {
                "name": "ComponentId",
                "isOptional": true
              },
              {
                "name": "Scope",
                "value": {
                  "resourceIds": [
                    "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
                  ]
                },
                "isOptional": true
              },
              {
                "name": "PartId",
                "isOptional": true
              },
              {
                "name": "Version",
                "value": "2.0",
                "isOptional": true
              },
              {
                "name": "TimeRange",
                "value": "PT4H",
                "isOptional": true
              },
              {
                "name": "DashboardId",
                "isOptional": true
              },
              {
                "name": "DraftRequestParameters",
                "value": {
                  "scope": "hierarchy"
                },
                "isOptional": true
              },
              {
                "name": "Query",
                "value": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 1;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/email-validation-process\"\n| summarize\n    watermark=threshold,\n    percentiles(timeTaken_d, 95) by bin(TimeGenerated, 5m)\n\n| render timechart with (xtitle = \"time\", ytitle= \"response time(s)\")\n\n",
                "isOptional": true
              },
              {
                "name": "ControlType",
                "value": "FrameControlChart",
                "isOptional": true
              },
              {
                "name": "SpecificChart",
                "value": "StackedColumn",
                "isOptional": true
              },
              {
                "name": "PartTitle",
                "value": "Percentile Response Time (5m)",
                "isOptional": true
              },
              {
                "name": "PartSubTitle",
                "value": "/api/v1/email-validation-process",
                "isOptional": true
              },
              {
                "name": "Dimensions",
                "value": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "percentile_timeTaken_d_95",
                      "type": "real"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                },
                "isOptional": true
              },
              {
                "name": "LegendOptions",
                "value": {
                  "isEnabled": true,
                  "position": "Bottom"
                },
                "isOptional": true
              },
              {
                "name": "IsQueryContainTimeRange",
                "value": false,
                "isOptional": true
              }
            ],
            "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart",
            "settings": {
              "content": {
                "Query": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 1;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/email-validation-process\"\n| summarize\n    watermark=threshold,\n    percentiles(timeTaken_d, 95) by bin(TimeGenerated, 5m)\n\n| render timechart with (xtitle = \"time\", ytitle= \"response time(s)\")\n\n",
                "SpecificChart": "Line",
                "PartTitle": "Percentile Response Time (5m)",
                "Dimensions": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "watermark",
                      "type": "long"
                    },
                    {
                      "name": "percentile_timeTaken_d_95",
                      "type": "real"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                }
              }
            }
          }
        },
        "39": {
          "position": {
            "x": 0,
            "y": 52,
            "colSpan": 6,
            "rowSpan": 4
          },
          "metadata": {
            "inputs": [
              {
                "name": "resourceTypeMode",
                "isOptional": true
              },
              {
                "name": "ComponentId",
                "isOptional": true
              },
              {
                "name": "Scope",
                "value": {
                  "resourceIds": [
                    "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
                  ]
                },
                "isOptional": true
              },
              {
                "name": "PartId",
                "isOptional": true
              },
              {
                "name": "Version",
                "value": "2.0",
                "isOptional": true
              },
              {
                "name": "TimeRange",
                "value": "PT4H",
                "isOptional": true
              },
              {
                "name": "DashboardId",
                "isOptional": true
              },
              {
                "name": "DraftRequestParameters",
                "value": {
                  "scope": "hierarchy"
                },
                "isOptional": true
              },
              {
                "name": "Query",
                "value": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 0.99;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/user-metadata\"\n| summarize\n  Total=count(),\n  Success=count(httpStatus_d < 500) by bin(TimeGenerated, 5m)\n| extend availability=toreal(Success) / Total\n\n| project TimeGenerated, availability, watermark=threshold\n| render timechart with (xtitle = \"time\", ytitle= \"availability(%)\")\n\n",
                "isOptional": true
              },
              {
                "name": "ControlType",
                "value": "FrameControlChart",
                "isOptional": true
              },
              {
                "name": "SpecificChart",
                "value": "Line",
                "isOptional": true
              },
              {
                "name": "PartTitle",
                "value": "Availability (5m)",
                "isOptional": true
              },
              {
                "name": "PartSubTitle",
                "value": "/api/v1/user-metadata",
                "isOptional": true
              },
              {
                "name": "Dimensions",
                "value": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "availability",
                      "type": "real"
                    },
                    {
                      "name": "watermark",
                      "type": "real"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                },
                "isOptional": true
              },
              {
                "name": "LegendOptions",
                "value": {
                  "isEnabled": true,
                  "position": "Bottom"
                },
                "isOptional": true
              },
              {
                "name": "IsQueryContainTimeRange",
                "value": false,
                "isOptional": true
              }
            ],
            "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart",
            "settings": {
              "content": {
                "Query": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 0.99;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/user-metadata\"\n| summarize\n  Total=count(),\n  Success=count(httpStatus_d < 500) by bin(TimeGenerated, 5m)\n| extend availability=toreal(Success) / Total\n\n| project TimeGenerated, availability, watermark=threshold\n| render timechart with (xtitle = \"time\", ytitle= \"availability(%)\")\n\n",
                "PartTitle": "Availability (5m)"
              }
            }
          }
        },
        "40": {
          "position": {
            "x": 6,
            "y": 52,
            "colSpan": 6,
            "rowSpan": 4
          },
          "metadata": {
            "inputs": [
              {
                "name": "resourceTypeMode",
                "isOptional": true
              },
              {
                "name": "ComponentId",
                "isOptional": true
              },
              {
                "name": "Scope",
                "value": {
                  "resourceIds": [
                    "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
                  ]
                },
                "isOptional": true
              },
              {
                "name": "PartId",
                "isOptional": true
              },
              {
                "name": "Version",
                "value": "2.0",
                "isOptional": true
              },
              {
                "name": "TimeRange",
                "value": "PT4H",
                "isOptional": true
              },
              {
                "name": "DashboardId",
                "isOptional": true
              },
              {
                "name": "DraftRequestParameters",
                "value": {
                  "scope": "hierarchy"
                },
                "isOptional": true
              },
              {
                "name": "Query",
                "value": "\nlet api_url = \"/api/v1/user-metadata\";\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex api_url\n| extend HTTPStatus = case(\n  httpStatus_d between (100 .. 199), \"1XX\",\n  httpStatus_d between (200 .. 299), \"2XX\",\n  httpStatus_d between (300 .. 399), \"3XX\",\n  httpStatus_d between (400 .. 499), \"4XX\",\n  \"5XX\")\n| summarize count() by HTTPStatus, bin(TimeGenerated, 5m)\n| render areachart with (xtitle = \"time\", ytitle= \"count\")\n",
                "isOptional": true
              },
              {
                "name": "ControlType",
                "value": "FrameControlChart",
                "isOptional": true
              },
              {
                "name": "SpecificChart",
                "value": "Pie",
                "isOptional": true
              },
              {
                "name": "PartTitle",
                "value": "Response Codes (5m)",
                "isOptional": true
              },
              {
                "name": "PartSubTitle",
                "value": "/api/v1/user-metadata",
                "isOptional": true
              },
              {
                "name": "Dimensions",
                "value": {
                  "xAxis": {
                    "name": "httpStatus_d",
                    "type": "string"
                  },
                  "yAxis": [
                    {
                      "name": "count_",
                      "type": "long"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                },
                "isOptional": true
              },
              {
                "name": "LegendOptions",
                "value": {
                  "isEnabled": true,
                  "position": "Bottom"
                },
                "isOptional": true
              },
              {
                "name": "IsQueryContainTimeRange",
                "value": false,
                "isOptional": true
              }
            ],
            "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart",
            "settings": {
              "content": {
                "Query": "\nlet api_url = \"/api/v1/user-metadata\";\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex api_url\n| extend HTTPStatus = case(\n  httpStatus_d between (100 .. 199), \"1XX\",\n  httpStatus_d between (200 .. 299), \"2XX\",\n  httpStatus_d between (300 .. 399), \"3XX\",\n  httpStatus_d between (400 .. 499), \"4XX\",\n  \"5XX\")\n| summarize count() by HTTPStatus, bin(TimeGenerated, 5m)\n| render areachart with (xtitle = \"time\", ytitle= \"count\")\n",
                "SpecificChart": "StackedArea",
                "PartTitle": "Response Codes (5m)",
                "Dimensions": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "count_",
                      "type": "long"
                    }
                  ],
                  "splitBy": [
                    {
                      "name": "HTTPStatus",
                      "type": "string"
                    }
                  ],
                  "aggregation": "Sum"
                }
              }
            }
          }
        },
        "41": {
          "position": {
            "x": 12,
            "y": 52,
            "colSpan": 6,
            "rowSpan": 4
          },
          "metadata": {
            "inputs": [
              {
                "name": "resourceTypeMode",
                "isOptional": true
              },
              {
                "name": "ComponentId",
                "isOptional": true
              },
              {
                "name": "Scope",
                "value": {
                  "resourceIds": [
                    "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
                  ]
                },
                "isOptional": true
              },
              {
                "name": "PartId",
                "isOptional": true
              },
              {
                "name": "Version",
                "value": "2.0",
                "isOptional": true
              },
              {
                "name": "TimeRange",
                "value": "PT4H",
                "isOptional": true
              },
              {
                "name": "DashboardId",
                "isOptional": true
              },
              {
                "name": "DraftRequestParameters",
                "value": {
                  "scope": "hierarchy"
                },
                "isOptional": true
              },
              {
                "name": "Query",
                "value": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 1;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/user-metadata\"\n| summarize\n    watermark=threshold,\n    percentiles(timeTaken_d, 95) by bin(TimeGenerated, 5m)\n\n| render timechart with (xtitle = \"time\", ytitle= \"response time(s)\")\n\n",
                "isOptional": true
              },
              {
                "name": "ControlType",
                "value": "FrameControlChart",
                "isOptional": true
              },
              {
                "name": "SpecificChart",
                "value": "StackedColumn",
                "isOptional": true
              },
              {
                "name": "PartTitle",
                "value": "Percentile Response Time (5m)",
                "isOptional": true
              },
              {
                "name": "PartSubTitle",
                "value": "/api/v1/user-metadata",
                "isOptional": true
              },
              {
                "name": "Dimensions",
                "value": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "percentile_timeTaken_d_95",
                      "type": "real"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                },
                "isOptional": true
              },
              {
                "name": "LegendOptions",
                "value": {
                  "isEnabled": true,
                  "position": "Bottom"
                },
                "isOptional": true
              },
              {
                "name": "IsQueryContainTimeRange",
                "value": false,
                "isOptional": true
              }
            ],
            "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart",
            "settings": {
              "content": {
                "Query": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 1;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/user-metadata\"\n| summarize\n    watermark=threshold,\n    percentiles(timeTaken_d, 95) by bin(TimeGenerated, 5m)\n\n| render timechart with (xtitle = \"time\", ytitle= \"response time(s)\")\n\n",
                "SpecificChart": "Line",
                "PartTitle": "Percentile Response Time (5m)",
                "Dimensions": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "watermark",
                      "type": "long"
                    },
                    {
                      "name": "percentile_timeTaken_d_95",
                      "type": "real"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                }
              }
            }
          }
        },
        "42": {
          "position": {
            "x": 0,
            "y": 56,
            "colSpan": 6,
            "rowSpan": 4
          },
          "metadata": {
            "inputs": [
              {
                "name": "resourceTypeMode",
                "isOptional": true
              },
              {
                "name": "ComponentId",
                "isOptional": true
              },
              {
                "name": "Scope",
                "value": {
                  "resourceIds": [
                    "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
                  ]
                },
                "isOptional": true
              },
              {
                "name": "PartId",
                "isOptional": true
              },
              {
                "name": "Version",
                "value": "2.0",
                "isOptional": true
              },
              {
                "name": "TimeRange",
                "value": "PT4H",
                "isOptional": true
              },
              {
                "name": "DashboardId",
                "isOptional": true
              },
              {
                "name": "DraftRequestParameters",
                "value": {
                  "scope": "hierarchy"
                },
                "isOptional": true
              },
              {
                "name": "Query",
                "value": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 0.99;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/installations/[^/]+\"\n| summarize\n  Total=count(),\n  Success=count(httpStatus_d < 500) by bin(TimeGenerated, 5m)\n| extend availability=toreal(Success) / Total\n\n| project TimeGenerated, availability, watermark=threshold\n| render timechart with (xtitle = \"time\", ytitle= \"availability(%)\")\n\n",
                "isOptional": true
              },
              {
                "name": "ControlType",
                "value": "FrameControlChart",
                "isOptional": true
              },
              {
                "name": "SpecificChart",
                "value": "Line",
                "isOptional": true
              },
              {
                "name": "PartTitle",
                "value": "Availability (5m)",
                "isOptional": true
              },
              {
                "name": "PartSubTitle",
                "value": "/api/v1/installations/{installationID}",
                "isOptional": true
              },
              {
                "name": "Dimensions",
                "value": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "availability",
                      "type": "real"
                    },
                    {
                      "name": "watermark",
                      "type": "real"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                },
                "isOptional": true
              },
              {
                "name": "LegendOptions",
                "value": {
                  "isEnabled": true,
                  "position": "Bottom"
                },
                "isOptional": true
              },
              {
                "name": "IsQueryContainTimeRange",
                "value": false,
                "isOptional": true
              }
            ],
            "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart",
            "settings": {
              "content": {
                "Query": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 0.99;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/installations/[^/]+\"\n| summarize\n  Total=count(),\n  Success=count(httpStatus_d < 500) by bin(TimeGenerated, 5m)\n| extend availability=toreal(Success) / Total\n\n| project TimeGenerated, availability, watermark=threshold\n| render timechart with (xtitle = \"time\", ytitle= \"availability(%)\")\n\n",
                "PartTitle": "Availability (5m)"
              }
            }
          }
        },
        "43": {
          "position": {
            "x": 6,
            "y": 56,
            "colSpan": 6,
            "rowSpan": 4
          },
          "metadata": {
            "inputs": [
              {
                "name": "resourceTypeMode",
                "isOptional": true
              },
              {
                "name": "ComponentId",
                "isOptional": true
              },
              {
                "name": "Scope",
                "value": {
                  "resourceIds": [
                    "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
                  ]
                },
                "isOptional": true
              },
              {
                "name": "PartId",
                "isOptional": true
              },
              {
                "name": "Version",
                "value": "2.0",
                "isOptional": true
              },
              {
                "name": "TimeRange",
                "value": "PT4H",
                "isOptional": true
              },
              {
                "name": "DashboardId",
                "isOptional": true
              },
              {
                "name": "DraftRequestParameters",
                "value": {
                  "scope": "hierarchy"
                },
                "isOptional": true
              },
              {
                "name": "Query",
                "value": "\nlet api_url = \"/api/v1/installations/[^/]+\";\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex api_url\n| extend HTTPStatus = case(\n  httpStatus_d between (100 .. 199), \"1XX\",\n  httpStatus_d between (200 .. 299), \"2XX\",\n  httpStatus_d between (300 .. 399), \"3XX\",\n  httpStatus_d between (400 .. 499), \"4XX\",\n  \"5XX\")\n| summarize count() by HTTPStatus, bin(TimeGenerated, 5m)\n| render areachart with (xtitle = \"time\", ytitle= \"count\")\n",
                "isOptional": true
              },
              {
                "name": "ControlType",
                "value": "FrameControlChart",
                "isOptional": true
              },
              {
                "name": "SpecificChart",
                "value": "Pie",
                "isOptional": true
              },
              {
                "name": "PartTitle",
                "value": "Response Codes (5m)",
                "isOptional": true
              },
              {
                "name": "PartSubTitle",
                "value": "/api/v1/installations/{installationID}",
                "isOptional": true
              },
              {
                "name": "Dimensions",
                "value": {
                  "xAxis": {
                    "name": "httpStatus_d",
                    "type": "string"
                  },
                  "yAxis": [
                    {
                      "name": "count_",
                      "type": "long"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                },
                "isOptional": true
              },
              {
                "name": "LegendOptions",
                "value": {
                  "isEnabled": true,
                  "position": "Bottom"
                },
                "isOptional": true
              },
              {
                "name": "IsQueryContainTimeRange",
                "value": false,
                "isOptional": true
              }
            ],
            "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart",
            "settings": {
              "content": {
                "Query": "\nlet api_url = \"/api/v1/installations/[^/]+\";\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex api_url\n| extend HTTPStatus = case(\n  httpStatus_d between (100 .. 199), \"1XX\",\n  httpStatus_d between (200 .. 299), \"2XX\",\n  httpStatus_d between (300 .. 399), \"3XX\",\n  httpStatus_d between (400 .. 499), \"4XX\",\n  \"5XX\")\n| summarize count() by HTTPStatus, bin(TimeGenerated, 5m)\n| render areachart with (xtitle = \"time\", ytitle= \"count\")\n",
                "SpecificChart": "StackedArea",
                "PartTitle": "Response Codes (5m)",
                "Dimensions": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "count_",
                      "type": "long"
                    }
                  ],
                  "splitBy": [
                    {
                      "name": "HTTPStatus",
                      "type": "string"
                    }
                  ],
                  "aggregation": "Sum"
                }
              }
            }
          }
        },
        "44": {
          "position": {
            "x": 12,
            "y": 56,
            "colSpan": 6,
            "rowSpan": 4
          },
          "metadata": {
            "inputs": [
              {
                "name": "resourceTypeMode",
                "isOptional": true
              },
              {
                "name": "ComponentId",
                "isOptional": true
              },
              {
                "name": "Scope",
                "value": {
                  "resourceIds": [
                    "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
                  ]
                },
                "isOptional": true
              },
              {
                "name": "PartId",
                "isOptional": true
              },
              {
                "name": "Version",
                "value": "2.0",
                "isOptional": true
              },
              {
                "name": "TimeRange",
                "value": "PT4H",
                "isOptional": true
              },
              {
                "name": "DashboardId",
                "isOptional": true
              },
              {
                "name": "DraftRequestParameters",
                "value": {
                  "scope": "hierarchy"
                },
                "isOptional": true
              },
              {
                "name": "Query",
                "value": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 1;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/installations/[^/]+\"\n| summarize\n    watermark=threshold,\n    percentiles(timeTaken_d, 95) by bin(TimeGenerated, 5m)\n\n| render timechart with (xtitle = \"time\", ytitle= \"response time(s)\")\n\n",
                "isOptional": true
              },
              {
                "name": "ControlType",
                "value": "FrameControlChart",
                "isOptional": true
              },
              {
                "name": "SpecificChart",
                "value": "StackedColumn",
                "isOptional": true
              },
              {
                "name": "PartTitle",
                "value": "Percentile Response Time (5m)",
                "isOptional": true
              },
              {
                "name": "PartSubTitle",
                "value": "/api/v1/installations/{installationID}",
                "isOptional": true
              },
              {
                "name": "Dimensions",
                "value": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "percentile_timeTaken_d_95",
                      "type": "real"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                },
                "isOptional": true
              },
              {
                "name": "LegendOptions",
                "value": {
                  "isEnabled": true,
                  "position": "Bottom"
                },
                "isOptional": true
              },
              {
                "name": "IsQueryContainTimeRange",
                "value": false,
                "isOptional": true
              }
            ],
            "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart",
            "settings": {
              "content": {
                "Query": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 1;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/installations/[^/]+\"\n| summarize\n    watermark=threshold,\n    percentiles(timeTaken_d, 95) by bin(TimeGenerated, 5m)\n\n| render timechart with (xtitle = \"time\", ytitle= \"response time(s)\")\n\n",
                "SpecificChart": "Line",
                "PartTitle": "Percentile Response Time (5m)",
                "Dimensions": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "watermark",
                      "type": "long"
                    },
                    {
                      "name": "percentile_timeTaken_d_95",
                      "type": "real"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                }
              }
            }
          }
        },
        "45": {
          "position": {
            "x": 0,
            "y": 60,
            "colSpan": 6,
            "rowSpan": 4
          },
          "metadata": {
            "inputs": [
              {
                "name": "resourceTypeMode",
                "isOptional": true
              },
              {
                "name": "ComponentId",
                "isOptional": true
              },
              {
                "name": "Scope",
                "value": {
                  "resourceIds": [
                    "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
                  ]
                },
                "isOptional": true
              },
              {
                "name": "PartId",
                "isOptional": true
              },
              {
                "name": "Version",
                "value": "2.0",
                "isOptional": true
              },
              {
                "name": "TimeRange",
                "value": "PT4H",
                "isOptional": true
              },
              {
                "name": "DashboardId",
                "isOptional": true
              },
              {
                "name": "DraftRequestParameters",
                "value": {
                  "scope": "hierarchy"
                },
                "isOptional": true
              },
              {
                "name": "Query",
                "value": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 0.99;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/session\"\n| summarize\n  Total=count(),\n  Success=count(httpStatus_d < 500) by bin(TimeGenerated, 5m)\n| extend availability=toreal(Success) / Total\n\n| project TimeGenerated, availability, watermark=threshold\n| render timechart with (xtitle = \"time\", ytitle= \"availability(%)\")\n\n",
                "isOptional": true
              },
              {
                "name": "ControlType",
                "value": "FrameControlChart",
                "isOptional": true
              },
              {
                "name": "SpecificChart",
                "value": "Line",
                "isOptional": true
              },
              {
                "name": "PartTitle",
                "value": "Availability (5m)",
                "isOptional": true
              },
              {
                "name": "PartSubTitle",
                "value": "/api/v1/session",
                "isOptional": true
              },
              {
                "name": "Dimensions",
                "value": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "availability",
                      "type": "real"
                    },
                    {
                      "name": "watermark",
                      "type": "real"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                },
                "isOptional": true
              },
              {
                "name": "LegendOptions",
                "value": {
                  "isEnabled": true,
                  "position": "Bottom"
                },
                "isOptional": true
              },
              {
                "name": "IsQueryContainTimeRange",
                "value": false,
                "isOptional": true
              }
            ],
            "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart",
            "settings": {
              "content": {
                "Query": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 0.99;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/session\"\n| summarize\n  Total=count(),\n  Success=count(httpStatus_d < 500) by bin(TimeGenerated, 5m)\n| extend availability=toreal(Success) / Total\n\n| project TimeGenerated, availability, watermark=threshold\n| render timechart with (xtitle = \"time\", ytitle= \"availability(%)\")\n\n",
                "PartTitle": "Availability (5m)"
              }
            }
          }
        },
        "46": {
          "position": {
            "x": 6,
            "y": 60,
            "colSpan": 6,
            "rowSpan": 4
          },
          "metadata": {
            "inputs": [
              {
                "name": "resourceTypeMode",
                "isOptional": true
              },
              {
                "name": "ComponentId",
                "isOptional": true
              },
              {
                "name": "Scope",
                "value": {
                  "resourceIds": [
                    "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
                  ]
                },
                "isOptional": true
              },
              {
                "name": "PartId",
                "isOptional": true
              },
              {
                "name": "Version",
                "value": "2.0",
                "isOptional": true
              },
              {
                "name": "TimeRange",
                "value": "PT4H",
                "isOptional": true
              },
              {
                "name": "DashboardId",
                "isOptional": true
              },
              {
                "name": "DraftRequestParameters",
                "value": {
                  "scope": "hierarchy"
                },
                "isOptional": true
              },
              {
                "name": "Query",
                "value": "\nlet api_url = \"/api/v1/session\";\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex api_url\n| extend HTTPStatus = case(\n  httpStatus_d between (100 .. 199), \"1XX\",\n  httpStatus_d between (200 .. 299), \"2XX\",\n  httpStatus_d between (300 .. 399), \"3XX\",\n  httpStatus_d between (400 .. 499), \"4XX\",\n  \"5XX\")\n| summarize count() by HTTPStatus, bin(TimeGenerated, 5m)\n| render areachart with (xtitle = \"time\", ytitle= \"count\")\n",
                "isOptional": true
              },
              {
                "name": "ControlType",
                "value": "FrameControlChart",
                "isOptional": true
              },
              {
                "name": "SpecificChart",
                "value": "Pie",
                "isOptional": true
              },
              {
                "name": "PartTitle",
                "value": "Response Codes (5m)",
                "isOptional": true
              },
              {
                "name": "PartSubTitle",
                "value": "/api/v1/session",
                "isOptional": true
              },
              {
                "name": "Dimensions",
                "value": {
                  "xAxis": {
                    "name": "httpStatus_d",
                    "type": "string"
                  },
                  "yAxis": [
                    {
                      "name": "count_",
                      "type": "long"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                },
                "isOptional": true
              },
              {
                "name": "LegendOptions",
                "value": {
                  "isEnabled": true,
                  "position": "Bottom"
                },
                "isOptional": true
              },
              {
                "name": "IsQueryContainTimeRange",
                "value": false,
                "isOptional": true
              }
            ],
            "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart",
            "settings": {
              "content": {
                "Query": "\nlet api_url = \"/api/v1/session\";\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex api_url\n| extend HTTPStatus = case(\n  httpStatus_d between (100 .. 199), \"1XX\",\n  httpStatus_d between (200 .. 299), \"2XX\",\n  httpStatus_d between (300 .. 399), \"3XX\",\n  httpStatus_d between (400 .. 499), \"4XX\",\n  \"5XX\")\n| summarize count() by HTTPStatus, bin(TimeGenerated, 5m)\n| render areachart with (xtitle = \"time\", ytitle= \"count\")\n",
                "SpecificChart": "StackedArea",
                "PartTitle": "Response Codes (5m)",
                "Dimensions": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "count_",
                      "type": "long"
                    }
                  ],
                  "splitBy": [
                    {
                      "name": "HTTPStatus",
                      "type": "string"
                    }
                  ],
                  "aggregation": "Sum"
                }
              }
            }
          }
        },
        "47": {
          "position": {
            "x": 12,
            "y": 60,
            "colSpan": 6,
            "rowSpan": 4
          },
          "metadata": {
            "inputs": [
              {
                "name": "resourceTypeMode",
                "isOptional": true
              },
              {
                "name": "ComponentId",
                "isOptional": true
              },
              {
                "name": "Scope",
                "value": {
                  "resourceIds": [
                    "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
                  ]
                },
                "isOptional": true
              },
              {
                "name": "PartId",
                "isOptional": true
              },
              {
                "name": "Version",
                "value": "2.0",
                "isOptional": true
              },
              {
                "name": "TimeRange",
                "value": "PT4H",
                "isOptional": true
              },
              {
                "name": "DashboardId",
                "isOptional": true
              },
              {
                "name": "DraftRequestParameters",
                "value": {
                  "scope": "hierarchy"
                },
                "isOptional": true
              },
              {
                "name": "Query",
                "value": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 1;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/session\"\n| summarize\n    watermark=threshold,\n    percentiles(timeTaken_d, 95) by bin(TimeGenerated, 5m)\n\n| render timechart with (xtitle = \"time\", ytitle= \"response time(s)\")\n\n",
                "isOptional": true
              },
              {
                "name": "ControlType",
                "value": "FrameControlChart",
                "isOptional": true
              },
              {
                "name": "SpecificChart",
                "value": "StackedColumn",
                "isOptional": true
              },
              {
                "name": "PartTitle",
                "value": "Percentile Response Time (5m)",
                "isOptional": true
              },
              {
                "name": "PartSubTitle",
                "value": "/api/v1/session",
                "isOptional": true
              },
              {
                "name": "Dimensions",
                "value": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "percentile_timeTaken_d_95",
                      "type": "real"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                },
                "isOptional": true
              },
              {
                "name": "LegendOptions",
                "value": {
                  "isEnabled": true,
                  "position": "Bottom"
                },
                "isOptional": true
              },
              {
                "name": "IsQueryContainTimeRange",
                "value": false,
                "isOptional": true
              }
            ],
            "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart",
            "settings": {
              "content": {
                "Query": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 1;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/session\"\n| summarize\n    watermark=threshold,\n    percentiles(timeTaken_d, 95) by bin(TimeGenerated, 5m)\n\n| render timechart with (xtitle = \"time\", ytitle= \"response time(s)\")\n\n",
                "SpecificChart": "Line",
                "PartTitle": "Percentile Response Time (5m)",
                "Dimensions": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "watermark",
                      "type": "long"
                    },
                    {
                      "name": "percentile_timeTaken_d_95",
                      "type": "real"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                }
              }
            }
          }
        },
        "48": {
          "position": {
            "x": 0,
            "y": 64,
            "colSpan": 6,
            "rowSpan": 4
          },
          "metadata": {
            "inputs": [
              {
                "name": "resourceTypeMode",
                "isOptional": true
              },
              {
                "name": "ComponentId",
                "isOptional": true
              },
              {
                "name": "Scope",
                "value": {
                  "resourceIds": [
                    "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
                  ]
                },
                "isOptional": true
              },
              {
                "name": "PartId",
                "isOptional": true
              },
              {
                "name": "Version",
                "value": "2.0",
                "isOptional": true
              },
              {
                "name": "TimeRange",
                "value": "PT4H",
                "isOptional": true
              },
              {
                "name": "DashboardId",
                "isOptional": true
              },
              {
                "name": "DraftRequestParameters",
                "value": {
                  "scope": "hierarchy"
                },
                "isOptional": true
              },
              {
                "name": "Query",
                "value": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 0.99;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/sessions\"\n| summarize\n  Total=count(),\n  Success=count(httpStatus_d < 500) by bin(TimeGenerated, 5m)\n| extend availability=toreal(Success) / Total\n\n| project TimeGenerated, availability, watermark=threshold\n| render timechart with (xtitle = \"time\", ytitle= \"availability(%)\")\n\n",
                "isOptional": true
              },
              {
                "name": "ControlType",
                "value": "FrameControlChart",
                "isOptional": true
              },
              {
                "name": "SpecificChart",
                "value": "Line",
                "isOptional": true
              },
              {
                "name": "PartTitle",
                "value": "Availability (5m)",
                "isOptional": true
              },
              {
                "name": "PartSubTitle",
                "value": "/api/v1/sessions",
                "isOptional": true
              },
              {
                "name": "Dimensions",
                "value": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "availability",
                      "type": "real"
                    },
                    {
                      "name": "watermark",
                      "type": "real"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                },
                "isOptional": true
              },
              {
                "name": "LegendOptions",
                "value": {
                  "isEnabled": true,
                  "position": "Bottom"
                },
                "isOptional": true
              },
              {
                "name": "IsQueryContainTimeRange",
                "value": false,
                "isOptional": true
              }
            ],
            "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart",
            "settings": {
              "content": {
                "Query": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 0.99;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/sessions\"\n| summarize\n  Total=count(),\n  Success=count(httpStatus_d < 500) by bin(TimeGenerated, 5m)\n| extend availability=toreal(Success) / Total\n\n| project TimeGenerated, availability, watermark=threshold\n| render timechart with (xtitle = \"time\", ytitle= \"availability(%)\")\n\n",
                "PartTitle": "Availability (5m)"
              }
            }
          }
        },
        "49": {
          "position": {
            "x": 6,
            "y": 64,
            "colSpan": 6,
            "rowSpan": 4
          },
          "metadata": {
            "inputs": [
              {
                "name": "resourceTypeMode",
                "isOptional": true
              },
              {
                "name": "ComponentId",
                "isOptional": true
              },
              {
                "name": "Scope",
                "value": {
                  "resourceIds": [
                    "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
                  ]
                },
                "isOptional": true
              },
              {
                "name": "PartId",
                "isOptional": true
              },
              {
                "name": "Version",
                "value": "2.0",
                "isOptional": true
              },
              {
                "name": "TimeRange",
                "value": "PT4H",
                "isOptional": true
              },
              {
                "name": "DashboardId",
                "isOptional": true
              },
              {
                "name": "DraftRequestParameters",
                "value": {
                  "scope": "hierarchy"
                },
                "isOptional": true
              },
              {
                "name": "Query",
                "value": "\nlet api_url = \"/api/v1/sessions\";\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex api_url\n| extend HTTPStatus = case(\n  httpStatus_d between (100 .. 199), \"1XX\",\n  httpStatus_d between (200 .. 299), \"2XX\",\n  httpStatus_d between (300 .. 399), \"3XX\",\n  httpStatus_d between (400 .. 499), \"4XX\",\n  \"5XX\")\n| summarize count() by HTTPStatus, bin(TimeGenerated, 5m)\n| render areachart with (xtitle = \"time\", ytitle= \"count\")\n",
                "isOptional": true
              },
              {
                "name": "ControlType",
                "value": "FrameControlChart",
                "isOptional": true
              },
              {
                "name": "SpecificChart",
                "value": "Pie",
                "isOptional": true
              },
              {
                "name": "PartTitle",
                "value": "Response Codes (5m)",
                "isOptional": true
              },
              {
                "name": "PartSubTitle",
                "value": "/api/v1/sessions",
                "isOptional": true
              },
              {
                "name": "Dimensions",
                "value": {
                  "xAxis": {
                    "name": "httpStatus_d",
                    "type": "string"
                  },
                  "yAxis": [
                    {
                      "name": "count_",
                      "type": "long"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                },
                "isOptional": true
              },
              {
                "name": "LegendOptions",
                "value": {
                  "isEnabled": true,
                  "position": "Bottom"
                },
                "isOptional": true
              },
              {
                "name": "IsQueryContainTimeRange",
                "value": false,
                "isOptional": true
              }
            ],
            "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart",
            "settings": {
              "content": {
                "Query": "\nlet api_url = \"/api/v1/sessions\";\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex api_url\n| extend HTTPStatus = case(\n  httpStatus_d between (100 .. 199), \"1XX\",\n  httpStatus_d between (200 .. 299), \"2XX\",\n  httpStatus_d between (300 .. 399), \"3XX\",\n  httpStatus_d between (400 .. 499), \"4XX\",\n  \"5XX\")\n| summarize count() by HTTPStatus, bin(TimeGenerated, 5m)\n| render areachart with (xtitle = \"time\", ytitle= \"count\")\n",
                "SpecificChart": "StackedArea",
                "PartTitle": "Response Codes (5m)",
                "Dimensions": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "count_",
                      "type": "long"
                    }
                  ],
                  "splitBy": [
                    {
                      "name": "HTTPStatus",
                      "type": "string"
                    }
                  ],
                  "aggregation": "Sum"
                }
              }
            }
          }
        },
        "50": {
          "position": {
            "x": 12,
            "y": 64,
            "colSpan": 6,
            "rowSpan": 4
          },
          "metadata": {
            "inputs": [
              {
                "name": "resourceTypeMode",
                "isOptional": true
              },
              {
                "name": "ComponentId",
                "isOptional": true
              },
              {
                "name": "Scope",
                "value": {
                  "resourceIds": [
                    "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
                  ]
                },
                "isOptional": true
              },
              {
                "name": "PartId",
                "isOptional": true
              },
              {
                "name": "Version",
                "value": "2.0",
                "isOptional": true
              },
              {
                "name": "TimeRange",
                "value": "PT4H",
                "isOptional": true
              },
              {
                "name": "DashboardId",
                "isOptional": true
              },
              {
                "name": "DraftRequestParameters",
                "value": {
                  "scope": "hierarchy"
                },
                "isOptional": true
              },
              {
                "name": "Query",
                "value": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 1;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/sessions\"\n| summarize\n    watermark=threshold,\n    percentiles(timeTaken_d, 95) by bin(TimeGenerated, 5m)\n\n| render timechart with (xtitle = \"time\", ytitle= \"response time(s)\")\n\n",
                "isOptional": true
              },
              {
                "name": "ControlType",
                "value": "FrameControlChart",
                "isOptional": true
              },
              {
                "name": "SpecificChart",
                "value": "StackedColumn",
                "isOptional": true
              },
              {
                "name": "PartTitle",
                "value": "Percentile Response Time (5m)",
                "isOptional": true
              },
              {
                "name": "PartSubTitle",
                "value": "/api/v1/sessions",
                "isOptional": true
              },
              {
                "name": "Dimensions",
                "value": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "percentile_timeTaken_d_95",
                      "type": "real"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                },
                "isOptional": true
              },
              {
                "name": "LegendOptions",
                "value": {
                  "isEnabled": true,
                  "position": "Bottom"
                },
                "isOptional": true
              },
              {
                "name": "IsQueryContainTimeRange",
                "value": false,
                "isOptional": true
              }
            ],
            "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart",
            "settings": {
              "content": {
                "Query": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 1;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/sessions\"\n| summarize\n    watermark=threshold,\n    percentiles(timeTaken_d, 95) by bin(TimeGenerated, 5m)\n\n| render timechart with (xtitle = \"time\", ytitle= \"response time(s)\")\n\n",
                "SpecificChart": "Line",
                "PartTitle": "Percentile Response Time (5m)",
                "Dimensions": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "watermark",
                      "type": "long"
                    },
                    {
                      "name": "percentile_timeTaken_d_95",
                      "type": "real"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                }
              }
            }
          }
        },
        "51": {
          "position": {
            "x": 0,
            "y": 68,
            "colSpan": 6,
            "rowSpan": 4
          },
          "metadata": {
            "inputs": [
              {
                "name": "resourceTypeMode",
                "isOptional": true
              },
              {
                "name": "ComponentId",
                "isOptional": true
              },
              {
                "name": "Scope",
                "value": {
                  "resourceIds": [
                    "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
                  ]
                },
                "isOptional": true
              },
              {
                "name": "PartId",
                "isOptional": true
              },
              {
                "name": "Version",
                "value": "2.0",
                "isOptional": true
              },
              {
                "name": "TimeRange",
                "value": "PT4H",
                "isOptional": true
              },
              {
                "name": "DashboardId",
                "isOptional": true
              },
              {
                "name": "DraftRequestParameters",
                "value": {
                  "scope": "hierarchy"
                },
                "isOptional": true
              },
              {
                "name": "Query",
                "value": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 0.99;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/token/support\"\n| summarize\n  Total=count(),\n  Success=count(httpStatus_d < 500) by bin(TimeGenerated, 5m)\n| extend availability=toreal(Success) / Total\n\n| project TimeGenerated, availability, watermark=threshold\n| render timechart with (xtitle = \"time\", ytitle= \"availability(%)\")\n\n",
                "isOptional": true
              },
              {
                "name": "ControlType",
                "value": "FrameControlChart",
                "isOptional": true
              },
              {
                "name": "SpecificChart",
                "value": "Line",
                "isOptional": true
              },
              {
                "name": "PartTitle",
                "value": "Availability (5m)",
                "isOptional": true
              },
              {
                "name": "PartSubTitle",
                "value": "/api/v1/token/support",
                "isOptional": true
              },
              {
                "name": "Dimensions",
                "value": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "availability",
                      "type": "real"
                    },
                    {
                      "name": "watermark",
                      "type": "real"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                },
                "isOptional": true
              },
              {
                "name": "LegendOptions",
                "value": {
                  "isEnabled": true,
                  "position": "Bottom"
                },
                "isOptional": true
              },
              {
                "name": "IsQueryContainTimeRange",
                "value": false,
                "isOptional": true
              }
            ],
            "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart",
            "settings": {
              "content": {
                "Query": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 0.99;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/token/support\"\n| summarize\n  Total=count(),\n  Success=count(httpStatus_d < 500) by bin(TimeGenerated, 5m)\n| extend availability=toreal(Success) / Total\n\n| project TimeGenerated, availability, watermark=threshold\n| render timechart with (xtitle = \"time\", ytitle= \"availability(%)\")\n\n",
                "PartTitle": "Availability (5m)"
              }
            }
          }
        },
        "52": {
          "position": {
            "x": 6,
            "y": 68,
            "colSpan": 6,
            "rowSpan": 4
          },
          "metadata": {
            "inputs": [
              {
                "name": "resourceTypeMode",
                "isOptional": true
              },
              {
                "name": "ComponentId",
                "isOptional": true
              },
              {
                "name": "Scope",
                "value": {
                  "resourceIds": [
                    "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
                  ]
                },
                "isOptional": true
              },
              {
                "name": "PartId",
                "isOptional": true
              },
              {
                "name": "Version",
                "value": "2.0",
                "isOptional": true
              },
              {
                "name": "TimeRange",
                "value": "PT4H",
                "isOptional": true
              },
              {
                "name": "DashboardId",
                "isOptional": true
              },
              {
                "name": "DraftRequestParameters",
                "value": {
                  "scope": "hierarchy"
                },
                "isOptional": true
              },
              {
                "name": "Query",
                "value": "\nlet api_url = \"/api/v1/token/support\";\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex api_url\n| extend HTTPStatus = case(\n  httpStatus_d between (100 .. 199), \"1XX\",\n  httpStatus_d between (200 .. 299), \"2XX\",\n  httpStatus_d between (300 .. 399), \"3XX\",\n  httpStatus_d between (400 .. 499), \"4XX\",\n  \"5XX\")\n| summarize count() by HTTPStatus, bin(TimeGenerated, 5m)\n| render areachart with (xtitle = \"time\", ytitle= \"count\")\n",
                "isOptional": true
              },
              {
                "name": "ControlType",
                "value": "FrameControlChart",
                "isOptional": true
              },
              {
                "name": "SpecificChart",
                "value": "Pie",
                "isOptional": true
              },
              {
                "name": "PartTitle",
                "value": "Response Codes (5m)",
                "isOptional": true
              },
              {
                "name": "PartSubTitle",
                "value": "/api/v1/token/support",
                "isOptional": true
              },
              {
                "name": "Dimensions",
                "value": {
                  "xAxis": {
                    "name": "httpStatus_d",
                    "type": "string"
                  },
                  "yAxis": [
                    {
                      "name": "count_",
                      "type": "long"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                },
                "isOptional": true
              },
              {
                "name": "LegendOptions",
                "value": {
                  "isEnabled": true,
                  "position": "Bottom"
                },
                "isOptional": true
              },
              {
                "name": "IsQueryContainTimeRange",
                "value": false,
                "isOptional": true
              }
            ],
            "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart",
            "settings": {
              "content": {
                "Query": "\nlet api_url = \"/api/v1/token/support\";\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex api_url\n| extend HTTPStatus = case(\n  httpStatus_d between (100 .. 199), \"1XX\",\n  httpStatus_d between (200 .. 299), \"2XX\",\n  httpStatus_d between (300 .. 399), \"3XX\",\n  httpStatus_d between (400 .. 499), \"4XX\",\n  \"5XX\")\n| summarize count() by HTTPStatus, bin(TimeGenerated, 5m)\n| render areachart with (xtitle = \"time\", ytitle= \"count\")\n",
                "SpecificChart": "StackedArea",
                "PartTitle": "Response Codes (5m)",
                "Dimensions": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "count_",
                      "type": "long"
                    }
                  ],
                  "splitBy": [
                    {
                      "name": "HTTPStatus",
                      "type": "string"
                    }
                  ],
                  "aggregation": "Sum"
                }
              }
            }
          }
        },
        "53": {
          "position": {
            "x": 12,
            "y": 68,
            "colSpan": 6,
            "rowSpan": 4
          },
          "metadata": {
            "inputs": [
              {
                "name": "resourceTypeMode",
                "isOptional": true
              },
              {
                "name": "ComponentId",
                "isOptional": true
              },
              {
                "name": "Scope",
                "value": {
                  "resourceIds": [
                    "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
                  ]
                },
                "isOptional": true
              },
              {
                "name": "PartId",
                "isOptional": true
              },
              {
                "name": "Version",
                "value": "2.0",
                "isOptional": true
              },
              {
                "name": "TimeRange",
                "value": "PT4H",
                "isOptional": true
              },
              {
                "name": "DashboardId",
                "isOptional": true
              },
              {
                "name": "DraftRequestParameters",
                "value": {
                  "scope": "hierarchy"
                },
                "isOptional": true
              },
              {
                "name": "Query",
                "value": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 1;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/token/support\"\n| summarize\n    watermark=threshold,\n    percentiles(timeTaken_d, 95) by bin(TimeGenerated, 5m)\n\n| render timechart with (xtitle = \"time\", ytitle= \"response time(s)\")\n\n",
                "isOptional": true
              },
              {
                "name": "ControlType",
                "value": "FrameControlChart",
                "isOptional": true
              },
              {
                "name": "SpecificChart",
                "value": "StackedColumn",
                "isOptional": true
              },
              {
                "name": "PartTitle",
                "value": "Percentile Response Time (5m)",
                "isOptional": true
              },
              {
                "name": "PartSubTitle",
                "value": "/api/v1/token/support",
                "isOptional": true
              },
              {
                "name": "Dimensions",
                "value": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "percentile_timeTaken_d_95",
                      "type": "real"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                },
                "isOptional": true
              },
              {
                "name": "LegendOptions",
                "value": {
                  "isEnabled": true,
                  "position": "Bottom"
                },
                "isOptional": true
              },
              {
                "name": "IsQueryContainTimeRange",
                "value": false,
                "isOptional": true
              }
            ],
            "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart",
            "settings": {
              "content": {
                "Query": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 1;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/token/support\"\n| summarize\n    watermark=threshold,\n    percentiles(timeTaken_d, 95) by bin(TimeGenerated, 5m)\n\n| render timechart with (xtitle = \"time\", ytitle= \"response time(s)\")\n\n",
                "SpecificChart": "Line",
                "PartTitle": "Percentile Response Time (5m)",
                "Dimensions": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "watermark",
                      "type": "long"
                    },
                    {
                      "name": "percentile_timeTaken_d_95",
                      "type": "real"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                }
              }
            }
          }
        },
        "54": {
          "position": {
            "x": 0,
            "y": 72,
            "colSpan": 6,
            "rowSpan": 4
          },
          "metadata": {
            "inputs": [
              {
                "name": "resourceTypeMode",
                "isOptional": true
              },
              {
                "name": "ComponentId",
                "isOptional": true
              },
              {
                "name": "Scope",
                "value": {
                  "resourceIds": [
                    "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
                  ]
                },
                "isOptional": true
              },
              {
                "name": "PartId",
                "isOptional": true
              },
              {
                "name": "Version",
                "value": "2.0",
                "isOptional": true
              },
              {
                "name": "TimeRange",
                "value": "PT4H",
                "isOptional": true
              },
              {
                "name": "DashboardId",
                "isOptional": true
              },
              {
                "name": "DraftRequestParameters",
                "value": {
                  "scope": "hierarchy"
                },
                "isOptional": true
              },
              {
                "name": "Query",
                "value": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 0.99;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/payment-requests/[^/]+\"\n| summarize\n  Total=count(),\n  Success=count(httpStatus_d < 500) by bin(TimeGenerated, 5m)\n| extend availability=toreal(Success) / Total\n\n| project TimeGenerated, availability, watermark=threshold\n| render timechart with (xtitle = \"time\", ytitle= \"availability(%)\")\n\n",
                "isOptional": true
              },
              {
                "name": "ControlType",
                "value": "FrameControlChart",
                "isOptional": true
              },
              {
                "name": "SpecificChart",
                "value": "Line",
                "isOptional": true
              },
              {
                "name": "PartTitle",
                "value": "Availability (5m)",
                "isOptional": true
              },
              {
                "name": "PartSubTitle",
                "value": "/api/v1/payment-requests/{rptId}",
                "isOptional": true
              },
              {
                "name": "Dimensions",
                "value": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "availability",
                      "type": "real"
                    },
                    {
                      "name": "watermark",
                      "type": "real"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                },
                "isOptional": true
              },
              {
                "name": "LegendOptions",
                "value": {
                  "isEnabled": true,
                  "position": "Bottom"
                },
                "isOptional": true
              },
              {
                "name": "IsQueryContainTimeRange",
                "value": false,
                "isOptional": true
              }
            ],
            "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart",
            "settings": {
              "content": {
                "Query": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 0.99;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/payment-requests/[^/]+\"\n| summarize\n  Total=count(),\n  Success=count(httpStatus_d < 500) by bin(TimeGenerated, 5m)\n| extend availability=toreal(Success) / Total\n\n| project TimeGenerated, availability, watermark=threshold\n| render timechart with (xtitle = \"time\", ytitle= \"availability(%)\")\n\n",
                "PartTitle": "Availability (5m)"
              }
            }
          }
        },
        "55": {
          "position": {
            "x": 6,
            "y": 72,
            "colSpan": 6,
            "rowSpan": 4
          },
          "metadata": {
            "inputs": [
              {
                "name": "resourceTypeMode",
                "isOptional": true
              },
              {
                "name": "ComponentId",
                "isOptional": true
              },
              {
                "name": "Scope",
                "value": {
                  "resourceIds": [
                    "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
                  ]
                },
                "isOptional": true
              },
              {
                "name": "PartId",
                "isOptional": true
              },
              {
                "name": "Version",
                "value": "2.0",
                "isOptional": true
              },
              {
                "name": "TimeRange",
                "value": "PT4H",
                "isOptional": true
              },
              {
                "name": "DashboardId",
                "isOptional": true
              },
              {
                "name": "DraftRequestParameters",
                "value": {
                  "scope": "hierarchy"
                },
                "isOptional": true
              },
              {
                "name": "Query",
                "value": "\nlet api_url = \"/api/v1/payment-requests/[^/]+\";\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex api_url\n| extend HTTPStatus = case(\n  httpStatus_d between (100 .. 199), \"1XX\",\n  httpStatus_d between (200 .. 299), \"2XX\",\n  httpStatus_d between (300 .. 399), \"3XX\",\n  httpStatus_d between (400 .. 499), \"4XX\",\n  \"5XX\")\n| summarize count() by HTTPStatus, bin(TimeGenerated, 5m)\n| render areachart with (xtitle = \"time\", ytitle= \"count\")\n",
                "isOptional": true
              },
              {
                "name": "ControlType",
                "value": "FrameControlChart",
                "isOptional": true
              },
              {
                "name": "SpecificChart",
                "value": "Pie",
                "isOptional": true
              },
              {
                "name": "PartTitle",
                "value": "Response Codes (5m)",
                "isOptional": true
              },
              {
                "name": "PartSubTitle",
                "value": "/api/v1/payment-requests/{rptId}",
                "isOptional": true
              },
              {
                "name": "Dimensions",
                "value": {
                  "xAxis": {
                    "name": "httpStatus_d",
                    "type": "string"
                  },
                  "yAxis": [
                    {
                      "name": "count_",
                      "type": "long"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                },
                "isOptional": true
              },
              {
                "name": "LegendOptions",
                "value": {
                  "isEnabled": true,
                  "position": "Bottom"
                },
                "isOptional": true
              },
              {
                "name": "IsQueryContainTimeRange",
                "value": false,
                "isOptional": true
              }
            ],
            "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart",
            "settings": {
              "content": {
                "Query": "\nlet api_url = \"/api/v1/payment-requests/[^/]+\";\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex api_url\n| extend HTTPStatus = case(\n  httpStatus_d between (100 .. 199), \"1XX\",\n  httpStatus_d between (200 .. 299), \"2XX\",\n  httpStatus_d between (300 .. 399), \"3XX\",\n  httpStatus_d between (400 .. 499), \"4XX\",\n  \"5XX\")\n| summarize count() by HTTPStatus, bin(TimeGenerated, 5m)\n| render areachart with (xtitle = \"time\", ytitle= \"count\")\n",
                "SpecificChart": "StackedArea",
                "PartTitle": "Response Codes (5m)",
                "Dimensions": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "count_",
                      "type": "long"
                    }
                  ],
                  "splitBy": [
                    {
                      "name": "HTTPStatus",
                      "type": "string"
                    }
                  ],
                  "aggregation": "Sum"
                }
              }
            }
          }
        },
        "56": {
          "position": {
            "x": 12,
            "y": 72,
            "colSpan": 6,
            "rowSpan": 4
          },
          "metadata": {
            "inputs": [
              {
                "name": "resourceTypeMode",
                "isOptional": true
              },
              {
                "name": "ComponentId",
                "isOptional": true
              },
              {
                "name": "Scope",
                "value": {
                  "resourceIds": [
                    "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
                  ]
                },
                "isOptional": true
              },
              {
                "name": "PartId",
                "isOptional": true
              },
              {
                "name": "Version",
                "value": "2.0",
                "isOptional": true
              },
              {
                "name": "TimeRange",
                "value": "PT4H",
                "isOptional": true
              },
              {
                "name": "DashboardId",
                "isOptional": true
              },
              {
                "name": "DraftRequestParameters",
                "value": {
                  "scope": "hierarchy"
                },
                "isOptional": true
              },
              {
                "name": "Query",
                "value": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 1;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/payment-requests/[^/]+\"\n| summarize\n    watermark=threshold,\n    percentiles(timeTaken_d, 95) by bin(TimeGenerated, 5m)\n\n| render timechart with (xtitle = \"time\", ytitle= \"response time(s)\")\n\n",
                "isOptional": true
              },
              {
                "name": "ControlType",
                "value": "FrameControlChart",
                "isOptional": true
              },
              {
                "name": "SpecificChart",
                "value": "StackedColumn",
                "isOptional": true
              },
              {
                "name": "PartTitle",
                "value": "Percentile Response Time (5m)",
                "isOptional": true
              },
              {
                "name": "PartSubTitle",
                "value": "/api/v1/payment-requests/{rptId}",
                "isOptional": true
              },
              {
                "name": "Dimensions",
                "value": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "percentile_timeTaken_d_95",
                      "type": "real"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                },
                "isOptional": true
              },
              {
                "name": "LegendOptions",
                "value": {
                  "isEnabled": true,
                  "position": "Bottom"
                },
                "isOptional": true
              },
              {
                "name": "IsQueryContainTimeRange",
                "value": false,
                "isOptional": true
              }
            ],
            "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart",
            "settings": {
              "content": {
                "Query": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 1;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/payment-requests/[^/]+\"\n| summarize\n    watermark=threshold,\n    percentiles(timeTaken_d, 95) by bin(TimeGenerated, 5m)\n\n| render timechart with (xtitle = \"time\", ytitle= \"response time(s)\")\n\n",
                "SpecificChart": "Line",
                "PartTitle": "Percentile Response Time (5m)",
                "Dimensions": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "watermark",
                      "type": "long"
                    },
                    {
                      "name": "percentile_timeTaken_d_95",
                      "type": "real"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                }
              }
            }
          }
        },
        "57": {
          "position": {
            "x": 0,
            "y": 76,
            "colSpan": 6,
            "rowSpan": 4
          },
          "metadata": {
            "inputs": [
              {
                "name": "resourceTypeMode",
                "isOptional": true
              },
              {
                "name": "ComponentId",
                "isOptional": true
              },
              {
                "name": "Scope",
                "value": {
                  "resourceIds": [
                    "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
                  ]
                },
                "isOptional": true
              },
              {
                "name": "PartId",
                "isOptional": true
              },
              {
                "name": "Version",
                "value": "2.0",
                "isOptional": true
              },
              {
                "name": "TimeRange",
                "value": "PT4H",
                "isOptional": true
              },
              {
                "name": "DashboardId",
                "isOptional": true
              },
              {
                "name": "DraftRequestParameters",
                "value": {
                  "scope": "hierarchy"
                },
                "isOptional": true
              },
              {
                "name": "Query",
                "value": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 0.99;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/payment-activations\"\n| summarize\n  Total=count(),\n  Success=count(httpStatus_d < 500) by bin(TimeGenerated, 5m)\n| extend availability=toreal(Success) / Total\n\n| project TimeGenerated, availability, watermark=threshold\n| render timechart with (xtitle = \"time\", ytitle= \"availability(%)\")\n\n",
                "isOptional": true
              },
              {
                "name": "ControlType",
                "value": "FrameControlChart",
                "isOptional": true
              },
              {
                "name": "SpecificChart",
                "value": "Line",
                "isOptional": true
              },
              {
                "name": "PartTitle",
                "value": "Availability (5m)",
                "isOptional": true
              },
              {
                "name": "PartSubTitle",
                "value": "/api/v1/payment-activations",
                "isOptional": true
              },
              {
                "name": "Dimensions",
                "value": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "availability",
                      "type": "real"
                    },
                    {
                      "name": "watermark",
                      "type": "real"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                },
                "isOptional": true
              },
              {
                "name": "LegendOptions",
                "value": {
                  "isEnabled": true,
                  "position": "Bottom"
                },
                "isOptional": true
              },
              {
                "name": "IsQueryContainTimeRange",
                "value": false,
                "isOptional": true
              }
            ],
            "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart",
            "settings": {
              "content": {
                "Query": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 0.99;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/payment-activations\"\n| summarize\n  Total=count(),\n  Success=count(httpStatus_d < 500) by bin(TimeGenerated, 5m)\n| extend availability=toreal(Success) / Total\n\n| project TimeGenerated, availability, watermark=threshold\n| render timechart with (xtitle = \"time\", ytitle= \"availability(%)\")\n\n",
                "PartTitle": "Availability (5m)"
              }
            }
          }
        },
        "58": {
          "position": {
            "x": 6,
            "y": 76,
            "colSpan": 6,
            "rowSpan": 4
          },
          "metadata": {
            "inputs": [
              {
                "name": "resourceTypeMode",
                "isOptional": true
              },
              {
                "name": "ComponentId",
                "isOptional": true
              },
              {
                "name": "Scope",
                "value": {
                  "resourceIds": [
                    "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
                  ]
                },
                "isOptional": true
              },
              {
                "name": "PartId",
                "isOptional": true
              },
              {
                "name": "Version",
                "value": "2.0",
                "isOptional": true
              },
              {
                "name": "TimeRange",
                "value": "PT4H",
                "isOptional": true
              },
              {
                "name": "DashboardId",
                "isOptional": true
              },
              {
                "name": "DraftRequestParameters",
                "value": {
                  "scope": "hierarchy"
                },
                "isOptional": true
              },
              {
                "name": "Query",
                "value": "\nlet api_url = \"/api/v1/payment-activations\";\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex api_url\n| extend HTTPStatus = case(\n  httpStatus_d between (100 .. 199), \"1XX\",\n  httpStatus_d between (200 .. 299), \"2XX\",\n  httpStatus_d between (300 .. 399), \"3XX\",\n  httpStatus_d between (400 .. 499), \"4XX\",\n  \"5XX\")\n| summarize count() by HTTPStatus, bin(TimeGenerated, 5m)\n| render areachart with (xtitle = \"time\", ytitle= \"count\")\n",
                "isOptional": true
              },
              {
                "name": "ControlType",
                "value": "FrameControlChart",
                "isOptional": true
              },
              {
                "name": "SpecificChart",
                "value": "Pie",
                "isOptional": true
              },
              {
                "name": "PartTitle",
                "value": "Response Codes (5m)",
                "isOptional": true
              },
              {
                "name": "PartSubTitle",
                "value": "/api/v1/payment-activations",
                "isOptional": true
              },
              {
                "name": "Dimensions",
                "value": {
                  "xAxis": {
                    "name": "httpStatus_d",
                    "type": "string"
                  },
                  "yAxis": [
                    {
                      "name": "count_",
                      "type": "long"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                },
                "isOptional": true
              },
              {
                "name": "LegendOptions",
                "value": {
                  "isEnabled": true,
                  "position": "Bottom"
                },
                "isOptional": true
              },
              {
                "name": "IsQueryContainTimeRange",
                "value": false,
                "isOptional": true
              }
            ],
            "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart",
            "settings": {
              "content": {
                "Query": "\nlet api_url = \"/api/v1/payment-activations\";\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex api_url\n| extend HTTPStatus = case(\n  httpStatus_d between (100 .. 199), \"1XX\",\n  httpStatus_d between (200 .. 299), \"2XX\",\n  httpStatus_d between (300 .. 399), \"3XX\",\n  httpStatus_d between (400 .. 499), \"4XX\",\n  \"5XX\")\n| summarize count() by HTTPStatus, bin(TimeGenerated, 5m)\n| render areachart with (xtitle = \"time\", ytitle= \"count\")\n",
                "SpecificChart": "StackedArea",
                "PartTitle": "Response Codes (5m)",
                "Dimensions": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "count_",
                      "type": "long"
                    }
                  ],
                  "splitBy": [
                    {
                      "name": "HTTPStatus",
                      "type": "string"
                    }
                  ],
                  "aggregation": "Sum"
                }
              }
            }
          }
        },
        "59": {
          "position": {
            "x": 12,
            "y": 76,
            "colSpan": 6,
            "rowSpan": 4
          },
          "metadata": {
            "inputs": [
              {
                "name": "resourceTypeMode",
                "isOptional": true
              },
              {
                "name": "ComponentId",
                "isOptional": true
              },
              {
                "name": "Scope",
                "value": {
                  "resourceIds": [
                    "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
                  ]
                },
                "isOptional": true
              },
              {
                "name": "PartId",
                "isOptional": true
              },
              {
                "name": "Version",
                "value": "2.0",
                "isOptional": true
              },
              {
                "name": "TimeRange",
                "value": "PT4H",
                "isOptional": true
              },
              {
                "name": "DashboardId",
                "isOptional": true
              },
              {
                "name": "DraftRequestParameters",
                "value": {
                  "scope": "hierarchy"
                },
                "isOptional": true
              },
              {
                "name": "Query",
                "value": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 1;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/payment-activations\"\n| summarize\n    watermark=threshold,\n    percentiles(timeTaken_d, 95) by bin(TimeGenerated, 5m)\n\n| render timechart with (xtitle = \"time\", ytitle= \"response time(s)\")\n\n",
                "isOptional": true
              },
              {
                "name": "ControlType",
                "value": "FrameControlChart",
                "isOptional": true
              },
              {
                "name": "SpecificChart",
                "value": "StackedColumn",
                "isOptional": true
              },
              {
                "name": "PartTitle",
                "value": "Percentile Response Time (5m)",
                "isOptional": true
              },
              {
                "name": "PartSubTitle",
                "value": "/api/v1/payment-activations",
                "isOptional": true
              },
              {
                "name": "Dimensions",
                "value": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "percentile_timeTaken_d_95",
                      "type": "real"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                },
                "isOptional": true
              },
              {
                "name": "LegendOptions",
                "value": {
                  "isEnabled": true,
                  "position": "Bottom"
                },
                "isOptional": true
              },
              {
                "name": "IsQueryContainTimeRange",
                "value": false,
                "isOptional": true
              }
            ],
            "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart",
            "settings": {
              "content": {
                "Query": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 1;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/payment-activations\"\n| summarize\n    watermark=threshold,\n    percentiles(timeTaken_d, 95) by bin(TimeGenerated, 5m)\n\n| render timechart with (xtitle = \"time\", ytitle= \"response time(s)\")\n\n",
                "SpecificChart": "Line",
                "PartTitle": "Percentile Response Time (5m)",
                "Dimensions": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "watermark",
                      "type": "long"
                    },
                    {
                      "name": "percentile_timeTaken_d_95",
                      "type": "real"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                }
              }
            }
          }
        },
        "60": {
          "position": {
            "x": 0,
            "y": 80,
            "colSpan": 6,
            "rowSpan": 4
          },
          "metadata": {
            "inputs": [
              {
                "name": "resourceTypeMode",
                "isOptional": true
              },
              {
                "name": "ComponentId",
                "isOptional": true
              },
              {
                "name": "Scope",
                "value": {
                  "resourceIds": [
                    "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
                  ]
                },
                "isOptional": true
              },
              {
                "name": "PartId",
                "isOptional": true
              },
              {
                "name": "Version",
                "value": "2.0",
                "isOptional": true
              },
              {
                "name": "TimeRange",
                "value": "PT4H",
                "isOptional": true
              },
              {
                "name": "DashboardId",
                "isOptional": true
              },
              {
                "name": "DraftRequestParameters",
                "value": {
                  "scope": "hierarchy"
                },
                "isOptional": true
              },
              {
                "name": "Query",
                "value": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 0.99;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/payment-activations/[^/]+\"\n| summarize\n  Total=count(),\n  Success=count(httpStatus_d < 500) by bin(TimeGenerated, 5m)\n| extend availability=toreal(Success) / Total\n\n| project TimeGenerated, availability, watermark=threshold\n| render timechart with (xtitle = \"time\", ytitle= \"availability(%)\")\n\n",
                "isOptional": true
              },
              {
                "name": "ControlType",
                "value": "FrameControlChart",
                "isOptional": true
              },
              {
                "name": "SpecificChart",
                "value": "Line",
                "isOptional": true
              },
              {
                "name": "PartTitle",
                "value": "Availability (5m)",
                "isOptional": true
              },
              {
                "name": "PartSubTitle",
                "value": "/api/v1/payment-activations/{codiceContestoPagamento}",
                "isOptional": true
              },
              {
                "name": "Dimensions",
                "value": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "availability",
                      "type": "real"
                    },
                    {
                      "name": "watermark",
                      "type": "real"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                },
                "isOptional": true
              },
              {
                "name": "LegendOptions",
                "value": {
                  "isEnabled": true,
                  "position": "Bottom"
                },
                "isOptional": true
              },
              {
                "name": "IsQueryContainTimeRange",
                "value": false,
                "isOptional": true
              }
            ],
            "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart",
            "settings": {
              "content": {
                "Query": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 0.99;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/payment-activations/[^/]+\"\n| summarize\n  Total=count(),\n  Success=count(httpStatus_d < 500) by bin(TimeGenerated, 5m)\n| extend availability=toreal(Success) / Total\n\n| project TimeGenerated, availability, watermark=threshold\n| render timechart with (xtitle = \"time\", ytitle= \"availability(%)\")\n\n",
                "PartTitle": "Availability (5m)"
              }
            }
          }
        },
        "61": {
          "position": {
            "x": 6,
            "y": 80,
            "colSpan": 6,
            "rowSpan": 4
          },
          "metadata": {
            "inputs": [
              {
                "name": "resourceTypeMode",
                "isOptional": true
              },
              {
                "name": "ComponentId",
                "isOptional": true
              },
              {
                "name": "Scope",
                "value": {
                  "resourceIds": [
                    "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
                  ]
                },
                "isOptional": true
              },
              {
                "name": "PartId",
                "isOptional": true
              },
              {
                "name": "Version",
                "value": "2.0",
                "isOptional": true
              },
              {
                "name": "TimeRange",
                "value": "PT4H",
                "isOptional": true
              },
              {
                "name": "DashboardId",
                "isOptional": true
              },
              {
                "name": "DraftRequestParameters",
                "value": {
                  "scope": "hierarchy"
                },
                "isOptional": true
              },
              {
                "name": "Query",
                "value": "\nlet api_url = \"/api/v1/payment-activations/[^/]+\";\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex api_url\n| extend HTTPStatus = case(\n  httpStatus_d between (100 .. 199), \"1XX\",\n  httpStatus_d between (200 .. 299), \"2XX\",\n  httpStatus_d between (300 .. 399), \"3XX\",\n  httpStatus_d between (400 .. 499), \"4XX\",\n  \"5XX\")\n| summarize count() by HTTPStatus, bin(TimeGenerated, 5m)\n| render areachart with (xtitle = \"time\", ytitle= \"count\")\n",
                "isOptional": true
              },
              {
                "name": "ControlType",
                "value": "FrameControlChart",
                "isOptional": true
              },
              {
                "name": "SpecificChart",
                "value": "Pie",
                "isOptional": true
              },
              {
                "name": "PartTitle",
                "value": "Response Codes (5m)",
                "isOptional": true
              },
              {
                "name": "PartSubTitle",
                "value": "/api/v1/payment-activations/{codiceContestoPagamento}",
                "isOptional": true
              },
              {
                "name": "Dimensions",
                "value": {
                  "xAxis": {
                    "name": "httpStatus_d",
                    "type": "string"
                  },
                  "yAxis": [
                    {
                      "name": "count_",
                      "type": "long"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                },
                "isOptional": true
              },
              {
                "name": "LegendOptions",
                "value": {
                  "isEnabled": true,
                  "position": "Bottom"
                },
                "isOptional": true
              },
              {
                "name": "IsQueryContainTimeRange",
                "value": false,
                "isOptional": true
              }
            ],
            "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart",
            "settings": {
              "content": {
                "Query": "\nlet api_url = \"/api/v1/payment-activations/[^/]+\";\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex api_url\n| extend HTTPStatus = case(\n  httpStatus_d between (100 .. 199), \"1XX\",\n  httpStatus_d between (200 .. 299), \"2XX\",\n  httpStatus_d between (300 .. 399), \"3XX\",\n  httpStatus_d between (400 .. 499), \"4XX\",\n  \"5XX\")\n| summarize count() by HTTPStatus, bin(TimeGenerated, 5m)\n| render areachart with (xtitle = \"time\", ytitle= \"count\")\n",
                "SpecificChart": "StackedArea",
                "PartTitle": "Response Codes (5m)",
                "Dimensions": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "count_",
                      "type": "long"
                    }
                  ],
                  "splitBy": [
                    {
                      "name": "HTTPStatus",
                      "type": "string"
                    }
                  ],
                  "aggregation": "Sum"
                }
              }
            }
          }
        },
        "62": {
          "position": {
            "x": 12,
            "y": 80,
            "colSpan": 6,
            "rowSpan": 4
          },
          "metadata": {
            "inputs": [
              {
                "name": "resourceTypeMode",
                "isOptional": true
              },
              {
                "name": "ComponentId",
                "isOptional": true
              },
              {
                "name": "Scope",
                "value": {
                  "resourceIds": [
                    "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
                  ]
                },
                "isOptional": true
              },
              {
                "name": "PartId",
                "isOptional": true
              },
              {
                "name": "Version",
                "value": "2.0",
                "isOptional": true
              },
              {
                "name": "TimeRange",
                "value": "PT4H",
                "isOptional": true
              },
              {
                "name": "DashboardId",
                "isOptional": true
              },
              {
                "name": "DraftRequestParameters",
                "value": {
                  "scope": "hierarchy"
                },
                "isOptional": true
              },
              {
                "name": "Query",
                "value": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 1;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/payment-activations/[^/]+\"\n| summarize\n    watermark=threshold,\n    percentiles(timeTaken_d, 95) by bin(TimeGenerated, 5m)\n\n| render timechart with (xtitle = \"time\", ytitle= \"response time(s)\")\n\n",
                "isOptional": true
              },
              {
                "name": "ControlType",
                "value": "FrameControlChart",
                "isOptional": true
              },
              {
                "name": "SpecificChart",
                "value": "StackedColumn",
                "isOptional": true
              },
              {
                "name": "PartTitle",
                "value": "Percentile Response Time (5m)",
                "isOptional": true
              },
              {
                "name": "PartSubTitle",
                "value": "/api/v1/payment-activations/{codiceContestoPagamento}",
                "isOptional": true
              },
              {
                "name": "Dimensions",
                "value": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "percentile_timeTaken_d_95",
                      "type": "real"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                },
                "isOptional": true
              },
              {
                "name": "LegendOptions",
                "value": {
                  "isEnabled": true,
                  "position": "Bottom"
                },
                "isOptional": true
              },
              {
                "name": "IsQueryContainTimeRange",
                "value": false,
                "isOptional": true
              }
            ],
            "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart",
            "settings": {
              "content": {
                "Query": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 1;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/payment-activations/[^/]+\"\n| summarize\n    watermark=threshold,\n    percentiles(timeTaken_d, 95) by bin(TimeGenerated, 5m)\n\n| render timechart with (xtitle = \"time\", ytitle= \"response time(s)\")\n\n",
                "SpecificChart": "Line",
                "PartTitle": "Percentile Response Time (5m)",
                "Dimensions": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "watermark",
                      "type": "long"
                    },
                    {
                      "name": "percentile_timeTaken_d_95",
                      "type": "real"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                }
              }
            }
          }
        },
        "63": {
          "position": {
            "x": 0,
            "y": 84,
            "colSpan": 6,
            "rowSpan": 4
          },
          "metadata": {
            "inputs": [
              {
                "name": "resourceTypeMode",
                "isOptional": true
              },
              {
                "name": "ComponentId",
                "isOptional": true
              },
              {
                "name": "Scope",
                "value": {
                  "resourceIds": [
                    "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
                  ]
                },
                "isOptional": true
              },
              {
                "name": "PartId",
                "isOptional": true
              },
              {
                "name": "Version",
                "value": "2.0",
                "isOptional": true
              },
              {
                "name": "TimeRange",
                "value": "PT4H",
                "isOptional": true
              },
              {
                "name": "DashboardId",
                "isOptional": true
              },
              {
                "name": "DraftRequestParameters",
                "value": {
                  "scope": "hierarchy"
                },
                "isOptional": true
              },
              {
                "name": "Query",
                "value": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 0.99;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/user-data-processing\"\n| summarize\n  Total=count(),\n  Success=count(httpStatus_d < 500) by bin(TimeGenerated, 5m)\n| extend availability=toreal(Success) / Total\n\n| project TimeGenerated, availability, watermark=threshold\n| render timechart with (xtitle = \"time\", ytitle= \"availability(%)\")\n\n",
                "isOptional": true
              },
              {
                "name": "ControlType",
                "value": "FrameControlChart",
                "isOptional": true
              },
              {
                "name": "SpecificChart",
                "value": "Line",
                "isOptional": true
              },
              {
                "name": "PartTitle",
                "value": "Availability (5m)",
                "isOptional": true
              },
              {
                "name": "PartSubTitle",
                "value": "/api/v1/user-data-processing",
                "isOptional": true
              },
              {
                "name": "Dimensions",
                "value": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "availability",
                      "type": "real"
                    },
                    {
                      "name": "watermark",
                      "type": "real"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                },
                "isOptional": true
              },
              {
                "name": "LegendOptions",
                "value": {
                  "isEnabled": true,
                  "position": "Bottom"
                },
                "isOptional": true
              },
              {
                "name": "IsQueryContainTimeRange",
                "value": false,
                "isOptional": true
              }
            ],
            "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart",
            "settings": {
              "content": {
                "Query": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 0.99;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/user-data-processing\"\n| summarize\n  Total=count(),\n  Success=count(httpStatus_d < 500) by bin(TimeGenerated, 5m)\n| extend availability=toreal(Success) / Total\n\n| project TimeGenerated, availability, watermark=threshold\n| render timechart with (xtitle = \"time\", ytitle= \"availability(%)\")\n\n",
                "PartTitle": "Availability (5m)"
              }
            }
          }
        },
        "64": {
          "position": {
            "x": 6,
            "y": 84,
            "colSpan": 6,
            "rowSpan": 4
          },
          "metadata": {
            "inputs": [
              {
                "name": "resourceTypeMode",
                "isOptional": true
              },
              {
                "name": "ComponentId",
                "isOptional": true
              },
              {
                "name": "Scope",
                "value": {
                  "resourceIds": [
                    "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
                  ]
                },
                "isOptional": true
              },
              {
                "name": "PartId",
                "isOptional": true
              },
              {
                "name": "Version",
                "value": "2.0",
                "isOptional": true
              },
              {
                "name": "TimeRange",
                "value": "PT4H",
                "isOptional": true
              },
              {
                "name": "DashboardId",
                "isOptional": true
              },
              {
                "name": "DraftRequestParameters",
                "value": {
                  "scope": "hierarchy"
                },
                "isOptional": true
              },
              {
                "name": "Query",
                "value": "\nlet api_url = \"/api/v1/user-data-processing\";\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex api_url\n| extend HTTPStatus = case(\n  httpStatus_d between (100 .. 199), \"1XX\",\n  httpStatus_d between (200 .. 299), \"2XX\",\n  httpStatus_d between (300 .. 399), \"3XX\",\n  httpStatus_d between (400 .. 499), \"4XX\",\n  \"5XX\")\n| summarize count() by HTTPStatus, bin(TimeGenerated, 5m)\n| render areachart with (xtitle = \"time\", ytitle= \"count\")\n",
                "isOptional": true
              },
              {
                "name": "ControlType",
                "value": "FrameControlChart",
                "isOptional": true
              },
              {
                "name": "SpecificChart",
                "value": "Pie",
                "isOptional": true
              },
              {
                "name": "PartTitle",
                "value": "Response Codes (5m)",
                "isOptional": true
              },
              {
                "name": "PartSubTitle",
                "value": "/api/v1/user-data-processing",
                "isOptional": true
              },
              {
                "name": "Dimensions",
                "value": {
                  "xAxis": {
                    "name": "httpStatus_d",
                    "type": "string"
                  },
                  "yAxis": [
                    {
                      "name": "count_",
                      "type": "long"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                },
                "isOptional": true
              },
              {
                "name": "LegendOptions",
                "value": {
                  "isEnabled": true,
                  "position": "Bottom"
                },
                "isOptional": true
              },
              {
                "name": "IsQueryContainTimeRange",
                "value": false,
                "isOptional": true
              }
            ],
            "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart",
            "settings": {
              "content": {
                "Query": "\nlet api_url = \"/api/v1/user-data-processing\";\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex api_url\n| extend HTTPStatus = case(\n  httpStatus_d between (100 .. 199), \"1XX\",\n  httpStatus_d between (200 .. 299), \"2XX\",\n  httpStatus_d between (300 .. 399), \"3XX\",\n  httpStatus_d between (400 .. 499), \"4XX\",\n  \"5XX\")\n| summarize count() by HTTPStatus, bin(TimeGenerated, 5m)\n| render areachart with (xtitle = \"time\", ytitle= \"count\")\n",
                "SpecificChart": "StackedArea",
                "PartTitle": "Response Codes (5m)",
                "Dimensions": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "count_",
                      "type": "long"
                    }
                  ],
                  "splitBy": [
                    {
                      "name": "HTTPStatus",
                      "type": "string"
                    }
                  ],
                  "aggregation": "Sum"
                }
              }
            }
          }
        },
        "65": {
          "position": {
            "x": 12,
            "y": 84,
            "colSpan": 6,
            "rowSpan": 4
          },
          "metadata": {
            "inputs": [
              {
                "name": "resourceTypeMode",
                "isOptional": true
              },
              {
                "name": "ComponentId",
                "isOptional": true
              },
              {
                "name": "Scope",
                "value": {
                  "resourceIds": [
                    "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
                  ]
                },
                "isOptional": true
              },
              {
                "name": "PartId",
                "isOptional": true
              },
              {
                "name": "Version",
                "value": "2.0",
                "isOptional": true
              },
              {
                "name": "TimeRange",
                "value": "PT4H",
                "isOptional": true
              },
              {
                "name": "DashboardId",
                "isOptional": true
              },
              {
                "name": "DraftRequestParameters",
                "value": {
                  "scope": "hierarchy"
                },
                "isOptional": true
              },
              {
                "name": "Query",
                "value": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 1;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/user-data-processing\"\n| summarize\n    watermark=threshold,\n    percentiles(timeTaken_d, 95) by bin(TimeGenerated, 5m)\n\n| render timechart with (xtitle = \"time\", ytitle= \"response time(s)\")\n\n",
                "isOptional": true
              },
              {
                "name": "ControlType",
                "value": "FrameControlChart",
                "isOptional": true
              },
              {
                "name": "SpecificChart",
                "value": "StackedColumn",
                "isOptional": true
              },
              {
                "name": "PartTitle",
                "value": "Percentile Response Time (5m)",
                "isOptional": true
              },
              {
                "name": "PartSubTitle",
                "value": "/api/v1/user-data-processing",
                "isOptional": true
              },
              {
                "name": "Dimensions",
                "value": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "percentile_timeTaken_d_95",
                      "type": "real"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                },
                "isOptional": true
              },
              {
                "name": "LegendOptions",
                "value": {
                  "isEnabled": true,
                  "position": "Bottom"
                },
                "isOptional": true
              },
              {
                "name": "IsQueryContainTimeRange",
                "value": false,
                "isOptional": true
              }
            ],
            "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart",
            "settings": {
              "content": {
                "Query": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 1;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/user-data-processing\"\n| summarize\n    watermark=threshold,\n    percentiles(timeTaken_d, 95) by bin(TimeGenerated, 5m)\n\n| render timechart with (xtitle = \"time\", ytitle= \"response time(s)\")\n\n",
                "SpecificChart": "Line",
                "PartTitle": "Percentile Response Time (5m)",
                "Dimensions": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "watermark",
                      "type": "long"
                    },
                    {
                      "name": "percentile_timeTaken_d_95",
                      "type": "real"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                }
              }
            }
          }
        },
        "66": {
          "position": {
            "x": 0,
            "y": 88,
            "colSpan": 6,
            "rowSpan": 4
          },
          "metadata": {
            "inputs": [
              {
                "name": "resourceTypeMode",
                "isOptional": true
              },
              {
                "name": "ComponentId",
                "isOptional": true
              },
              {
                "name": "Scope",
                "value": {
                  "resourceIds": [
                    "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
                  ]
                },
                "isOptional": true
              },
              {
                "name": "PartId",
                "isOptional": true
              },
              {
                "name": "Version",
                "value": "2.0",
                "isOptional": true
              },
              {
                "name": "TimeRange",
                "value": "PT4H",
                "isOptional": true
              },
              {
                "name": "DashboardId",
                "isOptional": true
              },
              {
                "name": "DraftRequestParameters",
                "value": {
                  "scope": "hierarchy"
                },
                "isOptional": true
              },
              {
                "name": "Query",
                "value": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 0.99;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/user-data-processing/[^/]+\"\n| summarize\n  Total=count(),\n  Success=count(httpStatus_d < 500) by bin(TimeGenerated, 5m)\n| extend availability=toreal(Success) / Total\n\n| project TimeGenerated, availability, watermark=threshold\n| render timechart with (xtitle = \"time\", ytitle= \"availability(%)\")\n\n",
                "isOptional": true
              },
              {
                "name": "ControlType",
                "value": "FrameControlChart",
                "isOptional": true
              },
              {
                "name": "SpecificChart",
                "value": "Line",
                "isOptional": true
              },
              {
                "name": "PartTitle",
                "value": "Availability (5m)",
                "isOptional": true
              },
              {
                "name": "PartSubTitle",
                "value": "/api/v1/user-data-processing/{choice}",
                "isOptional": true
              },
              {
                "name": "Dimensions",
                "value": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "availability",
                      "type": "real"
                    },
                    {
                      "name": "watermark",
                      "type": "real"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                },
                "isOptional": true
              },
              {
                "name": "LegendOptions",
                "value": {
                  "isEnabled": true,
                  "position": "Bottom"
                },
                "isOptional": true
              },
              {
                "name": "IsQueryContainTimeRange",
                "value": false,
                "isOptional": true
              }
            ],
            "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart",
            "settings": {
              "content": {
                "Query": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 0.99;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/user-data-processing/[^/]+\"\n| summarize\n  Total=count(),\n  Success=count(httpStatus_d < 500) by bin(TimeGenerated, 5m)\n| extend availability=toreal(Success) / Total\n\n| project TimeGenerated, availability, watermark=threshold\n| render timechart with (xtitle = \"time\", ytitle= \"availability(%)\")\n\n",
                "PartTitle": "Availability (5m)"
              }
            }
          }
        },
        "67": {
          "position": {
            "x": 6,
            "y": 88,
            "colSpan": 6,
            "rowSpan": 4
          },
          "metadata": {
            "inputs": [
              {
                "name": "resourceTypeMode",
                "isOptional": true
              },
              {
                "name": "ComponentId",
                "isOptional": true
              },
              {
                "name": "Scope",
                "value": {
                  "resourceIds": [
                    "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
                  ]
                },
                "isOptional": true
              },
              {
                "name": "PartId",
                "isOptional": true
              },
              {
                "name": "Version",
                "value": "2.0",
                "isOptional": true
              },
              {
                "name": "TimeRange",
                "value": "PT4H",
                "isOptional": true
              },
              {
                "name": "DashboardId",
                "isOptional": true
              },
              {
                "name": "DraftRequestParameters",
                "value": {
                  "scope": "hierarchy"
                },
                "isOptional": true
              },
              {
                "name": "Query",
                "value": "\nlet api_url = \"/api/v1/user-data-processing/[^/]+\";\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex api_url\n| extend HTTPStatus = case(\n  httpStatus_d between (100 .. 199), \"1XX\",\n  httpStatus_d between (200 .. 299), \"2XX\",\n  httpStatus_d between (300 .. 399), \"3XX\",\n  httpStatus_d between (400 .. 499), \"4XX\",\n  \"5XX\")\n| summarize count() by HTTPStatus, bin(TimeGenerated, 5m)\n| render areachart with (xtitle = \"time\", ytitle= \"count\")\n",
                "isOptional": true
              },
              {
                "name": "ControlType",
                "value": "FrameControlChart",
                "isOptional": true
              },
              {
                "name": "SpecificChart",
                "value": "Pie",
                "isOptional": true
              },
              {
                "name": "PartTitle",
                "value": "Response Codes (5m)",
                "isOptional": true
              },
              {
                "name": "PartSubTitle",
                "value": "/api/v1/user-data-processing/{choice}",
                "isOptional": true
              },
              {
                "name": "Dimensions",
                "value": {
                  "xAxis": {
                    "name": "httpStatus_d",
                    "type": "string"
                  },
                  "yAxis": [
                    {
                      "name": "count_",
                      "type": "long"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                },
                "isOptional": true
              },
              {
                "name": "LegendOptions",
                "value": {
                  "isEnabled": true,
                  "position": "Bottom"
                },
                "isOptional": true
              },
              {
                "name": "IsQueryContainTimeRange",
                "value": false,
                "isOptional": true
              }
            ],
            "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart",
            "settings": {
              "content": {
                "Query": "\nlet api_url = \"/api/v1/user-data-processing/[^/]+\";\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex api_url\n| extend HTTPStatus = case(\n  httpStatus_d between (100 .. 199), \"1XX\",\n  httpStatus_d between (200 .. 299), \"2XX\",\n  httpStatus_d between (300 .. 399), \"3XX\",\n  httpStatus_d between (400 .. 499), \"4XX\",\n  \"5XX\")\n| summarize count() by HTTPStatus, bin(TimeGenerated, 5m)\n| render areachart with (xtitle = \"time\", ytitle= \"count\")\n",
                "SpecificChart": "StackedArea",
                "PartTitle": "Response Codes (5m)",
                "Dimensions": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "count_",
                      "type": "long"
                    }
                  ],
                  "splitBy": [
                    {
                      "name": "HTTPStatus",
                      "type": "string"
                    }
                  ],
                  "aggregation": "Sum"
                }
              }
            }
          }
        },
        "68": {
          "position": {
            "x": 12,
            "y": 88,
            "colSpan": 6,
            "rowSpan": 4
          },
          "metadata": {
            "inputs": [
              {
                "name": "resourceTypeMode",
                "isOptional": true
              },
              {
                "name": "ComponentId",
                "isOptional": true
              },
              {
                "name": "Scope",
                "value": {
                  "resourceIds": [
                    "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
                  ]
                },
                "isOptional": true
              },
              {
                "name": "PartId",
                "isOptional": true
              },
              {
                "name": "Version",
                "value": "2.0",
                "isOptional": true
              },
              {
                "name": "TimeRange",
                "value": "PT4H",
                "isOptional": true
              },
              {
                "name": "DashboardId",
                "isOptional": true
              },
              {
                "name": "DraftRequestParameters",
                "value": {
                  "scope": "hierarchy"
                },
                "isOptional": true
              },
              {
                "name": "Query",
                "value": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 1;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/user-data-processing/[^/]+\"\n| summarize\n    watermark=threshold,\n    percentiles(timeTaken_d, 95) by bin(TimeGenerated, 5m)\n\n| render timechart with (xtitle = \"time\", ytitle= \"response time(s)\")\n\n",
                "isOptional": true
              },
              {
                "name": "ControlType",
                "value": "FrameControlChart",
                "isOptional": true
              },
              {
                "name": "SpecificChart",
                "value": "StackedColumn",
                "isOptional": true
              },
              {
                "name": "PartTitle",
                "value": "Percentile Response Time (5m)",
                "isOptional": true
              },
              {
                "name": "PartSubTitle",
                "value": "/api/v1/user-data-processing/{choice}",
                "isOptional": true
              },
              {
                "name": "Dimensions",
                "value": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "percentile_timeTaken_d_95",
                      "type": "real"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                },
                "isOptional": true
              },
              {
                "name": "LegendOptions",
                "value": {
                  "isEnabled": true,
                  "position": "Bottom"
                },
                "isOptional": true
              },
              {
                "name": "IsQueryContainTimeRange",
                "value": false,
                "isOptional": true
              }
            ],
            "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart",
            "settings": {
              "content": {
                "Query": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 1;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/user-data-processing/[^/]+\"\n| summarize\n    watermark=threshold,\n    percentiles(timeTaken_d, 95) by bin(TimeGenerated, 5m)\n\n| render timechart with (xtitle = \"time\", ytitle= \"response time(s)\")\n\n",
                "SpecificChart": "Line",
                "PartTitle": "Percentile Response Time (5m)",
                "Dimensions": {
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "watermark",
                      "type": "long"
                    },
                    {
                      "name": "percentile_timeTaken_d_95",
                      "type": "real"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                }
              }
            }
          }
        }
      }
    }
  },
  "metadata": {
    "model": {
      "timeRange": {
        "value": {
          "relative": {
            "duration": 24,
            "timeUnit": 1
          }
        },
        "type": "MsPortalFx.Composition.Configuration.ValueTypes.TimeRange"
      },
      "filterLocale": {
        "value": "en-us"
      },
      "filters": {
        "value": {
          "MsPortalFx_TimeRange": {
            "model": {
              "format": "local",
              "granularity": "auto",
              "relative": "48h"
            },
            "displayCache": {
              "name": "Local Time",
              "value": "Past 48 hours"
            },
            "filteredPartIds": [
              "StartboardPart-LogsDashboardPart-9badbd78-7607-4131-8fa1-8b85191432ed",
              "StartboardPart-LogsDashboardPart-9badbd78-7607-4131-8fa1-8b85191432ef",
              "StartboardPart-LogsDashboardPart-9badbd78-7607-4131-8fa1-8b85191432f1",
              "StartboardPart-LogsDashboardPart-9badbd78-7607-4131-8fa1-8b85191432f3",
              "StartboardPart-LogsDashboardPart-9badbd78-7607-4131-8fa1-8b85191432f5",
              "StartboardPart-LogsDashboardPart-9badbd78-7607-4131-8fa1-8b85191432f7",
              "StartboardPart-LogsDashboardPart-9badbd78-7607-4131-8fa1-8b85191432f9",
              "StartboardPart-LogsDashboardPart-9badbd78-7607-4131-8fa1-8b85191432fb",
              "StartboardPart-LogsDashboardPart-9badbd78-7607-4131-8fa1-8b85191432fd"
            ]
          }
        }
      }
    }
  }
}
  PROPS

  tags = var.tags
}


resource "azurerm_monitor_scheduled_query_rules_alert" "alarm_availability_0" {
  name                = replace(join("_",split("/", "${local.name}-availability @ /api/v1/services/{service_id}")), "/\\{|\\}/", "")
  resource_group_name = data.azurerm_resource_group.this.name
  location            = data.azurerm_resource_group.this.location

  action {
    action_group = ["/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/SlackPagoPA", "/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/EmailPagoPA"]
  }

  data_source_id          = "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
  description             = "Availability for /api/v1/services/{service_id} is less than or equal to 99% - ${local.dashboard_base_addr}${azurerm_portal_dashboard.this.id}"
  enabled                 = true
  auto_mitigation_enabled = false

  query = <<-QUERY
    
let api_hosts = datatable (name: string) ["app-backend.io.italia.it", "api-app.io.pagopa.it"];
let threshold = 0.99;
AzureDiagnostics
| where originalHost_s in (api_hosts)
| where requestUri_s matches regex "/api/v1/services/[^/]+"
| summarize
  Total=count(),
  Success=count(httpStatus_d < 500) by bin(TimeGenerated, 5m)
| extend availability=toreal(Success) / Total

| where availability < threshold


  QUERY

  severity    = 1
  frequency   = 10
  time_window = 20
  trigger {
    operator  = "GreaterThanOrEqual"
    threshold = 1
  }

  tags = var.tags
}

resource "azurerm_monitor_scheduled_query_rules_alert" "alarm_time_0" {
  name                = replace(join("_",split("/", "${local.name}-responsetime @ /api/v1/services/{service_id}")), "/\\{|\\}/", "")
  resource_group_name = data.azurerm_resource_group.this.name
  location            = data.azurerm_resource_group.this.location

  action {
    action_group = ["/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/SlackPagoPA", "/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/EmailPagoPA"]
  }

  data_source_id          = "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
  description             = "Response time for /api/v1/services/{service_id} is less than or equal to 1s - ${local.dashboard_base_addr}${azurerm_portal_dashboard.this.id}"
  enabled                 = true
  auto_mitigation_enabled = false

  query = <<-QUERY
    
let api_hosts = datatable (name: string) ["app-backend.io.italia.it", "api-app.io.pagopa.it"];
let threshold = 1;
AzureDiagnostics
| where originalHost_s in (api_hosts)
| where requestUri_s matches regex "/api/v1/services/[^/]+"
| summarize
    watermark=threshold,
    percentiles(timeTaken_d, 95) by bin(TimeGenerated, 5m)

| where percentile_timeTaken_d_95 > threshold


  QUERY

  severity    = 1
  frequency   = 10
  time_window = 20
  trigger {
    operator  = "GreaterThanOrEqual"
    threshold = 1
  }

  tags = var.tags
}

resource "azurerm_monitor_scheduled_query_rules_alert" "alarm_availability_1" {
  name                = replace(join("_",split("/", "${local.name}-availability @ /api/v1/services/{service_id}/preferences")), "/\\{|\\}/", "")
  resource_group_name = data.azurerm_resource_group.this.name
  location            = data.azurerm_resource_group.this.location

  action {
    action_group = ["/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/SlackPagoPA", "/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/EmailPagoPA"]
  }

  data_source_id          = "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
  description             = "Availability for /api/v1/services/{service_id}/preferences is less than or equal to 99% - ${local.dashboard_base_addr}${azurerm_portal_dashboard.this.id}"
  enabled                 = true
  auto_mitigation_enabled = false

  query = <<-QUERY
    
let api_hosts = datatable (name: string) ["app-backend.io.italia.it", "api-app.io.pagopa.it"];
let threshold = 0.99;
AzureDiagnostics
| where originalHost_s in (api_hosts)
| where requestUri_s matches regex "/api/v1/services/[^/]+/preferences"
| summarize
  Total=count(),
  Success=count(httpStatus_d < 500) by bin(TimeGenerated, 5m)
| extend availability=toreal(Success) / Total

| where availability < threshold


  QUERY

  severity    = 1
  frequency   = 10
  time_window = 20
  trigger {
    operator  = "GreaterThanOrEqual"
    threshold = 1
  }

  tags = var.tags
}

resource "azurerm_monitor_scheduled_query_rules_alert" "alarm_time_1" {
  name                = replace(join("_",split("/", "${local.name}-responsetime @ /api/v1/services/{service_id}/preferences")), "/\\{|\\}/", "")
  resource_group_name = data.azurerm_resource_group.this.name
  location            = data.azurerm_resource_group.this.location

  action {
    action_group = ["/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/SlackPagoPA", "/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/EmailPagoPA"]
  }

  data_source_id          = "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
  description             = "Response time for /api/v1/services/{service_id}/preferences is less than or equal to 1s - ${local.dashboard_base_addr}${azurerm_portal_dashboard.this.id}"
  enabled                 = true
  auto_mitigation_enabled = false

  query = <<-QUERY
    
let api_hosts = datatable (name: string) ["app-backend.io.italia.it", "api-app.io.pagopa.it"];
let threshold = 1;
AzureDiagnostics
| where originalHost_s in (api_hosts)
| where requestUri_s matches regex "/api/v1/services/[^/]+/preferences"
| summarize
    watermark=threshold,
    percentiles(timeTaken_d, 95) by bin(TimeGenerated, 5m)

| where percentile_timeTaken_d_95 > threshold


  QUERY

  severity    = 1
  frequency   = 10
  time_window = 20
  trigger {
    operator  = "GreaterThanOrEqual"
    threshold = 1
  }

  tags = var.tags
}

resource "azurerm_monitor_scheduled_query_rules_alert" "alarm_availability_2" {
  name                = replace(join("_",split("/", "${local.name}-availability @ /api/v1/services")), "/\\{|\\}/", "")
  resource_group_name = data.azurerm_resource_group.this.name
  location            = data.azurerm_resource_group.this.location

  action {
    action_group = ["/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/SlackPagoPA", "/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/EmailPagoPA"]
  }

  data_source_id          = "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
  description             = "Availability for /api/v1/services is less than or equal to 99% - ${local.dashboard_base_addr}${azurerm_portal_dashboard.this.id}"
  enabled                 = true
  auto_mitigation_enabled = false

  query = <<-QUERY
    
let api_hosts = datatable (name: string) ["app-backend.io.italia.it", "api-app.io.pagopa.it"];
let threshold = 0.99;
AzureDiagnostics
| where originalHost_s in (api_hosts)
| where requestUri_s matches regex "/api/v1/services"
| summarize
  Total=count(),
  Success=count(httpStatus_d < 500) by bin(TimeGenerated, 5m)
| extend availability=toreal(Success) / Total

| where availability < threshold


  QUERY

  severity    = 1
  frequency   = 10
  time_window = 20
  trigger {
    operator  = "GreaterThanOrEqual"
    threshold = 1
  }

  tags = var.tags
}

resource "azurerm_monitor_scheduled_query_rules_alert" "alarm_time_2" {
  name                = replace(join("_",split("/", "${local.name}-responsetime @ /api/v1/services")), "/\\{|\\}/", "")
  resource_group_name = data.azurerm_resource_group.this.name
  location            = data.azurerm_resource_group.this.location

  action {
    action_group = ["/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/SlackPagoPA", "/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/EmailPagoPA"]
  }

  data_source_id          = "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
  description             = "Response time for /api/v1/services is less than or equal to 1s - ${local.dashboard_base_addr}${azurerm_portal_dashboard.this.id}"
  enabled                 = true
  auto_mitigation_enabled = false

  query = <<-QUERY
    
let api_hosts = datatable (name: string) ["app-backend.io.italia.it", "api-app.io.pagopa.it"];
let threshold = 1;
AzureDiagnostics
| where originalHost_s in (api_hosts)
| where requestUri_s matches regex "/api/v1/services"
| summarize
    watermark=threshold,
    percentiles(timeTaken_d, 95) by bin(TimeGenerated, 5m)

| where percentile_timeTaken_d_95 > threshold


  QUERY

  severity    = 1
  frequency   = 10
  time_window = 20
  trigger {
    operator  = "GreaterThanOrEqual"
    threshold = 1
  }

  tags = var.tags
}

resource "azurerm_monitor_scheduled_query_rules_alert" "alarm_availability_3" {
  name                = replace(join("_",split("/", "${local.name}-availability @ /api/v1/messages")), "/\\{|\\}/", "")
  resource_group_name = data.azurerm_resource_group.this.name
  location            = data.azurerm_resource_group.this.location

  action {
    action_group = ["/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/SlackPagoPA", "/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/EmailPagoPA"]
  }

  data_source_id          = "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
  description             = "Availability for /api/v1/messages is less than or equal to 99% - ${local.dashboard_base_addr}${azurerm_portal_dashboard.this.id}"
  enabled                 = true
  auto_mitigation_enabled = false

  query = <<-QUERY
    
let api_hosts = datatable (name: string) ["app-backend.io.italia.it", "api-app.io.pagopa.it"];
let threshold = 0.99;
AzureDiagnostics
| where originalHost_s in (api_hosts)
| where requestUri_s matches regex "/api/v1/messages"
| summarize
  Total=count(),
  Success=count(httpStatus_d < 500) by bin(TimeGenerated, 5m)
| extend availability=toreal(Success) / Total

| where availability < threshold


  QUERY

  severity    = 1
  frequency   = 10
  time_window = 20
  trigger {
    operator  = "GreaterThanOrEqual"
    threshold = 1
  }

  tags = var.tags
}

resource "azurerm_monitor_scheduled_query_rules_alert" "alarm_time_3" {
  name                = replace(join("_",split("/", "${local.name}-responsetime @ /api/v1/messages")), "/\\{|\\}/", "")
  resource_group_name = data.azurerm_resource_group.this.name
  location            = data.azurerm_resource_group.this.location

  action {
    action_group = ["/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/SlackPagoPA", "/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/EmailPagoPA"]
  }

  data_source_id          = "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
  description             = "Response time for /api/v1/messages is less than or equal to 1s - ${local.dashboard_base_addr}${azurerm_portal_dashboard.this.id}"
  enabled                 = true
  auto_mitigation_enabled = false

  query = <<-QUERY
    
let api_hosts = datatable (name: string) ["app-backend.io.italia.it", "api-app.io.pagopa.it"];
let threshold = 1;
AzureDiagnostics
| where originalHost_s in (api_hosts)
| where requestUri_s matches regex "/api/v1/messages"
| summarize
    watermark=threshold,
    percentiles(timeTaken_d, 95) by bin(TimeGenerated, 5m)

| where percentile_timeTaken_d_95 > threshold


  QUERY

  severity    = 1
  frequency   = 10
  time_window = 20
  trigger {
    operator  = "GreaterThanOrEqual"
    threshold = 1
  }

  tags = var.tags
}

resource "azurerm_monitor_scheduled_query_rules_alert" "alarm_availability_4" {
  name                = replace(join("_",split("/", "${local.name}-availability @ /api/v1/messages/{id}")), "/\\{|\\}/", "")
  resource_group_name = data.azurerm_resource_group.this.name
  location            = data.azurerm_resource_group.this.location

  action {
    action_group = ["/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/SlackPagoPA", "/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/EmailPagoPA"]
  }

  data_source_id          = "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
  description             = "Availability for /api/v1/messages/{id} is less than or equal to 99% - ${local.dashboard_base_addr}${azurerm_portal_dashboard.this.id}"
  enabled                 = true
  auto_mitigation_enabled = false

  query = <<-QUERY
    
let api_hosts = datatable (name: string) ["app-backend.io.italia.it", "api-app.io.pagopa.it"];
let threshold = 0.99;
AzureDiagnostics
| where originalHost_s in (api_hosts)
| where requestUri_s matches regex "/api/v1/messages/[^/]+"
| summarize
  Total=count(),
  Success=count(httpStatus_d < 500) by bin(TimeGenerated, 5m)
| extend availability=toreal(Success) / Total

| where availability < threshold


  QUERY

  severity    = 1
  frequency   = 10
  time_window = 20
  trigger {
    operator  = "GreaterThanOrEqual"
    threshold = 1
  }

  tags = var.tags
}

resource "azurerm_monitor_scheduled_query_rules_alert" "alarm_time_4" {
  name                = replace(join("_",split("/", "${local.name}-responsetime @ /api/v1/messages/{id}")), "/\\{|\\}/", "")
  resource_group_name = data.azurerm_resource_group.this.name
  location            = data.azurerm_resource_group.this.location

  action {
    action_group = ["/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/SlackPagoPA", "/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/EmailPagoPA"]
  }

  data_source_id          = "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
  description             = "Response time for /api/v1/messages/{id} is less than or equal to 1s - ${local.dashboard_base_addr}${azurerm_portal_dashboard.this.id}"
  enabled                 = true
  auto_mitigation_enabled = false

  query = <<-QUERY
    
let api_hosts = datatable (name: string) ["app-backend.io.italia.it", "api-app.io.pagopa.it"];
let threshold = 1;
AzureDiagnostics
| where originalHost_s in (api_hosts)
| where requestUri_s matches regex "/api/v1/messages/[^/]+"
| summarize
    watermark=threshold,
    percentiles(timeTaken_d, 95) by bin(TimeGenerated, 5m)

| where percentile_timeTaken_d_95 > threshold


  QUERY

  severity    = 1
  frequency   = 10
  time_window = 20
  trigger {
    operator  = "GreaterThanOrEqual"
    threshold = 1
  }

  tags = var.tags
}

resource "azurerm_monitor_scheduled_query_rules_alert" "alarm_availability_5" {
  name                = replace(join("_",split("/", "${local.name}-availability @ /api/v1/messages/{id}/message-status")), "/\\{|\\}/", "")
  resource_group_name = data.azurerm_resource_group.this.name
  location            = data.azurerm_resource_group.this.location

  action {
    action_group = ["/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/SlackPagoPA", "/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/EmailPagoPA"]
  }

  data_source_id          = "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
  description             = "Availability for /api/v1/messages/{id}/message-status is less than or equal to 99% - ${local.dashboard_base_addr}${azurerm_portal_dashboard.this.id}"
  enabled                 = true
  auto_mitigation_enabled = false

  query = <<-QUERY
    
let api_hosts = datatable (name: string) ["app-backend.io.italia.it", "api-app.io.pagopa.it"];
let threshold = 0.99;
AzureDiagnostics
| where originalHost_s in (api_hosts)
| where requestUri_s matches regex "/api/v1/messages/[^/]+/message-status"
| summarize
  Total=count(),
  Success=count(httpStatus_d < 500) by bin(TimeGenerated, 5m)
| extend availability=toreal(Success) / Total

| where availability < threshold


  QUERY

  severity    = 1
  frequency   = 10
  time_window = 20
  trigger {
    operator  = "GreaterThanOrEqual"
    threshold = 1
  }

  tags = var.tags
}

resource "azurerm_monitor_scheduled_query_rules_alert" "alarm_time_5" {
  name                = replace(join("_",split("/", "${local.name}-responsetime @ /api/v1/messages/{id}/message-status")), "/\\{|\\}/", "")
  resource_group_name = data.azurerm_resource_group.this.name
  location            = data.azurerm_resource_group.this.location

  action {
    action_group = ["/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/SlackPagoPA", "/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/EmailPagoPA"]
  }

  data_source_id          = "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
  description             = "Response time for /api/v1/messages/{id}/message-status is less than or equal to 1s - ${local.dashboard_base_addr}${azurerm_portal_dashboard.this.id}"
  enabled                 = true
  auto_mitigation_enabled = false

  query = <<-QUERY
    
let api_hosts = datatable (name: string) ["app-backend.io.italia.it", "api-app.io.pagopa.it"];
let threshold = 1;
AzureDiagnostics
| where originalHost_s in (api_hosts)
| where requestUri_s matches regex "/api/v1/messages/[^/]+/message-status"
| summarize
    watermark=threshold,
    percentiles(timeTaken_d, 95) by bin(TimeGenerated, 5m)

| where percentile_timeTaken_d_95 > threshold


  QUERY

  severity    = 1
  frequency   = 10
  time_window = 20
  trigger {
    operator  = "GreaterThanOrEqual"
    threshold = 1
  }

  tags = var.tags
}

resource "azurerm_monitor_scheduled_query_rules_alert" "alarm_availability_6" {
  name                = replace(join("_",split("/", "${local.name}-availability @ /api/v1/legal-messages/{id}")), "/\\{|\\}/", "")
  resource_group_name = data.azurerm_resource_group.this.name
  location            = data.azurerm_resource_group.this.location

  action {
    action_group = ["/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/SlackPagoPA", "/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/EmailPagoPA"]
  }

  data_source_id          = "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
  description             = "Availability for /api/v1/legal-messages/{id} is less than or equal to 99% - ${local.dashboard_base_addr}${azurerm_portal_dashboard.this.id}"
  enabled                 = true
  auto_mitigation_enabled = false

  query = <<-QUERY
    
let api_hosts = datatable (name: string) ["app-backend.io.italia.it", "api-app.io.pagopa.it"];
let threshold = 0.99;
AzureDiagnostics
| where originalHost_s in (api_hosts)
| where requestUri_s matches regex "/api/v1/legal-messages/[^/]+"
| summarize
  Total=count(),
  Success=count(httpStatus_d < 500) by bin(TimeGenerated, 5m)
| extend availability=toreal(Success) / Total

| where availability < threshold


  QUERY

  severity    = 1
  frequency   = 10
  time_window = 20
  trigger {
    operator  = "GreaterThanOrEqual"
    threshold = 1
  }

  tags = var.tags
}

resource "azurerm_monitor_scheduled_query_rules_alert" "alarm_time_6" {
  name                = replace(join("_",split("/", "${local.name}-responsetime @ /api/v1/legal-messages/{id}")), "/\\{|\\}/", "")
  resource_group_name = data.azurerm_resource_group.this.name
  location            = data.azurerm_resource_group.this.location

  action {
    action_group = ["/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/SlackPagoPA", "/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/EmailPagoPA"]
  }

  data_source_id          = "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
  description             = "Response time for /api/v1/legal-messages/{id} is less than or equal to 1s - ${local.dashboard_base_addr}${azurerm_portal_dashboard.this.id}"
  enabled                 = true
  auto_mitigation_enabled = false

  query = <<-QUERY
    
let api_hosts = datatable (name: string) ["app-backend.io.italia.it", "api-app.io.pagopa.it"];
let threshold = 1;
AzureDiagnostics
| where originalHost_s in (api_hosts)
| where requestUri_s matches regex "/api/v1/legal-messages/[^/]+"
| summarize
    watermark=threshold,
    percentiles(timeTaken_d, 95) by bin(TimeGenerated, 5m)

| where percentile_timeTaken_d_95 > threshold


  QUERY

  severity    = 1
  frequency   = 10
  time_window = 20
  trigger {
    operator  = "GreaterThanOrEqual"
    threshold = 1
  }

  tags = var.tags
}

resource "azurerm_monitor_scheduled_query_rules_alert" "alarm_availability_7" {
  name                = replace(join("_",split("/", "${local.name}-availability @ /api/v1/legal-messages/{id}/attachments/{attachment_id}")), "/\\{|\\}/", "")
  resource_group_name = data.azurerm_resource_group.this.name
  location            = data.azurerm_resource_group.this.location

  action {
    action_group = ["/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/SlackPagoPA", "/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/EmailPagoPA"]
  }

  data_source_id          = "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
  description             = "Availability for /api/v1/legal-messages/{id}/attachments/{attachment_id} is less than or equal to 99% - ${local.dashboard_base_addr}${azurerm_portal_dashboard.this.id}"
  enabled                 = true
  auto_mitigation_enabled = false

  query = <<-QUERY
    
let api_hosts = datatable (name: string) ["app-backend.io.italia.it", "api-app.io.pagopa.it"];
let threshold = 0.99;
AzureDiagnostics
| where originalHost_s in (api_hosts)
| where requestUri_s matches regex "/api/v1/legal-messages/[^/]+/attachments/[^/]+"
| summarize
  Total=count(),
  Success=count(httpStatus_d < 500) by bin(TimeGenerated, 5m)
| extend availability=toreal(Success) / Total

| where availability < threshold


  QUERY

  severity    = 1
  frequency   = 10
  time_window = 20
  trigger {
    operator  = "GreaterThanOrEqual"
    threshold = 1
  }

  tags = var.tags
}

resource "azurerm_monitor_scheduled_query_rules_alert" "alarm_time_7" {
  name                = replace(join("_",split("/", "${local.name}-responsetime @ /api/v1/legal-messages/{id}/attachments/{attachment_id}")), "/\\{|\\}/", "")
  resource_group_name = data.azurerm_resource_group.this.name
  location            = data.azurerm_resource_group.this.location

  action {
    action_group = ["/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/SlackPagoPA", "/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/EmailPagoPA"]
  }

  data_source_id          = "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
  description             = "Response time for /api/v1/legal-messages/{id}/attachments/{attachment_id} is less than or equal to 1s - ${local.dashboard_base_addr}${azurerm_portal_dashboard.this.id}"
  enabled                 = true
  auto_mitigation_enabled = false

  query = <<-QUERY
    
let api_hosts = datatable (name: string) ["app-backend.io.italia.it", "api-app.io.pagopa.it"];
let threshold = 1;
AzureDiagnostics
| where originalHost_s in (api_hosts)
| where requestUri_s matches regex "/api/v1/legal-messages/[^/]+/attachments/[^/]+"
| summarize
    watermark=threshold,
    percentiles(timeTaken_d, 95) by bin(TimeGenerated, 5m)

| where percentile_timeTaken_d_95 > threshold


  QUERY

  severity    = 1
  frequency   = 10
  time_window = 20
  trigger {
    operator  = "GreaterThanOrEqual"
    threshold = 1
  }

  tags = var.tags
}

resource "azurerm_monitor_scheduled_query_rules_alert" "alarm_availability_8" {
  name                = replace(join("_",split("/", "${local.name}-availability @ /api/v1/third-party-messages/{id}")), "/\\{|\\}/", "")
  resource_group_name = data.azurerm_resource_group.this.name
  location            = data.azurerm_resource_group.this.location

  action {
    action_group = ["/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/SlackPagoPA", "/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/EmailPagoPA"]
  }

  data_source_id          = "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
  description             = "Availability for /api/v1/third-party-messages/{id} is less than or equal to 99% - ${local.dashboard_base_addr}${azurerm_portal_dashboard.this.id}"
  enabled                 = true
  auto_mitigation_enabled = false

  query = <<-QUERY
    
let api_hosts = datatable (name: string) ["app-backend.io.italia.it", "api-app.io.pagopa.it"];
let threshold = 0.99;
AzureDiagnostics
| where originalHost_s in (api_hosts)
| where requestUri_s matches regex "/api/v1/third-party-messages/[^/]+"
| summarize
  Total=count(),
  Success=count(httpStatus_d < 500) by bin(TimeGenerated, 5m)
| extend availability=toreal(Success) / Total

| where availability < threshold


  QUERY

  severity    = 1
  frequency   = 10
  time_window = 20
  trigger {
    operator  = "GreaterThanOrEqual"
    threshold = 1
  }

  tags = var.tags
}

resource "azurerm_monitor_scheduled_query_rules_alert" "alarm_time_8" {
  name                = replace(join("_",split("/", "${local.name}-responsetime @ /api/v1/third-party-messages/{id}")), "/\\{|\\}/", "")
  resource_group_name = data.azurerm_resource_group.this.name
  location            = data.azurerm_resource_group.this.location

  action {
    action_group = ["/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/SlackPagoPA", "/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/EmailPagoPA"]
  }

  data_source_id          = "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
  description             = "Response time for /api/v1/third-party-messages/{id} is less than or equal to 1s - ${local.dashboard_base_addr}${azurerm_portal_dashboard.this.id}"
  enabled                 = true
  auto_mitigation_enabled = false

  query = <<-QUERY
    
let api_hosts = datatable (name: string) ["app-backend.io.italia.it", "api-app.io.pagopa.it"];
let threshold = 1;
AzureDiagnostics
| where originalHost_s in (api_hosts)
| where requestUri_s matches regex "/api/v1/third-party-messages/[^/]+"
| summarize
    watermark=threshold,
    percentiles(timeTaken_d, 95) by bin(TimeGenerated, 5m)

| where percentile_timeTaken_d_95 > threshold


  QUERY

  severity    = 1
  frequency   = 10
  time_window = 20
  trigger {
    operator  = "GreaterThanOrEqual"
    threshold = 1
  }

  tags = var.tags
}

resource "azurerm_monitor_scheduled_query_rules_alert" "alarm_availability_9" {
  name                = replace(join("_",split("/", "${local.name}-availability @ /api/v1/third-party-messages/{id}/attachments/{attachment_url}")), "/\\{|\\}/", "")
  resource_group_name = data.azurerm_resource_group.this.name
  location            = data.azurerm_resource_group.this.location

  action {
    action_group = ["/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/SlackPagoPA", "/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/EmailPagoPA"]
  }

  data_source_id          = "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
  description             = "Availability for /api/v1/third-party-messages/{id}/attachments/{attachment_url} is less than or equal to 99% - ${local.dashboard_base_addr}${azurerm_portal_dashboard.this.id}"
  enabled                 = true
  auto_mitigation_enabled = false

  query = <<-QUERY
    
let api_hosts = datatable (name: string) ["app-backend.io.italia.it", "api-app.io.pagopa.it"];
let threshold = 0.99;
AzureDiagnostics
| where originalHost_s in (api_hosts)
| where requestUri_s matches regex "/api/v1/third-party-messages/[^/]+/attachments/[^/]+"
| summarize
  Total=count(),
  Success=count(httpStatus_d < 500) by bin(TimeGenerated, 5m)
| extend availability=toreal(Success) / Total

| where availability < threshold


  QUERY

  severity    = 1
  frequency   = 10
  time_window = 20
  trigger {
    operator  = "GreaterThanOrEqual"
    threshold = 1
  }

  tags = var.tags
}

resource "azurerm_monitor_scheduled_query_rules_alert" "alarm_time_9" {
  name                = replace(join("_",split("/", "${local.name}-responsetime @ /api/v1/third-party-messages/{id}/attachments/{attachment_url}")), "/\\{|\\}/", "")
  resource_group_name = data.azurerm_resource_group.this.name
  location            = data.azurerm_resource_group.this.location

  action {
    action_group = ["/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/SlackPagoPA", "/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/EmailPagoPA"]
  }

  data_source_id          = "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
  description             = "Response time for /api/v1/third-party-messages/{id}/attachments/{attachment_url} is less than or equal to 1s - ${local.dashboard_base_addr}${azurerm_portal_dashboard.this.id}"
  enabled                 = true
  auto_mitigation_enabled = false

  query = <<-QUERY
    
let api_hosts = datatable (name: string) ["app-backend.io.italia.it", "api-app.io.pagopa.it"];
let threshold = 1;
AzureDiagnostics
| where originalHost_s in (api_hosts)
| where requestUri_s matches regex "/api/v1/third-party-messages/[^/]+/attachments/[^/]+"
| summarize
    watermark=threshold,
    percentiles(timeTaken_d, 95) by bin(TimeGenerated, 5m)

| where percentile_timeTaken_d_95 > threshold


  QUERY

  severity    = 1
  frequency   = 10
  time_window = 20
  trigger {
    operator  = "GreaterThanOrEqual"
    threshold = 1
  }

  tags = var.tags
}

resource "azurerm_monitor_scheduled_query_rules_alert" "alarm_availability_10" {
  name                = replace(join("_",split("/", "${local.name}-availability @ /api/v1/profile")), "/\\{|\\}/", "")
  resource_group_name = data.azurerm_resource_group.this.name
  location            = data.azurerm_resource_group.this.location

  action {
    action_group = ["/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/SlackPagoPA", "/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/EmailPagoPA"]
  }

  data_source_id          = "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
  description             = "Availability for /api/v1/profile is less than or equal to 99% - ${local.dashboard_base_addr}${azurerm_portal_dashboard.this.id}"
  enabled                 = true
  auto_mitigation_enabled = false

  query = <<-QUERY
    
let api_hosts = datatable (name: string) ["app-backend.io.italia.it", "api-app.io.pagopa.it"];
let threshold = 0.99;
AzureDiagnostics
| where originalHost_s in (api_hosts)
| where requestUri_s matches regex "/api/v1/profile"
| summarize
  Total=count(),
  Success=count(httpStatus_d < 500) by bin(TimeGenerated, 5m)
| extend availability=toreal(Success) / Total

| where availability < threshold


  QUERY

  severity    = 1
  frequency   = 10
  time_window = 20
  trigger {
    operator  = "GreaterThanOrEqual"
    threshold = 1
  }

  tags = var.tags
}

resource "azurerm_monitor_scheduled_query_rules_alert" "alarm_time_10" {
  name                = replace(join("_",split("/", "${local.name}-responsetime @ /api/v1/profile")), "/\\{|\\}/", "")
  resource_group_name = data.azurerm_resource_group.this.name
  location            = data.azurerm_resource_group.this.location

  action {
    action_group = ["/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/SlackPagoPA", "/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/EmailPagoPA"]
  }

  data_source_id          = "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
  description             = "Response time for /api/v1/profile is less than or equal to 1s - ${local.dashboard_base_addr}${azurerm_portal_dashboard.this.id}"
  enabled                 = true
  auto_mitigation_enabled = false

  query = <<-QUERY
    
let api_hosts = datatable (name: string) ["app-backend.io.italia.it", "api-app.io.pagopa.it"];
let threshold = 1;
AzureDiagnostics
| where originalHost_s in (api_hosts)
| where requestUri_s matches regex "/api/v1/profile"
| summarize
    watermark=threshold,
    percentiles(timeTaken_d, 95) by bin(TimeGenerated, 5m)

| where percentile_timeTaken_d_95 > threshold


  QUERY

  severity    = 1
  frequency   = 10
  time_window = 20
  trigger {
    operator  = "GreaterThanOrEqual"
    threshold = 1
  }

  tags = var.tags
}

resource "azurerm_monitor_scheduled_query_rules_alert" "alarm_availability_11" {
  name                = replace(join("_",split("/", "${local.name}-availability @ /api/v1/api-profile")), "/\\{|\\}/", "")
  resource_group_name = data.azurerm_resource_group.this.name
  location            = data.azurerm_resource_group.this.location

  action {
    action_group = ["/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/SlackPagoPA", "/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/EmailPagoPA"]
  }

  data_source_id          = "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
  description             = "Availability for /api/v1/api-profile is less than or equal to 99% - ${local.dashboard_base_addr}${azurerm_portal_dashboard.this.id}"
  enabled                 = true
  auto_mitigation_enabled = false

  query = <<-QUERY
    
let api_hosts = datatable (name: string) ["app-backend.io.italia.it", "api-app.io.pagopa.it"];
let threshold = 0.99;
AzureDiagnostics
| where originalHost_s in (api_hosts)
| where requestUri_s matches regex "/api/v1/api-profile"
| summarize
  Total=count(),
  Success=count(httpStatus_d < 500) by bin(TimeGenerated, 5m)
| extend availability=toreal(Success) / Total

| where availability < threshold


  QUERY

  severity    = 1
  frequency   = 10
  time_window = 20
  trigger {
    operator  = "GreaterThanOrEqual"
    threshold = 1
  }

  tags = var.tags
}

resource "azurerm_monitor_scheduled_query_rules_alert" "alarm_time_11" {
  name                = replace(join("_",split("/", "${local.name}-responsetime @ /api/v1/api-profile")), "/\\{|\\}/", "")
  resource_group_name = data.azurerm_resource_group.this.name
  location            = data.azurerm_resource_group.this.location

  action {
    action_group = ["/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/SlackPagoPA", "/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/EmailPagoPA"]
  }

  data_source_id          = "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
  description             = "Response time for /api/v1/api-profile is less than or equal to 1s - ${local.dashboard_base_addr}${azurerm_portal_dashboard.this.id}"
  enabled                 = true
  auto_mitigation_enabled = false

  query = <<-QUERY
    
let api_hosts = datatable (name: string) ["app-backend.io.italia.it", "api-app.io.pagopa.it"];
let threshold = 1;
AzureDiagnostics
| where originalHost_s in (api_hosts)
| where requestUri_s matches regex "/api/v1/api-profile"
| summarize
    watermark=threshold,
    percentiles(timeTaken_d, 95) by bin(TimeGenerated, 5m)

| where percentile_timeTaken_d_95 > threshold


  QUERY

  severity    = 1
  frequency   = 10
  time_window = 20
  trigger {
    operator  = "GreaterThanOrEqual"
    threshold = 1
  }

  tags = var.tags
}

resource "azurerm_monitor_scheduled_query_rules_alert" "alarm_availability_12" {
  name                = replace(join("_",split("/", "${local.name}-availability @ /api/v1/email-validation-process")), "/\\{|\\}/", "")
  resource_group_name = data.azurerm_resource_group.this.name
  location            = data.azurerm_resource_group.this.location

  action {
    action_group = ["/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/SlackPagoPA", "/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/EmailPagoPA"]
  }

  data_source_id          = "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
  description             = "Availability for /api/v1/email-validation-process is less than or equal to 99% - ${local.dashboard_base_addr}${azurerm_portal_dashboard.this.id}"
  enabled                 = true
  auto_mitigation_enabled = false

  query = <<-QUERY
    
let api_hosts = datatable (name: string) ["app-backend.io.italia.it", "api-app.io.pagopa.it"];
let threshold = 0.99;
AzureDiagnostics
| where originalHost_s in (api_hosts)
| where requestUri_s matches regex "/api/v1/email-validation-process"
| summarize
  Total=count(),
  Success=count(httpStatus_d < 500) by bin(TimeGenerated, 5m)
| extend availability=toreal(Success) / Total

| where availability < threshold


  QUERY

  severity    = 1
  frequency   = 10
  time_window = 20
  trigger {
    operator  = "GreaterThanOrEqual"
    threshold = 1
  }

  tags = var.tags
}

resource "azurerm_monitor_scheduled_query_rules_alert" "alarm_time_12" {
  name                = replace(join("_",split("/", "${local.name}-responsetime @ /api/v1/email-validation-process")), "/\\{|\\}/", "")
  resource_group_name = data.azurerm_resource_group.this.name
  location            = data.azurerm_resource_group.this.location

  action {
    action_group = ["/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/SlackPagoPA", "/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/EmailPagoPA"]
  }

  data_source_id          = "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
  description             = "Response time for /api/v1/email-validation-process is less than or equal to 1s - ${local.dashboard_base_addr}${azurerm_portal_dashboard.this.id}"
  enabled                 = true
  auto_mitigation_enabled = false

  query = <<-QUERY
    
let api_hosts = datatable (name: string) ["app-backend.io.italia.it", "api-app.io.pagopa.it"];
let threshold = 1;
AzureDiagnostics
| where originalHost_s in (api_hosts)
| where requestUri_s matches regex "/api/v1/email-validation-process"
| summarize
    watermark=threshold,
    percentiles(timeTaken_d, 95) by bin(TimeGenerated, 5m)

| where percentile_timeTaken_d_95 > threshold


  QUERY

  severity    = 1
  frequency   = 10
  time_window = 20
  trigger {
    operator  = "GreaterThanOrEqual"
    threshold = 1
  }

  tags = var.tags
}

resource "azurerm_monitor_scheduled_query_rules_alert" "alarm_availability_13" {
  name                = replace(join("_",split("/", "${local.name}-availability @ /api/v1/user-metadata")), "/\\{|\\}/", "")
  resource_group_name = data.azurerm_resource_group.this.name
  location            = data.azurerm_resource_group.this.location

  action {
    action_group = ["/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/SlackPagoPA", "/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/EmailPagoPA"]
  }

  data_source_id          = "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
  description             = "Availability for /api/v1/user-metadata is less than or equal to 99% - ${local.dashboard_base_addr}${azurerm_portal_dashboard.this.id}"
  enabled                 = true
  auto_mitigation_enabled = false

  query = <<-QUERY
    
let api_hosts = datatable (name: string) ["app-backend.io.italia.it", "api-app.io.pagopa.it"];
let threshold = 0.99;
AzureDiagnostics
| where originalHost_s in (api_hosts)
| where requestUri_s matches regex "/api/v1/user-metadata"
| summarize
  Total=count(),
  Success=count(httpStatus_d < 500) by bin(TimeGenerated, 5m)
| extend availability=toreal(Success) / Total

| where availability < threshold


  QUERY

  severity    = 1
  frequency   = 10
  time_window = 20
  trigger {
    operator  = "GreaterThanOrEqual"
    threshold = 1
  }

  tags = var.tags
}

resource "azurerm_monitor_scheduled_query_rules_alert" "alarm_time_13" {
  name                = replace(join("_",split("/", "${local.name}-responsetime @ /api/v1/user-metadata")), "/\\{|\\}/", "")
  resource_group_name = data.azurerm_resource_group.this.name
  location            = data.azurerm_resource_group.this.location

  action {
    action_group = ["/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/SlackPagoPA", "/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/EmailPagoPA"]
  }

  data_source_id          = "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
  description             = "Response time for /api/v1/user-metadata is less than or equal to 1s - ${local.dashboard_base_addr}${azurerm_portal_dashboard.this.id}"
  enabled                 = true
  auto_mitigation_enabled = false

  query = <<-QUERY
    
let api_hosts = datatable (name: string) ["app-backend.io.italia.it", "api-app.io.pagopa.it"];
let threshold = 1;
AzureDiagnostics
| where originalHost_s in (api_hosts)
| where requestUri_s matches regex "/api/v1/user-metadata"
| summarize
    watermark=threshold,
    percentiles(timeTaken_d, 95) by bin(TimeGenerated, 5m)

| where percentile_timeTaken_d_95 > threshold


  QUERY

  severity    = 1
  frequency   = 10
  time_window = 20
  trigger {
    operator  = "GreaterThanOrEqual"
    threshold = 1
  }

  tags = var.tags
}

resource "azurerm_monitor_scheduled_query_rules_alert" "alarm_availability_14" {
  name                = replace(join("_",split("/", "${local.name}-availability @ /api/v1/installations/{installationID}")), "/\\{|\\}/", "")
  resource_group_name = data.azurerm_resource_group.this.name
  location            = data.azurerm_resource_group.this.location

  action {
    action_group = ["/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/SlackPagoPA", "/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/EmailPagoPA"]
  }

  data_source_id          = "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
  description             = "Availability for /api/v1/installations/{installationID} is less than or equal to 99% - ${local.dashboard_base_addr}${azurerm_portal_dashboard.this.id}"
  enabled                 = true
  auto_mitigation_enabled = false

  query = <<-QUERY
    
let api_hosts = datatable (name: string) ["app-backend.io.italia.it", "api-app.io.pagopa.it"];
let threshold = 0.99;
AzureDiagnostics
| where originalHost_s in (api_hosts)
| where requestUri_s matches regex "/api/v1/installations/[^/]+"
| summarize
  Total=count(),
  Success=count(httpStatus_d < 500) by bin(TimeGenerated, 5m)
| extend availability=toreal(Success) / Total

| where availability < threshold


  QUERY

  severity    = 1
  frequency   = 10
  time_window = 20
  trigger {
    operator  = "GreaterThanOrEqual"
    threshold = 1
  }

  tags = var.tags
}

resource "azurerm_monitor_scheduled_query_rules_alert" "alarm_time_14" {
  name                = replace(join("_",split("/", "${local.name}-responsetime @ /api/v1/installations/{installationID}")), "/\\{|\\}/", "")
  resource_group_name = data.azurerm_resource_group.this.name
  location            = data.azurerm_resource_group.this.location

  action {
    action_group = ["/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/SlackPagoPA", "/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/EmailPagoPA"]
  }

  data_source_id          = "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
  description             = "Response time for /api/v1/installations/{installationID} is less than or equal to 1s - ${local.dashboard_base_addr}${azurerm_portal_dashboard.this.id}"
  enabled                 = true
  auto_mitigation_enabled = false

  query = <<-QUERY
    
let api_hosts = datatable (name: string) ["app-backend.io.italia.it", "api-app.io.pagopa.it"];
let threshold = 1;
AzureDiagnostics
| where originalHost_s in (api_hosts)
| where requestUri_s matches regex "/api/v1/installations/[^/]+"
| summarize
    watermark=threshold,
    percentiles(timeTaken_d, 95) by bin(TimeGenerated, 5m)

| where percentile_timeTaken_d_95 > threshold


  QUERY

  severity    = 1
  frequency   = 10
  time_window = 20
  trigger {
    operator  = "GreaterThanOrEqual"
    threshold = 1
  }

  tags = var.tags
}

resource "azurerm_monitor_scheduled_query_rules_alert" "alarm_availability_15" {
  name                = replace(join("_",split("/", "${local.name}-availability @ /api/v1/session")), "/\\{|\\}/", "")
  resource_group_name = data.azurerm_resource_group.this.name
  location            = data.azurerm_resource_group.this.location

  action {
    action_group = ["/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/SlackPagoPA", "/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/EmailPagoPA"]
  }

  data_source_id          = "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
  description             = "Availability for /api/v1/session is less than or equal to 99% - ${local.dashboard_base_addr}${azurerm_portal_dashboard.this.id}"
  enabled                 = true
  auto_mitigation_enabled = false

  query = <<-QUERY
    
let api_hosts = datatable (name: string) ["app-backend.io.italia.it", "api-app.io.pagopa.it"];
let threshold = 0.99;
AzureDiagnostics
| where originalHost_s in (api_hosts)
| where requestUri_s matches regex "/api/v1/session"
| summarize
  Total=count(),
  Success=count(httpStatus_d < 500) by bin(TimeGenerated, 5m)
| extend availability=toreal(Success) / Total

| where availability < threshold


  QUERY

  severity    = 1
  frequency   = 10
  time_window = 20
  trigger {
    operator  = "GreaterThanOrEqual"
    threshold = 1
  }

  tags = var.tags
}

resource "azurerm_monitor_scheduled_query_rules_alert" "alarm_time_15" {
  name                = replace(join("_",split("/", "${local.name}-responsetime @ /api/v1/session")), "/\\{|\\}/", "")
  resource_group_name = data.azurerm_resource_group.this.name
  location            = data.azurerm_resource_group.this.location

  action {
    action_group = ["/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/SlackPagoPA", "/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/EmailPagoPA"]
  }

  data_source_id          = "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
  description             = "Response time for /api/v1/session is less than or equal to 1s - ${local.dashboard_base_addr}${azurerm_portal_dashboard.this.id}"
  enabled                 = true
  auto_mitigation_enabled = false

  query = <<-QUERY
    
let api_hosts = datatable (name: string) ["app-backend.io.italia.it", "api-app.io.pagopa.it"];
let threshold = 1;
AzureDiagnostics
| where originalHost_s in (api_hosts)
| where requestUri_s matches regex "/api/v1/session"
| summarize
    watermark=threshold,
    percentiles(timeTaken_d, 95) by bin(TimeGenerated, 5m)

| where percentile_timeTaken_d_95 > threshold


  QUERY

  severity    = 1
  frequency   = 10
  time_window = 20
  trigger {
    operator  = "GreaterThanOrEqual"
    threshold = 1
  }

  tags = var.tags
}

resource "azurerm_monitor_scheduled_query_rules_alert" "alarm_availability_16" {
  name                = replace(join("_",split("/", "${local.name}-availability @ /api/v1/sessions")), "/\\{|\\}/", "")
  resource_group_name = data.azurerm_resource_group.this.name
  location            = data.azurerm_resource_group.this.location

  action {
    action_group = ["/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/SlackPagoPA", "/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/EmailPagoPA"]
  }

  data_source_id          = "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
  description             = "Availability for /api/v1/sessions is less than or equal to 99% - ${local.dashboard_base_addr}${azurerm_portal_dashboard.this.id}"
  enabled                 = true
  auto_mitigation_enabled = false

  query = <<-QUERY
    
let api_hosts = datatable (name: string) ["app-backend.io.italia.it", "api-app.io.pagopa.it"];
let threshold = 0.99;
AzureDiagnostics
| where originalHost_s in (api_hosts)
| where requestUri_s matches regex "/api/v1/sessions"
| summarize
  Total=count(),
  Success=count(httpStatus_d < 500) by bin(TimeGenerated, 5m)
| extend availability=toreal(Success) / Total

| where availability < threshold


  QUERY

  severity    = 1
  frequency   = 10
  time_window = 20
  trigger {
    operator  = "GreaterThanOrEqual"
    threshold = 1
  }

  tags = var.tags
}

resource "azurerm_monitor_scheduled_query_rules_alert" "alarm_time_16" {
  name                = replace(join("_",split("/", "${local.name}-responsetime @ /api/v1/sessions")), "/\\{|\\}/", "")
  resource_group_name = data.azurerm_resource_group.this.name
  location            = data.azurerm_resource_group.this.location

  action {
    action_group = ["/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/SlackPagoPA", "/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/EmailPagoPA"]
  }

  data_source_id          = "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
  description             = "Response time for /api/v1/sessions is less than or equal to 1s - ${local.dashboard_base_addr}${azurerm_portal_dashboard.this.id}"
  enabled                 = true
  auto_mitigation_enabled = false

  query = <<-QUERY
    
let api_hosts = datatable (name: string) ["app-backend.io.italia.it", "api-app.io.pagopa.it"];
let threshold = 1;
AzureDiagnostics
| where originalHost_s in (api_hosts)
| where requestUri_s matches regex "/api/v1/sessions"
| summarize
    watermark=threshold,
    percentiles(timeTaken_d, 95) by bin(TimeGenerated, 5m)

| where percentile_timeTaken_d_95 > threshold


  QUERY

  severity    = 1
  frequency   = 10
  time_window = 20
  trigger {
    operator  = "GreaterThanOrEqual"
    threshold = 1
  }

  tags = var.tags
}

resource "azurerm_monitor_scheduled_query_rules_alert" "alarm_availability_17" {
  name                = replace(join("_",split("/", "${local.name}-availability @ /api/v1/token/support")), "/\\{|\\}/", "")
  resource_group_name = data.azurerm_resource_group.this.name
  location            = data.azurerm_resource_group.this.location

  action {
    action_group = ["/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/SlackPagoPA", "/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/EmailPagoPA"]
  }

  data_source_id          = "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
  description             = "Availability for /api/v1/token/support is less than or equal to 99% - ${local.dashboard_base_addr}${azurerm_portal_dashboard.this.id}"
  enabled                 = true
  auto_mitigation_enabled = false

  query = <<-QUERY
    
let api_hosts = datatable (name: string) ["app-backend.io.italia.it", "api-app.io.pagopa.it"];
let threshold = 0.99;
AzureDiagnostics
| where originalHost_s in (api_hosts)
| where requestUri_s matches regex "/api/v1/token/support"
| summarize
  Total=count(),
  Success=count(httpStatus_d < 500) by bin(TimeGenerated, 5m)
| extend availability=toreal(Success) / Total

| where availability < threshold


  QUERY

  severity    = 1
  frequency   = 10
  time_window = 20
  trigger {
    operator  = "GreaterThanOrEqual"
    threshold = 1
  }

  tags = var.tags
}

resource "azurerm_monitor_scheduled_query_rules_alert" "alarm_time_17" {
  name                = replace(join("_",split("/", "${local.name}-responsetime @ /api/v1/token/support")), "/\\{|\\}/", "")
  resource_group_name = data.azurerm_resource_group.this.name
  location            = data.azurerm_resource_group.this.location

  action {
    action_group = ["/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/SlackPagoPA", "/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/EmailPagoPA"]
  }

  data_source_id          = "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
  description             = "Response time for /api/v1/token/support is less than or equal to 1s - ${local.dashboard_base_addr}${azurerm_portal_dashboard.this.id}"
  enabled                 = true
  auto_mitigation_enabled = false

  query = <<-QUERY
    
let api_hosts = datatable (name: string) ["app-backend.io.italia.it", "api-app.io.pagopa.it"];
let threshold = 1;
AzureDiagnostics
| where originalHost_s in (api_hosts)
| where requestUri_s matches regex "/api/v1/token/support"
| summarize
    watermark=threshold,
    percentiles(timeTaken_d, 95) by bin(TimeGenerated, 5m)

| where percentile_timeTaken_d_95 > threshold


  QUERY

  severity    = 1
  frequency   = 10
  time_window = 20
  trigger {
    operator  = "GreaterThanOrEqual"
    threshold = 1
  }

  tags = var.tags
}

resource "azurerm_monitor_scheduled_query_rules_alert" "alarm_availability_18" {
  name                = replace(join("_",split("/", "${local.name}-availability @ /api/v1/payment-requests/{rptId}")), "/\\{|\\}/", "")
  resource_group_name = data.azurerm_resource_group.this.name
  location            = data.azurerm_resource_group.this.location

  action {
    action_group = ["/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/SlackPagoPA", "/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/EmailPagoPA"]
  }

  data_source_id          = "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
  description             = "Availability for /api/v1/payment-requests/{rptId} is less than or equal to 99% - ${local.dashboard_base_addr}${azurerm_portal_dashboard.this.id}"
  enabled                 = true
  auto_mitigation_enabled = false

  query = <<-QUERY
    
let api_hosts = datatable (name: string) ["app-backend.io.italia.it", "api-app.io.pagopa.it"];
let threshold = 0.99;
AzureDiagnostics
| where originalHost_s in (api_hosts)
| where requestUri_s matches regex "/api/v1/payment-requests/[^/]+"
| summarize
  Total=count(),
  Success=count(httpStatus_d < 500) by bin(TimeGenerated, 5m)
| extend availability=toreal(Success) / Total

| where availability < threshold


  QUERY

  severity    = 1
  frequency   = 10
  time_window = 20
  trigger {
    operator  = "GreaterThanOrEqual"
    threshold = 1
  }

  tags = var.tags
}

resource "azurerm_monitor_scheduled_query_rules_alert" "alarm_time_18" {
  name                = replace(join("_",split("/", "${local.name}-responsetime @ /api/v1/payment-requests/{rptId}")), "/\\{|\\}/", "")
  resource_group_name = data.azurerm_resource_group.this.name
  location            = data.azurerm_resource_group.this.location

  action {
    action_group = ["/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/SlackPagoPA", "/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/EmailPagoPA"]
  }

  data_source_id          = "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
  description             = "Response time for /api/v1/payment-requests/{rptId} is less than or equal to 1s - ${local.dashboard_base_addr}${azurerm_portal_dashboard.this.id}"
  enabled                 = true
  auto_mitigation_enabled = false

  query = <<-QUERY
    
let api_hosts = datatable (name: string) ["app-backend.io.italia.it", "api-app.io.pagopa.it"];
let threshold = 1;
AzureDiagnostics
| where originalHost_s in (api_hosts)
| where requestUri_s matches regex "/api/v1/payment-requests/[^/]+"
| summarize
    watermark=threshold,
    percentiles(timeTaken_d, 95) by bin(TimeGenerated, 5m)

| where percentile_timeTaken_d_95 > threshold


  QUERY

  severity    = 1
  frequency   = 10
  time_window = 20
  trigger {
    operator  = "GreaterThanOrEqual"
    threshold = 1
  }

  tags = var.tags
}

resource "azurerm_monitor_scheduled_query_rules_alert" "alarm_availability_19" {
  name                = replace(join("_",split("/", "${local.name}-availability @ /api/v1/payment-activations")), "/\\{|\\}/", "")
  resource_group_name = data.azurerm_resource_group.this.name
  location            = data.azurerm_resource_group.this.location

  action {
    action_group = ["/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/SlackPagoPA", "/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/EmailPagoPA"]
  }

  data_source_id          = "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
  description             = "Availability for /api/v1/payment-activations is less than or equal to 99% - ${local.dashboard_base_addr}${azurerm_portal_dashboard.this.id}"
  enabled                 = true
  auto_mitigation_enabled = false

  query = <<-QUERY
    
let api_hosts = datatable (name: string) ["app-backend.io.italia.it", "api-app.io.pagopa.it"];
let threshold = 0.99;
AzureDiagnostics
| where originalHost_s in (api_hosts)
| where requestUri_s matches regex "/api/v1/payment-activations"
| summarize
  Total=count(),
  Success=count(httpStatus_d < 500) by bin(TimeGenerated, 5m)
| extend availability=toreal(Success) / Total

| where availability < threshold


  QUERY

  severity    = 1
  frequency   = 10
  time_window = 20
  trigger {
    operator  = "GreaterThanOrEqual"
    threshold = 1
  }

  tags = var.tags
}

resource "azurerm_monitor_scheduled_query_rules_alert" "alarm_time_19" {
  name                = replace(join("_",split("/", "${local.name}-responsetime @ /api/v1/payment-activations")), "/\\{|\\}/", "")
  resource_group_name = data.azurerm_resource_group.this.name
  location            = data.azurerm_resource_group.this.location

  action {
    action_group = ["/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/SlackPagoPA", "/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/EmailPagoPA"]
  }

  data_source_id          = "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
  description             = "Response time for /api/v1/payment-activations is less than or equal to 1s - ${local.dashboard_base_addr}${azurerm_portal_dashboard.this.id}"
  enabled                 = true
  auto_mitigation_enabled = false

  query = <<-QUERY
    
let api_hosts = datatable (name: string) ["app-backend.io.italia.it", "api-app.io.pagopa.it"];
let threshold = 1;
AzureDiagnostics
| where originalHost_s in (api_hosts)
| where requestUri_s matches regex "/api/v1/payment-activations"
| summarize
    watermark=threshold,
    percentiles(timeTaken_d, 95) by bin(TimeGenerated, 5m)

| where percentile_timeTaken_d_95 > threshold


  QUERY

  severity    = 1
  frequency   = 10
  time_window = 20
  trigger {
    operator  = "GreaterThanOrEqual"
    threshold = 1
  }

  tags = var.tags
}

resource "azurerm_monitor_scheduled_query_rules_alert" "alarm_availability_20" {
  name                = replace(join("_",split("/", "${local.name}-availability @ /api/v1/payment-activations/{codiceContestoPagamento}")), "/\\{|\\}/", "")
  resource_group_name = data.azurerm_resource_group.this.name
  location            = data.azurerm_resource_group.this.location

  action {
    action_group = ["/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/SlackPagoPA", "/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/EmailPagoPA"]
  }

  data_source_id          = "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
  description             = "Availability for /api/v1/payment-activations/{codiceContestoPagamento} is less than or equal to 99% - ${local.dashboard_base_addr}${azurerm_portal_dashboard.this.id}"
  enabled                 = true
  auto_mitigation_enabled = false

  query = <<-QUERY
    
let api_hosts = datatable (name: string) ["app-backend.io.italia.it", "api-app.io.pagopa.it"];
let threshold = 0.99;
AzureDiagnostics
| where originalHost_s in (api_hosts)
| where requestUri_s matches regex "/api/v1/payment-activations/[^/]+"
| summarize
  Total=count(),
  Success=count(httpStatus_d < 500) by bin(TimeGenerated, 5m)
| extend availability=toreal(Success) / Total

| where availability < threshold


  QUERY

  severity    = 1
  frequency   = 10
  time_window = 20
  trigger {
    operator  = "GreaterThanOrEqual"
    threshold = 1
  }

  tags = var.tags
}

resource "azurerm_monitor_scheduled_query_rules_alert" "alarm_time_20" {
  name                = replace(join("_",split("/", "${local.name}-responsetime @ /api/v1/payment-activations/{codiceContestoPagamento}")), "/\\{|\\}/", "")
  resource_group_name = data.azurerm_resource_group.this.name
  location            = data.azurerm_resource_group.this.location

  action {
    action_group = ["/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/SlackPagoPA", "/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/EmailPagoPA"]
  }

  data_source_id          = "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
  description             = "Response time for /api/v1/payment-activations/{codiceContestoPagamento} is less than or equal to 1s - ${local.dashboard_base_addr}${azurerm_portal_dashboard.this.id}"
  enabled                 = true
  auto_mitigation_enabled = false

  query = <<-QUERY
    
let api_hosts = datatable (name: string) ["app-backend.io.italia.it", "api-app.io.pagopa.it"];
let threshold = 1;
AzureDiagnostics
| where originalHost_s in (api_hosts)
| where requestUri_s matches regex "/api/v1/payment-activations/[^/]+"
| summarize
    watermark=threshold,
    percentiles(timeTaken_d, 95) by bin(TimeGenerated, 5m)

| where percentile_timeTaken_d_95 > threshold


  QUERY

  severity    = 1
  frequency   = 10
  time_window = 20
  trigger {
    operator  = "GreaterThanOrEqual"
    threshold = 1
  }

  tags = var.tags
}

resource "azurerm_monitor_scheduled_query_rules_alert" "alarm_availability_21" {
  name                = replace(join("_",split("/", "${local.name}-availability @ /api/v1/user-data-processing")), "/\\{|\\}/", "")
  resource_group_name = data.azurerm_resource_group.this.name
  location            = data.azurerm_resource_group.this.location

  action {
    action_group = ["/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/SlackPagoPA", "/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/EmailPagoPA"]
  }

  data_source_id          = "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
  description             = "Availability for /api/v1/user-data-processing is less than or equal to 99% - ${local.dashboard_base_addr}${azurerm_portal_dashboard.this.id}"
  enabled                 = true
  auto_mitigation_enabled = false

  query = <<-QUERY
    
let api_hosts = datatable (name: string) ["app-backend.io.italia.it", "api-app.io.pagopa.it"];
let threshold = 0.99;
AzureDiagnostics
| where originalHost_s in (api_hosts)
| where requestUri_s matches regex "/api/v1/user-data-processing"
| summarize
  Total=count(),
  Success=count(httpStatus_d < 500) by bin(TimeGenerated, 5m)
| extend availability=toreal(Success) / Total

| where availability < threshold


  QUERY

  severity    = 1
  frequency   = 10
  time_window = 20
  trigger {
    operator  = "GreaterThanOrEqual"
    threshold = 1
  }

  tags = var.tags
}

resource "azurerm_monitor_scheduled_query_rules_alert" "alarm_time_21" {
  name                = replace(join("_",split("/", "${local.name}-responsetime @ /api/v1/user-data-processing")), "/\\{|\\}/", "")
  resource_group_name = data.azurerm_resource_group.this.name
  location            = data.azurerm_resource_group.this.location

  action {
    action_group = ["/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/SlackPagoPA", "/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/EmailPagoPA"]
  }

  data_source_id          = "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
  description             = "Response time for /api/v1/user-data-processing is less than or equal to 1s - ${local.dashboard_base_addr}${azurerm_portal_dashboard.this.id}"
  enabled                 = true
  auto_mitigation_enabled = false

  query = <<-QUERY
    
let api_hosts = datatable (name: string) ["app-backend.io.italia.it", "api-app.io.pagopa.it"];
let threshold = 1;
AzureDiagnostics
| where originalHost_s in (api_hosts)
| where requestUri_s matches regex "/api/v1/user-data-processing"
| summarize
    watermark=threshold,
    percentiles(timeTaken_d, 95) by bin(TimeGenerated, 5m)

| where percentile_timeTaken_d_95 > threshold


  QUERY

  severity    = 1
  frequency   = 10
  time_window = 20
  trigger {
    operator  = "GreaterThanOrEqual"
    threshold = 1
  }

  tags = var.tags
}

resource "azurerm_monitor_scheduled_query_rules_alert" "alarm_availability_22" {
  name                = replace(join("_",split("/", "${local.name}-availability @ /api/v1/user-data-processing/{choice}")), "/\\{|\\}/", "")
  resource_group_name = data.azurerm_resource_group.this.name
  location            = data.azurerm_resource_group.this.location

  action {
    action_group = ["/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/SlackPagoPA", "/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/EmailPagoPA"]
  }

  data_source_id          = "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
  description             = "Availability for /api/v1/user-data-processing/{choice} is less than or equal to 99% - ${local.dashboard_base_addr}${azurerm_portal_dashboard.this.id}"
  enabled                 = true
  auto_mitigation_enabled = false

  query = <<-QUERY
    
let api_hosts = datatable (name: string) ["app-backend.io.italia.it", "api-app.io.pagopa.it"];
let threshold = 0.99;
AzureDiagnostics
| where originalHost_s in (api_hosts)
| where requestUri_s matches regex "/api/v1/user-data-processing/[^/]+"
| summarize
  Total=count(),
  Success=count(httpStatus_d < 500) by bin(TimeGenerated, 5m)
| extend availability=toreal(Success) / Total

| where availability < threshold


  QUERY

  severity    = 1
  frequency   = 10
  time_window = 20
  trigger {
    operator  = "GreaterThanOrEqual"
    threshold = 1
  }

  tags = var.tags
}

resource "azurerm_monitor_scheduled_query_rules_alert" "alarm_time_22" {
  name                = replace(join("_",split("/", "${local.name}-responsetime @ /api/v1/user-data-processing/{choice}")), "/\\{|\\}/", "")
  resource_group_name = data.azurerm_resource_group.this.name
  location            = data.azurerm_resource_group.this.location

  action {
    action_group = ["/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/SlackPagoPA", "/subscriptions/EC285037-C673-4F58-B594-D7C480DA4E8B/resourceGroups/io-p-rg-common/providers/microsoft.insights/actionGroups/EmailPagoPA"]
  }

  data_source_id          = "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway"
  description             = "Response time for /api/v1/user-data-processing/{choice} is less than or equal to 1s - ${local.dashboard_base_addr}${azurerm_portal_dashboard.this.id}"
  enabled                 = true
  auto_mitigation_enabled = false

  query = <<-QUERY
    
let api_hosts = datatable (name: string) ["app-backend.io.italia.it", "api-app.io.pagopa.it"];
let threshold = 1;
AzureDiagnostics
| where originalHost_s in (api_hosts)
| where requestUri_s matches regex "/api/v1/user-data-processing/[^/]+"
| summarize
    watermark=threshold,
    percentiles(timeTaken_d, 95) by bin(TimeGenerated, 5m)

| where percentile_timeTaken_d_95 > threshold


  QUERY

  severity    = 1
  frequency   = 10
  time_window = 20
  trigger {
    operator  = "GreaterThanOrEqual"
    threshold = 1
  }

  tags = var.tags
}

