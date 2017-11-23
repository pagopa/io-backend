const soap = require('soap');
const fs = require('fs');
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

let config = {
  "wso2_url": "https://spid-testenv-identityserver:9443",
  "wso2_user": "admin",
  "wso2_pass": "admin"
};

let users = [];

process.stdout.write("\n\n== SPID User import ==\n");
process.stdout.write("Loading configuration...\n");

readConfig();

process.stdout.write("Ok\n\n");
process.stdout.write("wso2_url: " + config.wso2_url + "\n");
process.stdout.write("wso2_user: " + config.wso2_user + "\n");
process.stdout.write("wso2_pass: " + config.wso2_pass + "\n\n");

let basicAuthSecurity = new soap.BasicAuthSecurity(config.wso2_user, config.wso2_pass);

process.stdout.write("# users imported: --" + "\n");
importUser(users, (result) => {
  if (result.code === 200) {
    process.stdout.write("\b\b" + ("00" + (+i + 1)).slice(-2) + "\n");
  } else {
    process.stdout.write("Error\n");
    process.stdout.write(result + "\n");
  }
});

// -----------------------------------------------------------------------------------------------------------

function readConfig() {
  try {
    users = JSON.parse(fs.readFileSync("spid-users.json"));
    config = JSON.parse(fs.readFileSync(".env"));
  }
  catch (e) {
    process.stdout.write("ERROR\n");
    process.stdout.write(e + "\n");
    process.exit();
  }
}

function importUser(user, callback) {
  getRoleNames({},
    (roles) => {
      if (roles.indexOf("PUBLIC") !== -1) {
        addUsers(users, callback);
      } else {
        addRole(
          { roleName: "PUBLIC" },
          () => {
            addUsers(users, callback)
          },
          () => {
            callback({
              code: 400,
              message: "Error while creating role PUBLIC on WSO2"
            })
          }
        )
      }
    },
    () => {
      callback({
        code: 400,
        message: "Error while retrieving roles from WSO2"
      })
    }
  );
}

function addUsers(users, callback) {
  if (users.length > 0) {
    let n = 0;
    for (i in users) {
      _importUser(users[i], (result) => {
        if (++n === users.length) {
          if (result.code === 200) {
            callback({
              code: 200,
              message: result.message
            });
          } else {
            callback({
              code: 400,
              message: result.message
            });
          }
        }
      });
    }
  } else {
    callback({
      code: 404,
      message: "No test users found to import"
    });
  }
}

function _importUser(user, callback) {
  let res = false;

  process.stdout.write("Add user: " + user.userName + " with role: " + user.roleList + "\n");

  addUser({
    "userName": user.userName,
    "lastName": user.lastName,
    "credential": user.credential,
    "roleList": user.roleList

  }, () => {

    let claimsSavedNum = 0;

    claimsSavedNum = checkLasteAddedUserClaimValue(user.userName, "http://wso2.org/claims/privatePersonalIdentifier", user.idCard, claimsSavedNum, callback);
    claimsSavedNum = checkLasteAddedUserClaimValue(user.userName, "http://wso2.org/claims/nickname", user.fiscalNumber, claimsSavedNum, callback);
    claimsSavedNum = checkLasteAddedUserClaimValue(user.userName, "http://wso2.org/claims/mobile", user.mobilePhone, claimsSavedNum, callback);
    claimsSavedNum = checkLasteAddedUserClaimValue(user.userName, "http://wso2.org/claims/dob", user.dateOfBirth, claimsSavedNum, callback);
    claimsSavedNum = checkLasteAddedUserClaimValue(user.userName, "http://wso2.org/claims/stateorprovince", user.countyOfBirth, claimsSavedNum, callback);
    claimsSavedNum = checkLasteAddedUserClaimValue(user.userName, "http://wso2.org/claims/givenname", user.name, claimsSavedNum, callback);
    claimsSavedNum = checkLasteAddedUserClaimValue(user.userName, "http://wso2.org/claims/otheremail", user.digitalAddress, claimsSavedNum, callback);
    claimsSavedNum = checkLasteAddedUserClaimValue(user.userName, "http://wso2.org/claims/im", user.ivaCode, claimsSavedNum, callback);
    claimsSavedNum = checkLasteAddedUserClaimValue(user.userName, "http://wso2.org/claims/locality", user.placeOfBirth, claimsSavedNum, callback);
    claimsSavedNum = checkLasteAddedUserClaimValue(user.userName, "http://wso2.org/claims/expirationdate", user.expirationDate, claimsSavedNum, callback);
    claimsSavedNum = checkLasteAddedUserClaimValue(user.userName, "http://wso2.org/claims/gender", user.gender, claimsSavedNum, callback);
    claimsSavedNum = checkLasteAddedUserClaimValue(user.userName, "http://wso2.org/claims/registeredOffice", user.registeredOffice, claimsSavedNum, callback);
    claimsSavedNum = checkLasteAddedUserClaimValue(user.userName, "http://wso2.org/claims/emailaddress", user.email, claimsSavedNum, callback);
    claimsSavedNum = checkLasteAddedUserClaimValue(user.userName, "http://wso2.org/claims/organization", user.companyName, claimsSavedNum, callback);

    res = true;

  }, (errString) => {

    res = false;
  });

  return res;
}

