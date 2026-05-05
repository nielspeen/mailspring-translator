"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mailspring_exports_1 = require("mailspring-exports");
const mailspring_translation_storage_1 = require("./mailspring-translation-storage");
/**
 * Applies translations stored in Mailspring’s localStorage keys on every body pass,
 * so new translations appear without reload (core translation keeps an in-memory index only).
 */
class LmStudioTranslationMessageExtension extends mailspring_exports_1.MessageViewExtension {
    static formatMessageBody({ message }) {
        const entries = (0, mailspring_translation_storage_1.readIndex)();
        const entry = entries.find((o) => o.id === message.id);
        if (!entry || !entry.enabled) {
            return;
        }
        const html = window.localStorage.getItem(`translated-${message.id}`);
        if (typeof html === 'string' && html.length > 0) {
            message.body = html;
        }
    }
}
exports.default = LmStudioTranslationMessageExtension;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG1zdHVkaW8tbWVzc2FnZS1leHRlbnNpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvbG1zdHVkaW8tbWVzc2FnZS1leHRlbnNpb24uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSwyREFBMEQ7QUFDMUQscUZBQTZEO0FBRTdEOzs7R0FHRztBQUNILE1BQXFCLG1DQUFvQyxTQUFRLHlDQUFvQjtJQUNuRixNQUFNLENBQUMsaUJBQWlCLENBQUMsRUFBRSxPQUFPLEVBQUU7UUFDbEMsTUFBTSxPQUFPLEdBQUcsSUFBQSwwQ0FBUyxHQUFFLENBQUM7UUFDNUIsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDdkQsSUFBSSxDQUFDLEtBQUssSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUU7WUFDNUIsT0FBTztTQUNSO1FBQ0QsTUFBTSxJQUFJLEdBQUcsTUFBTSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsY0FBYyxPQUFPLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUNyRSxJQUFJLE9BQU8sSUFBSSxLQUFLLFFBQVEsSUFBSSxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtZQUMvQyxPQUFPLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztTQUNyQjtJQUNILENBQUM7Q0FDRjtBQVpELHNEQVlDIn0=