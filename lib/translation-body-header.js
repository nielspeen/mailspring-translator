"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mailspring_exports_1 = require("mailspring-exports");
const cjk_detect_1 = require("./cjk-detect");
const mailspring_translation_storage_1 = require("./mailspring-translation-storage");
const translate_pipeline_1 = require("./translate-pipeline");
const html_utils_1 = require("./html-utils");
const DONE_AUTO_HIDE_MS = 5000;
/** MessageBodyProcessor can fire many times while the HTML body is assembled; aborting on every tick cleared loading before LM finished. */
const PIPELINE_RUN_DEBOUNCE_MS = 400;
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
                this._scheduleRunFromPipeline();
            });
        };
        this._scheduleRunFromPipeline = () => {
            this._clearPipelineDebounce();
            this._pipelineDebounceTimer = setTimeout(() => {
                this._pipelineDebounceTimer = null;
                this._run();
            }, PIPELINE_RUN_DEBOUNCE_MS);
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
            this._abortRun();
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
        this._pipelineDebounceTimer = null;
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
            this._clearPipelineDebounce();
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
        this._clearPipelineDebounce();
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
    _clearPipelineDebounce() {
        if (this._pipelineDebounceTimer) {
            clearTimeout(this._pipelineDebounceTimer);
            this._pipelineDebounceTimer = null;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhbnNsYXRpb24tYm9keS1oZWFkZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvdHJhbnNsYXRpb24tYm9keS1oZWFkZXIuanN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsMkRBSzRCO0FBQzVCLDZDQUErQztBQUMvQyxxRkFBZ0c7QUFDaEcsNkRBQXFFO0FBQ3JFLDZDQUErQztBQUUvQyxNQUFNLGlCQUFpQixHQUFHLElBQUksQ0FBQztBQUMvQiw0SUFBNEk7QUFDNUksTUFBTSx3QkFBd0IsR0FBRyxHQUFHLENBQUM7QUFFckM7OztHQUdHO0FBQ0gsTUFBcUIscUJBQXNCLFNBQVEsMEJBQUssQ0FBQyxTQUFTO0lBT2hFLFlBQVksS0FBSztRQUNmLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztRQTBEZixtQ0FBOEIsR0FBRyxHQUFHLEVBQUU7WUFDcEMsSUFBSSxDQUFDLGdDQUFnQyxFQUFFLENBQUM7WUFDeEMsTUFBTSxFQUFFLE9BQU8sRUFBRSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDL0IsSUFBSSxDQUFDLE9BQU8sRUFBRTtnQkFDWixPQUFPO2FBQ1I7WUFDRCxJQUFJLENBQUMsU0FBUyxHQUFHLHlDQUFvQixDQUFDLFNBQVMsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRTtnQkFDbEUsSUFBSSxDQUFDLHdCQUF3QixFQUFFLENBQUM7WUFDbEMsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDLENBQUM7UUFTRiw2QkFBd0IsR0FBRyxHQUFHLEVBQUU7WUFDOUIsSUFBSSxDQUFDLHNCQUFzQixFQUFFLENBQUM7WUFDOUIsSUFBSSxDQUFDLHNCQUFzQixHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUU7Z0JBQzVDLElBQUksQ0FBQyxzQkFBc0IsR0FBRyxJQUFJLENBQUM7Z0JBQ25DLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNkLENBQUMsRUFBRSx3QkFBd0IsQ0FBQyxDQUFDO1FBQy9CLENB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