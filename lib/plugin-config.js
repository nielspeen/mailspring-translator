"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPrefetchConcurrency = exports.getLmstudioBaseUrl = void 0;
function getLmstudioBaseUrl() {
    try {
        const v = AppEnv.config.get('mailspring-lmstudio-translator.lmstudioBaseUrl');
        if (v && typeof v === 'string') {
            return v.replace(/\/$/, '');
        }
    }
    catch (e) {
        /* ignore */
    }
    return 'http://127.0.0.1:1234';
}
exports.getLmstudioBaseUrl = getLmstudioBaseUrl;
function getPrefetchConcurrency() {
    try {
        const n = AppEnv.config.get('mailspring-lmstudio-translator.prefetchConcurrency');
        const num = typeof n === 'number' ? n : parseInt(String(n), 10);
        if (num >= 1 && num <= 8) {
            return num;
        }
    }
    catch (e) {
        /* ignore */
    }
    return 2;
}
exports.getPrefetchConcurrency = getPrefetchConcurrency;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGx1Z2luLWNvbmZpZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9wbHVnaW4tY29uZmlnLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLFNBQWdCLGtCQUFrQjtJQUNoQyxJQUFJO1FBQ0YsTUFBTSxDQUFDLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsZ0RBQWdELENBQUMsQ0FBQztRQUM5RSxJQUFJLENBQUMsSUFBSSxPQUFPLENBQUMsS0FBSyxRQUFRLEVBQUU7WUFDOUIsT0FBTyxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztTQUM3QjtLQUNGO0lBQUMsT0FBTyxDQUFDLEVBQUU7UUFDVixZQUFZO0tBQ2I7SUFDRCxPQUFPLHVCQUF1QixDQUFDO0FBQ2pDLENBQUM7QUFWRCxnREFVQztBQUVELFNBQWdCLHNCQUFzQjtJQUNwQyxJQUFJO1FBQ0YsTUFBTSxDQUFDLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsb0RBQW9ELENBQUMsQ0FBQztRQUNsRixNQUFNLEdBQUcsR0FBRyxPQUFPLENBQUMsS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUNoRSxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsRUFBRTtZQUN4QixPQUFPLEdBQUcsQ0FBQztTQUNaO0tBQ0Y7SUFBQyxPQUFPLENBQUMsRUFBRTtRQUNWLFlBQVk7S0FDYjtJQUNELE9BQU8sQ0FBQyxDQUFDO0FBQ1gsQ0FBQztBQVhELHdEQVdDIn0=