function checkLasteAddedUserClaimValue(
  username, claimURI, remoteClaim, savedNum, callback) {
  savedNum++;

  addUserClaimValue({
      userName: username,
      claimURI: claimURI,
      value: remoteClaim
    }, () => {
      if (savedNum === 14) {
        callback({
          code: 200,
          message: "Ok"
        });
      }
    }
  );
  return savedNum;
}

function getRoleNames(data, next, nexterr) {
  let url = config.wso2_url + '/services/RemoteUserStoreManagerService?wsdl';
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

      let args = {};

      client.getRoleNames(args, function(err, result, raw) {
        if (raw != null && (raw.indexOf("<faultstring>") > -1)) {
          nexterr(parseFaultString(raw));
          return;
        }
        else {
          if (result != null && result.getRoleNamesResponse != null) {
            next(result.getRoleNamesResponse.return);
          } else {
            nexterr();
          }
        }
      });
    }
  });
}

function addRole(data, next, nexterr) {
  let url = config.wso2_url + '/services/RemoteUserStoreManagerService?wsdl';
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
        roleName: data.roleName
      };

      client.addRole(args, function(err, result, raw) {
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

function addUser(data, next, nexterr) {
  let url = config.wso2_url + '/services/RemoteUserStoreManagerService?wsdl';
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
        "userName": data.userName,
        "credential": data.credential,
        "roleList": data.roleList,
        "claims": {
          "claimURI": "http://wso2.org/claims/lastname",
          "value": data.lastName
        },
        "requirePasswordChange": "false"
      };

      client.addUser(args, function(err, result, raw) {
        if (raw != null && (raw.indexOf("<faultstring>") > -1)) {
          nexterr(parseFaultString(raw));
          process.stdout.write("Error while adding user " + data.userName + "\n");
          process.stdout.write(raw + "\n");
          return;
        }
        else {
          next();
        }
      });
    }
  });
}

function addUserClaimValue(data, next) {
  let url = config.wso2_url + '/services/RemoteUserStoreManagerService?wsdl';
  soap.createClient(url, function(err, client) {
    if (client == null) {
      nexterr("Identity Server not available");
      return;
    }

    client.setSecurity(basicAuthSecurity);

    let args = {
      "userName": data.userName,
      "claimURI": data.claimURI,
      "claimValue": data.value
    };

    client.addUserClaimValue(args, function(err, result, raw, soapHeader) {
      if (raw != null && (raw.indexOf("<faultstring>") > -1)) {
        process.stdout.write("Error while setting claim " + data.claimURI + " for " + data.userName + "\n");
        process.stdout.write(raw + "\n");
      }

      next();
    });
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
