"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const flow_runtime_1 = require("flow-runtime");
const MessageModel = flow_runtime_1.default.object(flow_runtime_1.default.property("id", flow_runtime_1.default.string()), flow_runtime_1.default.property("markdown", flow_runtime_1.default.string(), true), flow_runtime_1.default.property("sender_service_id", flow_runtime_1.default.string()), flow_runtime_1.default.property("subject", flow_runtime_1.default.string(), true));
/**
 * Converts an API MessageResponse to a Proxy message.
 *
 * @param from
 * @returns {Message}
 */
function messageResponseToAppMessage(from) {
    if (from.message.hasOwnProperty("content")) {
        return {
            id: from.message.id,
            markdown: from.message.content.markdown,
            sender_service_id: from.message.senderServiceId,
            subject: from.message.content.subject
        };
    }
    else {
        return {
            id: from.message.id,
            sender_service_id: from.message.senderServiceId
        };
    }
}
exports.messageResponseToAppMessage = messageResponseToAppMessage;
/**
 * Converts an API CreatedMessage to a Proxy message.
 *
 * @param from
 * @returns {Message}
 */
function createdMessageToAppMessage(from) {
    return {
        id: from.id,
        sender_service_id: from.senderServiceId
    };
}
exports.createdMessageToAppMessage = createdMessageToAppMessage;
//# sourceMappingURL=message.js.map