"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.serialize = exports.deactivate = exports.activate = exports.config = void 0;
const mailspring_exports_1 = require("mailspring-exports");
const translation_body_header_1 = __importDefault(require("./translation-body-header"));
/**
 * Optional config (Preferences uses package name as namespace).
 * Defaults match LM Studio’s local server.
 */
exports.config = {
    lmstudioBaseUrl: {
        type: 'string',
        default: 'http://127.0.0.1:1234',
        title: 'LM Studio base URL',
        description: 'OpenAI-compatible API root (no trailing slash). LM Studio default is http://127.0.0.1:1234',
    },
};
function activate() {
    mailspring_exports_1.ComponentRegistry.register(translation_body_header_1.default, {
        role: 'message:BodyHeader',
    });
}
exports.activate = activate;
function deactivate() {
    mailspring_exports_1.ComponentRegistry.unregister(translation_body_header_1.default);
}
exports.deactivate = deactivate;
function serialize() { }
exports.serialize = serialize;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9tYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLDJEQUF1RDtBQUN2RCx3RkFBOEQ7QUFFOUQ7OztHQUdHO0FBQ1UsUUFBQSxNQUFNLEdBQUc7SUFDcEIsZUFBZSxFQUFFO1FBQ2YsSUFBSSxFQUFFLFFBQVE7UUFDZCxPQUFPLEVBQUUsdUJBQXVCO1FBQ2hDLEtBQUssRUFBRSxvQkFBb0I7UUFDM0IsV0FBVyxFQUNULDRGQUE0RjtLQUMvRjtDQUNGLENBQUM7QUFFRixTQUFnQixRQUFRO0lBQ3RCLHNDQUFpQixDQUFDLFFBQVEsQ0FBQyxpQ0FBcUIsRUFBRTtRQUNoRCxJQUFJLEVBQUUsb0JBQW9CO0tBQzNCLENBQUMsQ0FBQztBQUNMLENBQUM7QUFKRCw0QkFJQztBQUVELFNBQWdCLFVBQVU7SUFDeEIsc0NBQWlCLENBQUMsVUFBVSxDQUFDLGlDQUFxQixDQUFDLENBQUM7QUFDdEQsQ0FBQztBQUZELGdDQUVDO0FBRUQsU0FBZ0IsU0FBUyxLQUFJLENBQUM7QUFBOUIsOEJBQThCIn0=