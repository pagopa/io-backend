const soap = require('soap');
const fs = require('fs');
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

let config = {
  "wso2_url": "https://spid-testenv-identityserver:9443",
  "wso2_user": "admin",
  "wso2_pass": "admin"
};

let data = [];

process.stdout.write("\n\n== SPID Spervice Provider import == \n");
process.stdout.write("Loading configuration... \n");

readConfig();

process.stdout.write("Ok\n\n");
process.stdout.write("wso2_url: " + config.wso2_url + "\n");
process.stdout.write("wso2_user: " + config.wso2_user + "\n");
process.stdout.write("wso2_pass: " + config.wso2_pass + "\n\n");

let basicAuthSecurity = new soap.BasicAuthSecurity(config.wso2_user, config.wso2_pass);

importSp(data, (result) => {
  if (result.code === 200) {
    process.stdout.write("Service Provider successfully imported\n");
  } else {
    process.stdout.write("Error\n");
    process.stdout.write(JSON.stringify(result) + "\n");
  }
});

// -----------------------------------------------------------------------------------------------------------

function readConfig() {
  try {
    data = JSON.parse(fs.readFileSync("spid-sp.json"));
    config = JSON.parse(fs.readFileSync(".env"));
  }
  catch (e) {
    process.stdout.write("ERROR\n");
    process.stdout.write(e + "\n");
    process.exit();
  }

}

function importSp(user, callback) {
  let entityId = data.EntityId;

  let applicationName = "";
  if (entityId.substring(0, 8) === "https://") {
    applicationName = entityId.substring(8).replace(/\s+/g, '').toLowerCase();
  } else if (entityId.substring(0, 7) === "http://") {
    applicationName = entityId.substring(7).replace(/\s+/g, '').toLowerCase();
  } else {
    callback({
      code: 400,
      message: "Entity ID must start with https:// or http://"
    });
    return;
  }

  let applicationDescription = data.Organization.DisplayName + ' (' + data.Organization.Url + ')';
  let certificateAlias = entityId.substring(8).replace(/\s+/g, '').toLowerCase() + ".crt";
  let certificateFile = fs.readFileSync("/certs/cert.pem", "utf-8");

  certificateFile = certificateFile.replace(/-+BEGIN CERTIFICATE-+\r?\n?/, '');
  certificateFile = certificateFile.replace(/-+END CERTIFICATE-+\r?\n?/, '');
  certificateFile = certificateFile.replace(/\r\n/g, '\n');

  createApplication({

      "applicationName": applicationName,
      "description": applicationDescription

    }, () => {

      importCertToStore({

        "fileName": certificateAlias,
        "fileData": certificateFile

      }, () => {

        addRPServiceProvider({

          "assertionConsumerServices": data.AssertionConsumerServices,
          "singleLogoutServices": data.SingleLogoutServices,
          "entityId": entityId,
          "certificateAlias": certificateAlias

        }, () => {

          getApplication({

            "applicationName": applicationName

          }, (app) => {

            updateApplication({

              "applicationID": app.applicationID,
              "applicationName": applicationName,
              "description": applicationDescription,
              "entityId": entityId,
              "claims": data.AttributeConsumingServices[0].RequestedAttribute

            }, (soapRes) => {

              callback({
                code: 200,
                message: "Ok"
              });

            }, (errString) => {

              callback({
                code: 400,
                message: errString
              });
            });

          }, (errString) => {

            callback({
              code: 400,
              message: errString
            });
          });

        }, (errString) => {

          callback({
            code: 400,
            message: errString
          });
        });

      }, (errString) => {

        callback({
          code: 400,
          message: errString
        });
      });

    }, (errString) => {

      callback({
        code: 400,
        message: errString
      });
    }
  );
}

function createApplication(data, next, nexterr) {
  let url = config.wso2_url + '/services/IdentityApplicationManagementService?wsdl';
  soap.createClient(url, function(err, client, raw) {
    if (client == null) {
      nexterr("Identity Server not available");
      return;
    }
    if (raw != null && (raw.indexOf("<faultstring>") > -1)) {
      nexterr(parseFaultString(raw));
      return;
    }
    else {
      client.setSecurity(basicAuthSecurity);

      let args = {
        'serviceProvider': {
          'applicationName': data.applicationName,
          'description': data.description
        }
      };
      client.createApplication(args, function(err, result, raw) {
        if (raw != null && (raw.indexOf("<faultstring>") > -1)) {
          nexterr(parseFaultString(raw));
          return;
        }
        else {
          next();
        }
      });
    }
  });
}

