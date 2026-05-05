"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mailspring_exports_1 = require("mailspring-exports");
const lmstudio_client_1 = require("./lmstudio-client");
const MAX_CLASSIFY_CHARS = 6000;
const MAX_TRANSLATE_CHARS = 12000;
function getBaseUrl() {
    try {
        const v = AppEnv.config.get('mailspring-lmstudio-translator.lmstudioBaseUrl');
        if (v && typeof v === 'string') {
            return v.replace(/\/$/, '');
        }
    }
    catch (e) {
        /* config may be unavailable in edge cases */
    }
    return 'http://127.0.0.1:1234';
}
function stripHtmlToText(html) {
    if (typeof html !== 'string' || !html) {
        return '';
    }
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return (doc.body && doc.body.textContent) || '';
}
function truncate(s, n) {
    if (s.length <= n) {
        return s;
    }
    return s.slice(0, n) + '\n\n[… truncated for translation …]';
}
class TranslationBodyHeader extends mailspring_exports_1.React.Component {
    constructor(props) {
        super(props);
        this._run = async () => {
            const { message } = this.props;
            if (!message || typeof message.body !== 'string') {
                return;
            }
            const plain = stripHtmlToText(message.body).trim();
            if (!plain) {
                return;
            }
            this._abort = new AbortController();
            const signal = this._abort.signal;
            this.setState({ status: 'loading', error: null });
            const baseUrl = getBaseUrl();
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
            const snippet = truncate(plain, MAX_CLASSIFY_CHARS);
            let classifyAnswer;
            try {
                classifyAnswer = await (0, lmstudio_client_1.chat)(baseUrl, modelId, [
                    {
                        role: 'system',
                        content: 'You are a strict language classifier for email text. Reply with exactly one token: EN if the text is English, NL if it is Dutch, or OTHER if it is any other language or strongly mixed non-English/non-Dutch. No punctuation or explanation.',
                    },
                    {
                        role: 'user',
                        content: snippet,
                    },
                ], 16, signal);
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
            const tag = (0, lmstudio_client_1.parseLanguageTag)(classifyAnswer);
            const classification = tag || 'OTHER';
            if (classification === 'EN' || classification === 'NL') {
                this.setState({ status: 'done', classification, translation: null });
                return;
            }
            const toTranslate = truncate(plain, MAX_TRANSLATE_CHARS);
            const wasTruncated = plain.length > MAX_TRANSLATE_CHARS;
            let translation;
            try {
                translation = await (0, lmstudio_client_1.chat)(baseUrl, modelId, [
                    {
                        role: 'system',
                        content: 'You translate email text into clear English. Preserve meaning and tone. Reply with only the English translation, no title or quotes.',
                    },
                    {
                        role: 'user',
                        content: toTranslate,
                    },
                ], 8192, signal);
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
            this.setState({
                status: 'done',
                classification: 'OTHER',
                translation,
                truncated: wasTruncated,
            });
        };
        this.state = {
            status: 'idle',
            error: null,
            classification: null,
            translation: null,
            truncated: false,
        };
        this._abort = null;
    }
    componentDidMount() {
        this._run();
    }
    componentDidUpdate(prevProps) {
        if (this.props.message &&
            prevProps.message &&
            this.props.message.id !== prevProps.message.id) {
            this._abortRun();
            this.setState({
                status: 'idle',
                error: null,
                classification: null,
                translation: null,
                truncated: false,
            });
            this._run();
        }
    }
    componentWillUnmount() {
        this._abortRun();
    }
    _abortRun() {
        if (this._abort) {
            this._abort.abort();
            this._abort = null;
        }
    }
    render() {
        const { status, error, classification, translation, truncated } = this.state;
        if (status === 'idle' || status === 'loading') {
            return (mailspring_exports_1.React.createElement("div", { className: "lmstudio-translator lmstudio-translator--loading" },
                mailspring_exports_1.React.createElement("span", { className: "lmstudio-translator__label" }, (0, mailspring_exports_1.localized)('Translation')),
                mailspring_exports_1.React.createElement("span", { className: "lmstudio-translator__status" }, status === 'loading'
                    ? (0, mailspring_exports_1.localized)('Checking language via LM Studio…')
                    : '')));
        }
        if (status === 'error') {
            return (mailspring_exports_1.React.createElement("div", { className: "lmstudio-translator lmstudio-translator--error" },
                mailspring_exports_1.React.createElement("span", { className: "lmstudio-translator__label" }, (0, mailspring_exports_1.localized)('Translation')),
                mailspring_exports_1.React.createElement("span", { className: "lmstudio-translator__err" }, error)));
        }
        if (classification === 'EN' || classification === 'NL') {
            return null;
        }
        if (!translation) {
            return null;
        }
        return (mailspring_exports_1.React.createElement("div", { className: "lmstudio-translator lmstudio-translator--result" },
            mailspring_exports_1.React.createElement("div", { className: "lmstudio-translator__title" },
                (0, mailspring_exports_1.localized)('English translation'),
                truncated ? (mailspring_exports_1.React.createElement("span", { className: "lmstudio-translator__note" },
                    ' ',
                    "(",
                    (0, mailspring_exports_1.localized)('body truncated for API'),
                    ")")) : null),
            mailspring_exports_1.React.createElement("div", { className: "lmstudio-translator__text" }, translation)));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhbnNsYXRpb24tYm9keS1oZWFkZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvdHJhbnNsYXRpb24tYm9keS1oZWFkZXIuanN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsMkRBQWlFO0FBQ2pFLHVEQUE4RTtBQUU5RSxNQUFNLGtCQUFrQixHQUFHLElBQUksQ0FBQztBQUNoQyxNQUFNLG1CQUFtQixHQUFHLEtBQUssQ0FBQztBQUVsQyxTQUFTLFVBQVU7SUFDakIsSUFBSTtRQUNGLE1BQU0sQ0FBQyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLGdEQUFnRCxDQUFDLENBQUM7UUFDOUUsSUFBSSxDQUFDLElBQUksT0FBTyxDQUFDLEtBQUssUUFBUSxFQUFFO1lBQzlCLE9BQU8sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7U0FDN0I7S0FDRjtJQUFDLE9BQU8sQ0FBQyxFQUFFO1FBQ1YsNkNBQTZDO0tBQzlDO0lBQ0QsT0FBTyx1QkFBdUIsQ0FBQztBQUNqQyxDQUFDO0FBRUQsU0FBUyxlQUFlLENBQUMsSUFBSTtJQUMzQixJQUFJLE9BQU8sSUFBSSxLQUFLLFFBQVEsSUFBSSxDQUFDLElBQUksRUFBRTtRQUNyQyxPQUFPLEVBQUUsQ0FBQztLQUNYO0lBQ0QsTUFBTSxHQUFHLEdBQUcsSUFBSSxTQUFTLEVBQUUsQ0FBQyxlQUFlLENBQUMsSUFBSSxFQUFFLFdBQVcsQ0FBQyxDQUFDO0lBQy9ELE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksRUFBRSxDQUFDO0FBQ2xELENBQUM7QUFFRCxTQUFTLFFBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQztJQUNwQixJQUFJLENBQUMsQ0FBQyxNQUFNLElBQUksQ0FBQyxFQUFFO1FBQ2pCLE9BQU8sQ0FBQyxDQUFDO0tBQ1Y7SUFDRCxPQUFPLENBQUMsQ0FBQyxL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