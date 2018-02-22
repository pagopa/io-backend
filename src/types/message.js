"use strict";
/**
 *
 */
Object.defineProperty(exports, "__esModule", { value: true });
const t = require("io-ts");
const io_ts_1 = require("io-ts");
const types_1 = require("../utils/types");
// required attributes
const MessageR = t.interface({
    id: io_ts_1.string,
    sender_service_id: io_ts_1.string
});
// optional attributes
const MessageO = t.partial({
    markdown: io_ts_1.string,
    subject: io_ts_1.string
});
exports.Message = types_1.strictInterfaceWithOptionals(MessageR.props, MessageO.props, "Message");
/**
 * Converts an API MessageResponse to a Proxy message.
 *
 * @param from
 * @returns {Message}
 */
function messageResponseToAppMessage(from) {
    if (from.message.hasOwnProperty("content")) {
        return {
            id: from.message.id || "",
            markdown: (from.message.content !== undefined) ? from.message.content.markdown : "",
            sender_service_id: from.message.senderServiceId,
            subject: (from.message.content !== undefined) ? from.message.content.subject : ""
        };
    }
    else {
        return {
            id: from.message.id || "",
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
        id: from.id || "",
        sender_service_id: from.senderServiceId
    };
}
exports.createdMessageToAppMessage = createdMessageToAppMessage;
//# sourceMappingURL=message.js.map