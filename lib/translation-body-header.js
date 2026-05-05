"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mailspring_exports_1 = require("mailspring-exports");
const cjk_detect_1 = require("./cjk-detect");
const mailspring_translation_storage_1 = require("./mailspring-translation-storage");
const translate_pipeline_1 = require("./translate-pipeline");
const html_utils_1 = require("./html-utils");
const DONE_AUTO_HIDE_MS = 5000;
/**
 * `message:BodyHeader` — LM translation + minimal status (loading / done / error).
 * Translated HTML is applied via shared localStorage + MessageViewExtension (iframe).
 */
class TranslationBodyHeader extends mailspring_exports_1.React.Component {
    constructor(props) {
        super(props);
        this._subscribeMessageBodyProcessor = () => {
            this._unsubscribeMessageBodyProcessor();
            const { message } = this.props;
            if (!message) {
                return;
            }
            this._mbpUnsub = mailspring_exports_1.MessageBodyProcessor.subscribe(message, true, () => {
                this._abortRun();
                this._run();
            });
        };
        this._unsubscribeMessageBodyProcessor = () => {
            if (this._mbpUnsub) {
                this._mbpUnsub();
                this._mbpUnsub = null;
            }
        };
        this._run = async () => {
            const { message } = this.props;
            if (!message) {
                return;
            }
            if (typeof message.body !== 'string') {
                return;
            }
            let plain;
            try {
                plain = (0, html_utils_1.stripHtmlToText)(message.body).trim();
            }
            catch (e) {
                const msg = (e && e.message) || String(e);
                this.setState({ ui: 'error', errorText: msg });
                if (AppEnv.reportError) {
                    AppEnv.reportError(e);
                }
                return;
            }
            const targetLang = (0, cjk_detect_1.detectCjkTarget)(plain);
            if (!targetLang) {
                this.setState({ ui: 'idle', errorText: null });
                return;
            }
            if ((0, mailspring_translation_storage_1.hasCurrentTranslation)(message, targetLang)) {
                this.setState({ ui: 'idle', errorText: null });
                return;
            }
            this._clearDoneTimer();
            this._abort = new AbortController();
            const signal = this._abort.signal;
            const msgId = message.id;
            this.setState({ ui: 'loading', errorText: null });
            let translatedHtml;
            try {
                translatedHtml = await (0, translate_pipeline_1.translateBodyHtmlWithLmStudio)(targetLang, message.body, signal);
            }
            catch (err) {
                if (signal.aborted || (err && err.name === 'AbortError')) {
                    this.setState({ ui: 'idle', errorText: null });
                    return;
                }
                const msg = (err && err.message) || String(err);
                this.setState({ ui: 'error', errorText: msg });
                if (AppEnv.reportError) {
                    AppEnv.reportError(err);
                }
                return;
            }
            if (this.props.message.id !== msgId) {
                return;
            }
            if (!translatedHtml || !String(translatedHtml).trim()) {
                const msg = (0, mailspring_exports_1.localized)('LM Studio returned empty translation.');
                this.setState({ ui: 'error', errorText: msg });
                return;
            }
            (0, mailspring_translation_storage_1.persistTranslatedBody)(message, translatedHtml, {
                fromLang: targetLang,
                toLang: 'en',
            });
            try {
                mailspring_exports_1.MessageBodyProcessor.updateCacheForMessage(message);
            }
            catch (e) {
                const msg = (e && e.message) || String(e);
                this.setState({ ui: 'error', errorText: msg });
                if (AppEnv.reportError) {
                    AppEnv.reportError(e);
                }
                return;
            }
            this.setState({ ui: 'done', errorText: null });
            this._doneTimer = setTimeout(() => {
                this._doneTimer = null;
                if (this.props.message && this.props.message.id === msgId) {
                    this.setState({ ui: 'idle' });
                }
            }, DONE_AUTO_HIDE_MS);
        };
        this._abort = null;
        this._mbpUnsub = null;
        this._doneTimer = null;
        this.state = {
            ui: 'idle',
            errorText: null,
        };
    }
    componentDidMount() {
        this._subscribeMessageBodyProcessor();
        this._run();
    }
    componentDidUpdate(prevProps) {
        if (this.props.message &&
            prevProps.message &&
            this.props.message.id !== prevProps.message.id) {
            this._clearDoneTimer();
            this._abortRun();
            this.setState({ ui: 'idle', errorText: null });
            this._unsubscribeMessageBodyProcessor();
            this._subscribeMessageBodyProcessor();
            this._run();
            return;
        }
        if (this.props.message &&
            prevProps.message &&
            this.props.message.id === prevProps.message.id &&
            this.props.message !== prevProps.message &&
            typeof this.props.message.body === 'string' &&
            this.props.message.body !== prevProps.message.body) {
            this._abortRun();
            this._run();
        }
    }
    componentWillUnmount() {
        this._clearDoneTimer();
        this._abortRun();
        this._unsubscribeMessageBodyProcessor();
    }
    _clearDoneTimer() {
        if (this._doneTimer) {
            clearTimeout(this._doneTimer);
            this._doneTimer = null;
        }
    }
    _abortRun() {
        if (this._abort) {
            this._abort.abort();
            this._abort = null;
        }
    }
    render() {
        const { ui, errorText } = this.state;
        if (ui === 'loading') {
            return (mailspring_exports_1.React.createElement("div", { className: "lmstudio-translator lmstudio-translator--loading" },
                mailspring_exports_1.React.createElement("span", { className: "lmstudio-translator__label" }, (0, mailspring_exports_1.localized)('LM Studio')),
                mailspring_exports_1.React.createElement("span", { className: "lmstudio-translator__status" }, (0, mailspring_exports_1.localized)('Translating…'))));
        }
        if (ui === 'error' && errorText) {
            return (mailspring_exports_1.React.createElement("div", { className: "lmstudio-translator lmstudio-translator--error" },
                mailspring_exports_1.React.createElement("span", { className: "lmstudio-translator__label" }, (0, mailspring_exports_1.localized)('Translation failed')),
                mailspring_exports_1.React.createElement("span", { className: "lmstudio-translator__err" }, errorText)));
        }
        if (ui === 'done') {
            return (mailspring_exports_1.React.createElement("div", { className: "lmstudio-translator lmstudio-translator--done" },
                mailspring_exports_1.React.createElement("span", { className: "lmstudio-translator__label" }, (0, mailspring_exports_1.localized)('Translation applied')),
                mailspring_exports_1.React.createElement("span", { className: "lmstudio-translator__status" }, (0, mailspring_exports_1.localized)('English version is shown in the message below.'))));
        }
        return null;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhbnNsYXRpb24tYm9keS1oZWFkZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvdHJhbnNsYXRpb24tYm9keS1oZWFkZXIuanN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsMkRBSzRCO0FBQzVCLDZDQUErQztBQUMvQyxxRkFBZ0c7QUFDaEcsNkRBQXFFO0FBQ3JFLDZDQUErQztBQUUvQyxNQUFNLGlCQUFpQixHQUFHLElBQUksQ0FBQztBQUUvQjs7O0dBR0c7QUFDSCxNQUFxQixxQkFBc0IsU0FBUSwwQkFBSyxDQUFDLFNBQVM7SUFPaEUsWUFBWSxLQUFLO1FBQ2YsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBdURmLG1DQUE4QixHQUFHLEdBQUcsRUFBRTtZQUNwQyxJQUFJLENBQUMsZ0NBQWdDLEVBQUUsQ0FBQztZQUN4QyxNQUFNLEVBQUUsT0FBTyxFQUFFLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUMvQixJQUFJLENBQUMsT0FBTyxFQUFFO2dCQUNaLE9BQU87YUFDUjtZQUNELElBQUksQ0FBQyxTQUFTLEdBQUcseUNBQW9CLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFO2dCQUNsRSxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQ2pCLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNkLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDO1FBRUYscUNBQWdDLEdBQUcsR0FBRyxFQUFFO1lBQ3RDLElBQUksSUFBSSxDQUFDLFNBQVMsRUFBRTtnQkFDbEIsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUNqQixJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQzthQUN2QjtRQUNILENBQUMsQ0FBQztRQVNGLFNBQUksR0FBRyxLQUFLLElBQUksRUFBRTtZQUNoQixNQUFNLEVBQUUsT0FBTyxFQUFFLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUMvQixJ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