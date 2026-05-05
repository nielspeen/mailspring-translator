"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.serialize = exports.deactivate = exports.activate = exports.config = void 0;
const mailspring_exports_1 = require("mailspring-exports");
const translation_body_header_1 = __importDefault(require("./translation-body-header"));
const lmstudio_message_extension_1 = __importDefault(require("./lmstudio-message-extension"));
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
};
let _messageStoreUnsubscribe;
let _databaseStoreUnsubscribe;
let _dbPrefetchTimer;
function schedulePrefetchFromDb() {
    clearTimeout(_dbPrefetchTimer);
    _dbPrefetchTimer = setTimeout(() => {
        _dbPrefetchTimer = null;
        try {
            (0, prefetch_runner_1.enqueuePrefetchForMessages)(mailspring_exports_1.MessageStore.items());
        }
        catch (e) {
            if (AppEnv.reportError) {
                AppEnv.reportError(e);
            }
        }
    }, 350);
}
function activate() {
    mailspring_exports_1.ExtensionRegistry.MessageView.register(lmstudio_message_extension_1.default);
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
    _databaseStoreUnsubscribe = mailspring_exports_1.DatabaseStore.listen(schedulePrefetchFromDb);
}
exports.activate = activate;
function deactivate() {
    (0, prefetch_runner_1.clearPrefetchQueue)();
    clearTimeout(_dbPrefetchTimer);
    _dbPrefetchTimer = null;
    if (_databaseStoreUnsubscribe) {
        _databaseStoreUnsubscribe();
        _databaseStoreUnsubscribe = null;
    }
    if (_messageStoreUnsubscribe) {
        _messageStoreUnsubscribe();
        _messageStoreUnsubscribe = null;
    }
    mailspring_exports_1.ComponentRegistry.unregister(translation_body_header_1.default);
    mailspring_exports_1.ExtensionRegistry.MessageView.unregister(lmstudio_message_extension_1.default);
}
exports.deactivate = deactivate;
function serialize() { }
exports.serialize = serialize;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9tYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLDJEQUs0QjtBQUM1Qix3RkFBOEQ7QUFDOUQsOEZBQStFO0FBQy9FLHVEQUcyQjtBQUUzQjs7R0FFRztBQUNVLFFBQUEsTUFBTSxHQUFHO0lBQ3BCLGVBQWUsRUFBRTtRQUNmLElBQUksRUFBRSxRQUFRO1FBQ2QsT0FBTyxFQUFFLHVCQUF1QjtRQUNoQyxLQUFLLEVBQUUsb0JBQW9CO1FBQzNCLFdBQVcsRUFDVCw0RkFBNEY7S0FDL0Y7SUFDRCxtQkFBbUIsRUFBRTtRQUNuQixJQUFJLEVBQUUsUUFBUTtRQUNkLE9BQU8sRUFBRSxDQUFDO1FBQ1YsT0FBTyxFQUFFLENBQUM7UUFDVixPQUFPLEVBQUUsQ0FBQztRQUNWLEtBQUssRUFBRSxzQkFBc0I7UUFDN0IsV0FBVyxFQUNULHNHQUFzRztLQUN6RztDQUNGLENBQUM7QUFFRixJQUFJLHdCQUF3QixDQUFDO0FBQzdCLElBQUkseUJBQXlCLENBQUM7QUFDOUIsSUFBSSxnQkFBZ0IsQ0FBQztBQUVyQixTQUFTLHNCQUFzQjtJQUM3QixZQUFZLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztJQUMvQixnQkFBZ0IsR0FBRyxVQUFVLENBQUMsR0FBRyxFQUFFO1FBQ2pDLGdCQUFnQixHQUFHLElBQUksQ0FBQztRQUN4QixJQUFJO1lBQ0YsSUFBQSw0Q0FBMEIsRUFBQyxpQ0FBWSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7U0FDbEQ7UUFBQyxPQUFPLENBQUMsRUFBRTtZQUNWLElBQUksTUFBTSxDQUFDLFdBQVcsRUFBRTtnQkFDdEIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQzthQUN2QjtTQUNGO0lBQ0gsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0FBQ1YsQ0FBQztBQUVELFNBQWdCLFFBQVE7SUFDdEIsc0NBQWlCLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxvQ0FBbUMsQ0FBQyxDQUFDO0lBRTVFLHNDQUFpQixDQUFDLFFBQVEsQ0FBQyxpQ0FBcUIsRUFBRTtRQUNoRCxJQUFJLEVBQUUsb0JBQW9CO0tBQzNCLENBQUMsQ0FBQztJQUVILHdCQUF3QixHQUFHLGlDQUFZLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRTtRQUNsRCxJQUFJO1lBQ0YsSUFBQSw0Q0FBMEIsRUFBQyxpQ0FBWSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7U0FDbEQ7UUFBQyxPQUFPLENBQUMsRUFBRTtZQUNWLElBQUksTUFBTSxDQUFDLFdBQVcsRUFBRTtnQkFDdEIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQzthQUN2QjtTQUNGO0lBQ0gsQ0FBQyxDQUFDLENBQUM7SUFFSCxJQUFJO1FBQ0YsSUFBQSw0Q0FBMEIsRUFBQyxpQ0FBWSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7S0FDbEQ7SUFBQyxPQUFPLENBQUMsRUFBRTtRQUNWLDZDQUE2QztLQUM5QztJQUVELHlCQUF5QixHQUFHLGtDQUFhLENBQUMsTUFBTSxDQUFDLHNCQUFzQixDQUFDLENBQUM7QUFDM0UsQ0FBQztBQXhCRCw0QkF3QkM7QUFFRCxTQUFnQixVQUFVO0lBQ3hCLElBQUEsb0NBQWtCLEdBQUUsQ0FBQztJQUNyQixZQUFZLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztJQUMvQixnQkFBZ0IsR0FBRyxJQUFJLENBQUM7SUFDeEIsSUFBSSx5QkFBeUIsRUFBRTtRQUM3Qix5QkFBeUIsRUFBRSxDQUFDO1FBQzVCLHlCQUF5QixHQUFHLElBQUksQ0FBQztLQUNsQztJQUNELElBQUksd0JBQXdCLEVBQUU7UUFDNUIsd0JBQXdCLEVBQUUsQ0FBQztRQUMzQix3QkFBd0IsR0FBRyxJQUFJLENBQUM7S0FDakM7SUFDRCxzQ0FBaUIsQ0FBQyxVQUFVLENBQUMsaUNBQXFCLENBQUMsQ0FBQztJQUNwRCxzQ0FBaUIsQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLG9DQUFtQyxDQUFDLENBQUM7QUFDaEYsQ0FBQztBQWRELGdDQWNDO0FBRUQsU0FBZ0IsU0FBUyxLQUFJLENBQUM7QUFBOUIsOEJBQThCIn0=