function importCertToStore(data, next, nexterr) {
  let url = config.wso2_url + '/services/KeyStoreAdminService?wsdl';
  soap.createClient(url, function(err, client, raw) {
    if (client == null) {
      nexterr("Identity Server not available");
      return;
    }
    if (raw != null && (raw.indexOf("<faultstring>") > -1)) {
      nexterr(parseFaultString(raw));
      return;
    }
    else {
      client.setSecurity(basicAuthSecurity);

      let args = {
        'fileName': data.fileName,
        'fileData': data.fileData,
        'keyStoreName': 'wso2carbon.jks'
      };
      client.importCertToStore(args, function(err, result, raw) {
        if (raw != null && (raw.indexOf("<faultstring>") > -1)) {
          nexterr(parseFaultString(raw));
          return;
        }
        else {
          next();
        }
      });
    }
  });
}

function addRPServiceProvider(data, next, nexterr) {
  let url = config.wso2_url + '/services/IdentitySAMLSSOConfigService?wsdl';
  soap.createClient(url, function(err, client, raw) {
    if (client == null) {
      nexterr("Identity Server not available");
      return;
    }
    if (raw != null && (raw.indexOf("<faultstring>") > -1)) {
      nexterr(parseFaultString(raw));
      return;
    }
    else {
      client.setSecurity(basicAuthSecurity);

      let assertionConsumerUrls = [];
      let defaultAssertionConsumerUrl = '';

      for (assertion in data.assertionConsumerServices) {
        item = data.assertionConsumerServices[assertion];
        assertionConsumerUrls.push(item.Location);
        if (item.IsDefault === true) {
          defaultAssertionConsumerUrl = item.Location;
        }
      }

      let args = {
        'spDto': {
          'assertionConsumerUrl': data.assertionConsumerServices[0].Location,
          'assertionConsumerUrls': assertionConsumerUrls,
          'attributeConsumingServiceIndex': 1,
          'certAlias': data.certificateAlias,
          'defaultAssertionConsumerUrl': defaultAssertionConsumerUrl,
          'digestAlgorithmURI': 'http://www.w3.org/2001/04/xmlenc#sha256',
          'doEnableEncryptedAssertion': 'false',
          'doSignAssertions': 'true',
          'doSignResponse': 'true',
          'doSingleLogout': 'true',
          'doValidateSignatureInRequests': 'true',
          'enableAttributeProfile': 'true',
          'enableAttributesByDefault': 'false',
          'idPInitSLOEnabled': 'false',
          'idPInitSSOEnabled': 'false',
          'issuer': data.entityId,
          'loginPageURL': '',
          'nameIDFormat': 'urn:oasis:names:tc:SAML:2.0:nameid-format:transient',
          'signingAlgorithmURI': 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256',
          'sloRequestURL': data.singleLogoutServices[0].Location,
          'sloResponseURL': data.singleLogoutServices[0].Location,
        }
      };

      client.addRPServiceProvider(args, function(err, result, raw) {
        if (raw != null && (raw.indexOf("<faultstring>") > -1)) {
          nexterr(parseFaultString(raw));
          return;
        }
        else {
          next();
        }
      });
    }
  });
}

function getApplication(data, next, nexterr) {
  let url = config.wso2_url + '/services/IdentityApplicationManagementService?wsdl';
  soap.createClient(url, function(err, client, raw) {
    if (client == null) {
      nexterr("Identity Server not available");
      return;
    }
    if (raw != null && (raw.indexOf("<faultstring>") > -1)) {
      nexterr(parseFaultString(raw));
      return;
    }
    else {
      client.setSecurity(basicAuthSecurity);

      let args = {
        'applicationName': data.applicationName
      };
      client.getApplication(args, function(err, result, raw) {
        if (result != null
          && result.IdentityApplicationManagementServiceIdentityApplicationManagementException != null
          && result.IdentityApplicationManagementServiceIdentityApplicationManagementException.IdentityApplicationManagementException != null) {
          nexterr(result.IdentityApplicationManagementServiceIdentityApplicationManagementException.IdentityApplicationManagementException.message);
        } else {
          if (result.getApplicationResponse != null && result.getApplicationResponse.return != null) {
            next({
              applicationID: result.getApplicationResponse.return.applicationID,
              applicationName: result.getApplicationResponse.return.applicationName,
              description: result.getApplicationResponse.return.description
            });
          }
        }
      });
    }
  });
}

