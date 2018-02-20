"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
{
    User;
}
from;
"../types/user";
const user_1 = require("../types/user");
const api_1 = require("../types/api");
{
    APIError;
}
from;
"../types/error";
{
    ApiClientFactoryInterface;
}
from;
"../services/apiClientFactoryInterface";
{
    UpsertProfile;
}
from;
"../types/profile";
const profile_1 = require("../types/profile");
const ControllerBase_1 = require("./ControllerBase");
/**
 * This controller handles reading the user profile from the
 * app by forwarding the call to the API system.
 */
class ProfileController extends ControllerBase_1.default {
    /**
     * Class constructor.
     *
     * @param apiClient
     */
    constructor(apiClient) {
        super(apiClient);
    }
    /**
     * Returns the profile for the user identified by the provided fiscal
     * code.
     *
     * @param req
     * @param res
     */
    getUserProfile(req, res) {
        const maybeUser = user_1.extractUserFromRequest(req);
        maybeUser.fold((error) => {
            res.status(500).json({
                // Unable to extract the user from the request.
                message: error
            });
        }, (user) => {
            this.apiClient
                .getClient(user.fiscal_code)
                .getProfile()
                .then(maybeApiProfile => {
                // Look if the response is a GetProfileOKResponse.
                api_1.validateResponse(maybeApiProfile, api_1.GetProfileOKResponseModel).fold(
                // Look if object is a ProblemJson.
                () => {
                    api_1.validateProblemJson(maybeApiProfile, res, () => {
                        if (maybeApiProfile.status === 404) {
                            // If the profile doesn't exists on the API we still
                            // return 200 to the App with the information we have
                            // retrieved from SPID.
                            res
                                .status(200)
                                .json(profile_1.ProfileWithoutEmailToAppProfile(user));
                        }
                        else {
                            api_1.forwardAPIError(maybeApiProfile, res);
                        }
                    });
                }, 
                // All correct, return the response to the client.
                    apiProfile => {
                    res.json(profile_1.ProfileWithEmailToAppProfile(apiProfile, user));
                });
            }, (err) => {
                res.status(err.statusCode).json({
                    // Here usually we have connection or transmission errors.
                    message: err.message
                });
            });
        });
    }
    /**
     * Create or update the preferences for the user identified by the provided
     * fiscal code.
     *
     * @param req
     * @param res
     */
    upsertProfile(req, res) {
        const maybeUser = user_1.extractUserFromRequest(req);
        maybeUser.fold((error) => {
            res.status(500).json({
                // Unable to extract the user from the request.
                message: error
            });
        }, (user) => {
            const maybeUpsertProfile = profile_1.extractUpsertProfileFromRequest(req);
            maybeUpsertProfile.fold((error) => {
                res.status(500).json({
                    message: error
                });
            }, (upsertProfile) => {
                this.apiClient
                    .getClient(user.fiscal_code)
                    .upsertProfile({ body: profile_1.toExtendedProfile(upsertProfile) })
                    .then(maybeApiProfile => {
                    // Look if the response is a UpsertProfileOKResponse.
                    api_1.validateResponse(maybeApiProfile, api_1.UpsertProfileOKResponseModel).fold(
                    // Look if the response is a ProblemJson.
                    () => api_1.validateProblemJson(maybeApiProfile, res), 
                    // All correct, return the response to the client.
                        apiProfile => {
                        res.json(profile_1.ProfileWithEmailToAppProfile(apiProfile, user));
                    });
                }, (err) => {
                    res.status(err.statusCode).json({
                        // Here usually we have connection or transmission errors.
                        message: err.message
                    });
                });
            });
        });
    }
}
exports.default = ProfileController;
//# sourceMappingURL=profileController.js.map