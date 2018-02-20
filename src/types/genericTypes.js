"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const flow_runtime_1 = require("flow-runtime");
const v = require("flow-runtime-validators");
/**
 * A string that represents a valid italian Fiscal Number.
 */
exports.FiscalNumberType = flow_runtime_1.default.refinement(flow_runtime_1.default.string(), v.regexp({
    pattern: /^[A-Z]{6}[0-9LMNPQRSTUV]{2}[ABCDEHLMPRST][0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{3}[A-Z]$/
}));
/**
 * A string that represents a valid email address.
 */
exports.EmailType = flow_runtime_1.default.refinement(flow_runtime_1.default.string(), v.email());
/**
 * A number greater than or equal to zero.
 */
exports.NonNegativeNumberType = flow_runtime_1.default.refinement(flow_runtime_1.default.number(), v.number({ gte: 0 }));
/**
 * The issuer object as returned by the SAML authentication.
 *
 * @see passport-saml
 */
exports.IssuerType = flow_runtime_1.default.object(flow_runtime_1.default.property("_", flow_runtime_1.default.string()));
/**
 * The notification object as returned by the Digital Citizenship API.
 *
 * @see https://raw.githubusercontent.com/teamdigitale/digital-citizenship-functions/3d315e4/api/definitions.yaml#NotificationStatus
 */
exports.NotificationType = flow_runtime_1.default.object(flow_runtime_1.default.property("email", flow_runtime_1.default.string()));
/**
 * The message object as returned by the Digital Citizenship API.
 *
 * @see https://raw.githubusercontent.com/teamdigitale/digital-citizenship-functions/3d315e4/api/definitions.yaml#MessageResponse
 */
exports.MessageType = flow_runtime_1.default.object(flow_runtime_1.default.property("id", flow_runtime_1.default.string()), flow_runtime_1.default.property("fiscalCode", exports.FiscalNumberType), flow_runtime_1.default.property("senderServiceId", flow_runtime_1.default.string()), flow_runtime_1.default.property("content", flow_runtime_1.default.object(flow_runtime_1.default.property("subject", flow_runtime_1.default.string()), flow_runtime_1.default.property("markdown", flow_runtime_1.default.string()))));
/**
 * The item object as returned by the Digital Citizenship API.
 *
 * @see https://raw.githubusercontent.com/teamdigitale/digital-citizenship-functions/3d315e4/api/definitions.yaml#CreatedMessage
 */
exports.ItemType = flow_runtime_1.default.object(flow_runtime_1.default.property("id", flow_runtime_1.default.string()), flow_runtime_1.default.property("fiscalCode", exports.FiscalNumberType), flow_runtime_1.default.property("senderServiceId", flow_runtime_1.default.string()));
//# sourceMappingURL=genericTypes.js.map