function updateApplication(data, next, nexterr) {
  let url = config.wso2_url + '/services/IdentityApplicationManagementService?wsdl';
  soap.createClient(url, function(err, client, raw) {
    if (client == null) {
      nexterr("Identity Server not available");
      return;
    }
    if (raw != null && (raw.indexOf("<faultstring>") > -1)) {
      nexterr(parseFaultString(raw));
      return;
    }
    else {
      client.setSecurity(basicAuthSecurity);

      let claimMappings = [];
      for (attribute in data.claims) {
        let localUri = "";
        if (data.claims[attribute] === "spidCode") {
          localUri = "http://wso2.org/claims/userid";
        }
        if (data.claims[attribute] === "name") {
          localUri = "http://wso2.org/claims/givenname";
        }
        if (data.claims[attribute] === "familyName") {
          localUri = "http://wso2.org/claims/lastname";
        }
        if (data.claims[attribute] === "placeOfBirth") {
          localUri = "http://wso2.org/claims/locality";
        }
        if (data.claims[attribute] === "countyOfBirth") {
          localUri = "http://wso2.org/claims/stateorprovince";
        }
        if (data.claims[attribute] === "dateOfBirth") {
          localUri = "http://wso2.org/claims/dob";
        }
        if (data.claims[attribute] === "gender") {
          localUri = "http://wso2.org/claims/gender";
        }
        if (data.claims[attribute] === "companyName") {
          localUri = "http://wso2.org/claims/organization";
        }
        if (data.claims[attribute] === "registeredOffice") {
          localUri = "http://wso2.org/claims/registeredOffice";
        }
        if (data.claims[attribute] === "fiscalNumber") {
          localUri = "http://wso2.org/claims/nickname";
        }
        if (data.claims[attribute] === "ivaCode") {
          localUri = "http://wso2.org/claims/im";
        }
        if (data.claims[attribute] === "idCard") {
          localUri = "http://wso2.org/claims/privatePersonalIdentifier";
        }
        if (data.claims[attribute] === "mobilePhone") {
          localUri = "http://wso2.org/claims/mobile";
        }
        if (data.claims[attribute] === "email") {
          localUri = "http://wso2.org/claims/emailaddress";
        }
        if (data.claims[attribute] === "address") {
          localUri = "http://wso2.org/claims/addresses";
        }
        if (data.claims[attribute] === "expirationDate") {
          localUri = "http://wso2.org/claims/expirationdate";
        }
        if (data.claims[attribute] === "digitalAddress") {
          localUri = "http://wso2.org/claims/otheremail";
        }

        let claim = {
          'requested': true,
          'localClaim': {
            'claimId': 0,
            'claimUri': localUri,
          },
          'remoteClaim': {
            'claimId': 0,
            'claimUri': data.claims[attribute]
          }
        };

        claimMappings.push(claim);
      }

      let args = {
        'serviceProvider': {
          'applicationID': data.applicationID,
          'applicationName': data.applicationName,
          'claimConfig': {
            'localClaimDialect': 'false',
            'alwaysSendMappedLocalSubjectId': 'false',
            'claimMappings': claimMappings,
            'roleClaimURI': '',
            'userClaimURI': 'true'
          },

          'description': data.description,
          'saasApp': true,
          'inboundAuthenticationConfig': {
            'inboundAuthenticationRequestConfigs': {
              'friendlyName': '',
              'inboundAuthKey': data.entityId,
              'inboundAuthType': 'samlsso',
              'inboundConfigType': 'standardAPP',
              'properties': {
                'displayOrder': '0',
                'name': 'attrConsumServiceIndex',
                'value': '1'
              }
            },
          },
          'inboundProvisioningConfig': {
            'provisioningEnabled': 'false',
            'provisioningUserStore': 'PRIMARY'
          },
          'localAndOutBoundAuthenticationConfig': {
            'alwaysSendBackAuthenticatedListOfIdPs': 'false',
            'authenticationSteps': [
              {
                'stepOrder': 1,
                'subjectStep': false,
                'attributeStep': false,
                'localAuthenticatorConfigs': {
                  'displayName': 'basic',
                  'enabled': 'false',
                  'name': 'BasicAuthenticator',
                  'valid': true
                },
              },
              {
                'stepOrder': 2,
                'subjectStep': false,
                'attributeStep': false,
                'federatedIdentityProviders': {
                  'defaultAuthenticatorConfig': {
                    'displayName': 'Email',
                    'enabled': false,
                    'name': 'EmailOTP',
                    'valid': true
                  },
                  'enable': false,
                  'federatedAuthenticatorConfigs': {
                    'displayName': 'Email',
                    'enabled': false,
                    'name': 'EmailOTP',
                    'valid': true
                  },
                  'federationHub': false,
                  'identityProviderName': 'EmailOTP Provider',
                  'primary': false,
                }
              }
            ],
            'authenticationType': 'flow',
            'enableAuthorization': false,
            'useTenantDomainInLocalSubjectIdentifier': false,
            'useUserstoreDomainInLocalSubjectIdentifier': false
          },
          'outboundProvisioningConfig': '',
          'owner': {
            'tenantDomain': 'carbon.super',
            'userName': 'admin',
            'userStoreDomain': 'PRIMARY'
          },
          'permissionAndRoleConfig': ''
        }
      };

      client.updateApplication(args, function(err, result, raw) {
        if (raw != null && (raw.indexOf("<faultstring>") > -1)) {
          nexterr(parseFaultString(raw));
          return;
        }
        else {
          next();
        }
      });
    }
  });
}

function parseFaultString(s) {
  if (s != null) {
    s = s.replace("<faultstring>", "");
    s = s.replace("</faultstring>", "");
  } else {
    s = "";
  }
  return s;
}
