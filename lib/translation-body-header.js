"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mailspring_exports_1 = require("mailspring-exports");
const cjk_detect_1 = require("./cjk-detect");
const translation_cache_1 = require("./translation-cache");
const lmstudio_client_1 = require("./lmstudio-client");
const html_utils_1 = require("./html-utils");
const plugin_config_1 = require("./plugin-config");
const MAX_HTML = 120000;
const CHAT_TOKENS = 8192;
class TranslationBodyHeader extends mailspring_exports_1.React.Component {
    constructor(props) {
        super(props);
        this._run = async () => {
            const { message } = this.props;
            if (!message || typeof message.body !== 'string') {
                this.setState({ status: 'skip' });
                return;
            }
            const plain = (0, html_utils_1.stripHtmlToText)(message.body).trim();
            const targetLang = (0, cjk_detect_1.detectCjkTarget)(plain);
            if (!targetLang) {
                this.setState({ status: 'skip' });
                return;
            }
            const cacheKey = (0, translation_cache_1.makeCacheKey)(message.id, message.body);
            const cached = (0, translation_cache_1.getCachedTranslation)(cacheKey);
            const originalPromise = mailspring_exports_1.SanitizeTransformer.run(message.body);
            if (cached && cached.targetLang === targetLang) {
                try {
                    const originalSanitized = await originalPromise;
                    if (this.props.message.id !== message.id) {
                        return;
                    }
                    this.setState({
                        status: 'done',
                        targetLang,
                        translationHtml: cached.html,
                        originalSanitized,
                        truncated: false,
                        error: null,
                    });
                }
                catch (err) {
                    if (this.props.message.id !== message.id) {
                        return;
                    }
                    this.setState({ status: 'error', error: err.message || String(err) });
                }
                return;
            }
            this._abort = new AbortController();
            const signal = this._abort.signal;
            this.setState({
                status: 'loading',
                error: null,
                targetLang,
                translationHtml: null,
                originalSanitized: null,
            });
            const baseUrl = (0, plugin_config_1.getLmstudioBaseUrl)();
            let modelId;
            try {
                modelId = await (0, lmstudio_client_1.getDefaultModelId)(baseUrl, signal);
            }
            catch (err) {
                if (signal.aborted || (err && err.name === 'AbortError')) {
                    return;
                }
                this.setState({ status: 'error', error: err.message || String(err) });
                return;
            }
            const { html: htmlIn, truncated } = (0, html_utils_1.truncateHtml)(message.body, MAX_HTML);
            let raw;
            try {
                raw = await (0, lmstudio_client_1.chat)(baseUrl, modelId, (0, lmstudio_client_1.buildTranslateHtmlMessages)(targetLang, htmlIn), CHAT_TOKENS, signal);
            }
            catch (err) {
                if (signal.aborted || (err && err.name === 'AbortError')) {
                    return;
                }
                this.setState({ status: 'error', error: err.message || String(err) });
                return;
            }
            if (signal.aborted) {
                return;
            }
            let translationHtml;
            let originalSanitized;
            try {
                const stripped = (0, lmstudio_client_1.stripHtmlFences)(raw);
                translationHtml = await mailspring_exports_1.SanitizeTransformer.run(stripped);
                originalSanitized = await originalPromise;
            }
            catch (err) {
                if (signal.aborted || (err && err.name === 'AbortError')) {
                    return;
                }
                this.setState({ status: 'error', error: err.message || String(err) });
                return;
            }
            if (this.props.message.id !== message.id) {
                return;
            }
            (0, translation_cache_1.setCachedTranslation)(cacheKey, targetLang, translationHtml);
            this.setState({
                status: 'done',
                targetLang,
                translationHtml,
                originalSanitized,
                truncated,
                error: null,
            });
        };
        this._onTabEnglish = () => {
            this.setState({ activeTab: 'english' });
        };
        this._onTabOriginal = () => {
            this.setState({ activeTab: 'original' });
        };
        this.state = {
            status: 'idle',
            error: null,
            targetLang: null,
            translationHtml: null,
            originalSanitized: null,
            truncated: false,
            activeTab: 'english',
        };
        this._abort = null;
        this._rootRef = null;
    }
    componentDidMount() {
        this._run();
    }
    componentDidUpdate(prevProps, prevState) {
        if (this.props.message &&
            prevProps.message &&
            this.props.message.id !== prevProps.message.id) {
            this._abortRun();
            this._setIframeVisible(true);
            this.setState({
                status: 'idle',
                error: null,
                targetLang: null,
                translationHtml: null,
                originalSanitized: null,
                truncated: false,
                activeTab: 'english',
            });
            this._run();
        }
        if (prevState.activeTab !== this.state.activeTab ||
            prevState.status !== this.state.status) {
            this._syncIframeHide();
        }
        if (this.state.status === 'error') {
            this._setIframeVisible(true);
        }
    }
    componentWillUnmount() {
        this._abortRun();
        this._setIframeVisible(true);
    }
    _syncIframeHide() {
        if (!(0, plugin_config_1.getHideOriginalIframe)()) {
            this._setIframeVisible(true);
            return;
        }
        const hide = this.state.status === 'done' && this.state.activeTab === 'english';
        this._setIframeVisible(!hide);
    }
    _setIframeVisible(show) {
        const root = this._rootRef;
        if (!root) {
            return;
        }
        const span = root.parentElement;
        if (!span) {
            return;
        }
        const iframes = span.querySelectorAll('iframe');
        const iframe = iframes.length ? iframes[iframes.length - 1] : null;
        if (!iframe) {
            return;
        }
        const wrap = iframe.parentElement;
        if (!wrap) {
            return;
        }
        if (show) {
            if (wrap.dataset.lmstudioSavedDisplay !== undefined) {
                wrap.style.display = wrap.dataset.lmstudioSavedDisplay;
                delete wrap.dataset.lmstudioSavedDisplay;
            }
        }
        else {
            if (wrap.dataset.lmstudioSavedDisplay === undefined) {
                wrap.dataset.lmstudioSavedDisplay = wrap.style.display || '';
            }
            wrap.style.display = 'none';
        }
    }
    _abortRun() {
        if (this._abort) {
            this._abort.abort();
            this._abort = null;
        }
    }
    render() {
        const { status, error, targetLang, translationHtml, originalSanitized, truncated, activeTab, } = this.state;
        if (status === 'skip' || status === 'idle') {
            return null;
        }
        if (status === 'loading') {
            return (mailspring_exports_1.React.createElement("div", { className: "lmstudio-translator lmstudio-translator--loading", ref: (el) => {
                    this._rootRef = el;
                } },
                mailspring_exports_1.React.createElement("span", { className: "lmstudio-translator__label" }, (0, mailspring_exports_1.localized)('Translation')),
                mailspring_exports_1.React.createElement("span", { className: "lmstudio-translator__status" }, (0, mailspring_exports_1.localized)('Translating with LM Studio…'))));
        }
        if (status === 'error') {
            return (mailspring_exports_1.React.createElement("div", { className: "lmstudio-translator lmstudio-translator--error", ref: (el) => {
                    this._rootRef = el;
                } },
                mailspring_exports_1.React.createElement("span", { className: "lmstudio-translator__label" }, (0, mailspring_exports_1.localized)('Translation')),
                mailspring_exports_1.React.createElement("span", { className: "lmstudio-translator__err" }, error)));
        }
        if (status !== 'done' || !translationHtml) {
            return null;
        }
        const langLabel = targetLang === 'ja' ? (0, mailspring_exports_1.localized)('Japanese') : (0, mailspring_exports_1.localized)('Chinese');
        return (mailspring_exports_1.React.createElement("div", { className: "lmstudio-translator lmstudio-translator--result", ref: (el) => {
                this._rootRef = el;
            } },
            mailspring_exports_1.React.createElement("div", { className: "lmstudio-translator__tabs" },
                mailspring_exports_1.React.createElement("button", { type: "button", className: activeTab === 'english'
                        ? 'lmstudio-translator__tab lmstudio-translator__tab--active'
                        : 'lmstudio-translator__tab', onClick: this._onTabEnglish }, (0, mailspring_exports_1.localized)('English')),
                mailspring_exports_1.React.createElement("button", { type: "button", className: activeTab === 'original'
                        ? 'lmstudio-translator__tab lmstudio-translator__tab--active'
                        : 'lmstudio-translator__tab', onClick: this._onTabOriginal },
                    (0, mailspring_exports_1.localized)('Original'),
                    " (",
                    langLabel,
                    ")")),
            truncated ? (mailspring_exports_1.React.createElement("div", { className: "lmstudio-translator__trunc-note" }, (0, mailspring_exports_1.localized)('Message was truncated for translation API'))) : null,
            activeTab === 'english' ? (mailspring_exports_1.React.createElement("div", { className: "lmstudio-translator__html lmstudio-translator__scroll", dangerouslySetInnerHTML: { __html: translationHtml } })) : (mailspring_exports_1.React.createElement("div", { className: "lmstudio-translator__html lmstudio-translator__scroll", dangerouslySetInnerHTML: {
                    __html: originalSanitized || '',
                } }))));
    }
}
exports.default = TranslationBodyHeader;
TranslationBodyHeader.displayName = 'TranslationBodyHeader';
TranslationBodyHeader.propTypes = {
    message: mailspring_exports_1.PropTypes.object.isRequired,
};
TranslationBodyHeader.containerStyles = {
    order: 0,
    flexShrink: 0,
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhbnNsYXRpb24tYm9keS1oZWFkZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvdHJhbnNsYXRpb24tYm9keS1oZWFkZXIuanN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsMkRBSzRCO0FBQzVCLDZDQUErQztBQUMvQywyREFBK0Y7QUFDL0YsdURBSzJCO0FBQzNCLDZDQUE2RDtBQUM3RCxtREFHeUI7QUFFekIsTUFBTSxRQUFRLEdBQUcsTUFBTSxDQUFDO0FBQ3hCLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQztBQUV6QixNQUFxQixxQkFBc0IsU0FBUSwwQkFBSyxDQUFDLFNBQVM7SUFPaEUsWUFBWSxLQUFLO1FBQ2YsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBdUdmLFNBQUksR0FBRyxLQUFLLElBQUksRUFBRTtZQUNoQixNQUFNLEVBQUUsT0FBTyxFQUFFLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUMvQixJQUFJLENBQUMsT0FBTyxJQUFJLE9BQU8sT0FBTyxDQUFDLElBQUksS0FBSyxRQUFRLEVBQUU7Z0JBQ2hELElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQztnQkFDbEMsT0FBTzthQUNSO1lBRUQsTUFBTSxLQUFLLEdBQUcsSUFBQSw0QkFBZSxFQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNuRCxNQUFNLFVBQVUsR0FBRyxJQUFBLDRCQUFlLEVBQUMsS0FBSyxDQUFDLENBQUM7WUFDMUMsSUFBSSxDQUFDLFVBQVUsRUFBRTtnQkFDZixJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7Z0JBQ2xDLE9BQU87YUFDUjtZQUVELE1BQU0sUUFBUSxHQUFHLElBQUEsZ0NBQVksRUFBQyxPQUFPLENBQUMsRUFBRSxFQUFFLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztZ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