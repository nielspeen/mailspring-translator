"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.truncateHtml = exports.stripHtmlToText = void 0;
function stripHtmlToText(html) {
    if (typeof html !== 'string' || !html) {
        return '';
    }
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return (doc.body && doc.body.textContent) || '';
}
exports.stripHtmlToText = stripHtmlToText;
/**
 * @returns {{ html: string, truncated: boolean }}
 */
function truncateHtml(html, maxChars) {
    if (typeof html !== 'string') {
        return { html: '', truncated: false };
    }
    if (html.length <= maxChars) {
        return { html, truncated: false };
    }
    return {
        html: html.slice(0, maxChars) +
            '<p data-lmstudio-truncated="1"><em>[… truncated for translation …]</em></p>',
        truncated: true,
    };
}
exports.truncateHtml = truncateHtml;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHRtbC11dGlscy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9odG1sLXV0aWxzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLFNBQWdCLGVBQWUsQ0FBQyxJQUFJO0lBQ2xDLElBQUksT0FBTyxJQUFJLEtBQUssUUFBUSxJQUFJLENBQUMsSUFBSSxFQUFFO1FBQ3JDLE9BQU8sRUFBRSxDQUFDO0tBQ1g7SUFDRCxNQUFNLEdBQUcsR0FBRyxJQUFJLFNBQVMsRUFBRSxDQUFDLGVBQWUsQ0FBQyxJQUFJLEVBQUUsV0FBVyxDQUFDLENBQUM7SUFDL0QsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUM7QUFDbEQsQ0FBQztBQU5ELDBDQU1DO0FBRUQ7O0dBRUc7QUFDSCxTQUFnQixZQUFZLENBQUMsSUFBSSxFQUFFLFFBQVE7SUFDekMsSUFBSSxPQUFPLElBQUksS0FBSyxRQUFRLEVBQUU7UUFDNUIsT0FBTyxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxDQUFDO0tBQ3ZDO0lBQ0QsSUFBSSxJQUFJLENBQUMsTUFBTSxJQUFJLFFBQVEsRUFBRTtRQUMzQixPQUFPLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsQ0FBQztLQUNuQztJQUNELE9BQU87UUFDTCxJQUFJLEVBQ0YsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsUUFBUSxDQUFDO1lBQ3ZCLDZFQUE2RTtRQUMvRSxTQUFTLEVBQUUsSUFBSTtLQUNoQixDQUFDO0FBQ0osQ0FBQztBQWJELG9DQWFDIn0=