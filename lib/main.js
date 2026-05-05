"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.serialize = exports.deactivate = exports.activate = exports.config = void 0;
const mailspring_exports_1 = require("mailspring-exports");
const translation_body_header_1 = __importDefault(require("./translation-body-header"));
const prefetch_runner_1 = require("./prefetch-runner");
/**
 * Optional config (Preferences uses package name as namespace).
 */
exports.config = {
    lmstudioBaseUrl: {
        type: 'string',
        default: 'http://127.0.0.1:1234',
        title: 'LM Studio base URL',
        description: 'OpenAI-compatible API root (no trailing slash). LM Studio default is http://127.0.0.1:1234',
    },
    prefetchConcurrency: {
        type: 'number',
        default: 2,
        minimum: 1,
        maximum: 8,
        title: 'Prefetch concurrency',
        description: 'Parallel LM Studio translation requests when prefetching the focused thread (Chinese/Japanese only).',
    },
    hideOriginalIframeWhenEnglishTab: {
        type: 'boolean',
        default: false,
        title: 'Hide built-in body when English tab is selected',
        description: 'When enabled, hides Mailspring’s message iframe while the English translation tab is active (experimental).',
    },
};
let _messageStoreUnsubscribe;
function activate() {
    mailspring_exports_1.ComponentRegistry.register(translation_body_header_1.default, {
        role: 'message:BodyHeader',
    });
    _messageStoreUnsubscribe = mailspring_exports_1.MessageStore.listen(() => {
        try {
            (0, prefetch_runner_1.enqueuePrefetchForMessages)(mailspring_exports_1.MessageStore.items());
        }
        catch (e) {
            if (AppEnv.reportError) {
                AppEnv.reportError(e);
            }
        }
    });
    try {
        (0, prefetch_runner_1.enqueuePrefetchForMessages)(mailspring_exports_1.MessageStore.items());
    }
    catch (e) {
        /* MessageStore may be empty at activation */
    }
}
exports.activate = activate;
function deactivate() {
    (0, prefetch_runner_1.clearPrefetchQueue)();
    if (_messageStoreUnsubscribe) {
        _messageStoreUnsubscribe();
        _messageStoreUnsubscribe = null;
    }
    mailspring_exports_1.ComponentRegistry.unregister(translation_body_header_1.default);
}
exports.deactivate = deactivate;
function serialize() { }
exports.serialize = serialize;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9tYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLDJEQUFxRTtBQUNyRSx3RkFBOEQ7QUFDOUQsdURBRzJCO0FBRTNCOztHQUVHO0FBQ1UsUUFBQSxNQUFNLEdBQUc7SUFDcEIsZUFBZSxFQUFFO1FBQ2YsSUFBSSxFQUFFLFFBQVE7UUFDZCxPQUFPLEVBQUUsdUJBQXVCO1FBQ2hDLEtBQUssRUFBRSxvQkFBb0I7UUFDM0IsV0FBVyxFQUNULDRGQUE0RjtLQUMvRjtJQUNELG1CQUFtQixFQUFFO1FBQ25CLElBQUksRUFBRSxRQUFRO1FBQ2QsT0FBTyxFQUFFLENBQUM7UUFDVixPQUFPLEVBQUUsQ0FBQztRQUNWLE9BQU8sRUFBRSxDQUFDO1FBQ1YsS0FBSyxFQUFFLHNCQUFzQjtRQUM3QixXQUFXLEVBQ1Qsc0dBQXNHO0tBQ3pHO0lBQ0QsZ0NBQWdDLEVBQUU7UUFDaEMsSUFBSSxFQUFFLFNBQVM7UUFDZixPQUFPLEVBQUUsS0FBSztRQUNkLEtBQUssRUFBRSxpREFBaUQ7UUFDeEQsV0FBVyxFQUNULDZHQUE2RztLQUNoSDtDQUNGLENBQUM7QUFFRixJQUFJLHdCQUF3QixDQUFDO0FBRTdCLFNBQWdCLFFBQVE7SUFDdEIsc0NBQWlCLENBQUMsUUFBUSxDQUFDLGlDQUFxQixFQUFFO1FBQ2hELElBQUksRUFBRSxvQkFBb0I7S0FDM0IsQ0FBQyxDQUFDO0lBRUgsd0JBQXdCLEdBQUcsaUNBQVksQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFO1FBQ2xELElBQUk7WUFDRixJQUFBLDRDQUEwQixFQUFDLGlDQUFZLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQztTQUNsRDtRQUFDLE9BQU8sQ0FBQyxFQUFFO1lBQ1YsSUFBSSxNQUFNLENBQUMsV0FBVyxFQUFFO2dCQUN0QixNQUFNLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDO2FBQ3ZCO1NBQ0Y7SUFDSCxDQUFDLENBQUMsQ0FBQztJQUVILElBQUk7UUFDRixJQUFBLDRDQUEwQixFQUFDLGlDQUFZLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQztLQUNsRDtJQUFDLE9BQU8sQ0FBQyxFQUFFO1FBQ1YsNkNBQTZDO0tBQzlDO0FBQ0gsQ0FBQztBQXBCRCw0QkFvQkM7QUFFRCxTQUFnQixVQUFVO0lBQ3hCLElBQUEsb0NBQWtCLEdBQUUsQ0FBQztJQUNyQixJQUFJLHdCQUF3QixFQUFFO1FBQzVCLHdCQUF3QixFQUFFLENBQUM7UUFDM0Isd0JBQXdCLEdBQUcsSUFBSSxDQUFDO0tBQ2pDO0lBQ0Qsc0NBQWlCLENBQUMsVUFBVSxDQUFDLGlDQUFxQixDQUFDLENBQUM7QUFDdEQsQ0FBQztBQVBELGdDQU9DO0FBRUQsU0FBZ0IsU0FBUyxLQUFJLENBQUM7QUFBOUIsOEJBQThCIn0=