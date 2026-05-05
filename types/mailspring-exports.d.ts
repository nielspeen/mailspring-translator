declare const AppEnv: {
  config: { get: (key: string) => any };
  isMainWindow?: () => boolean;
  reportError?: (err: Error) => void;
};

declare module 'mailspring-exports' {
  export const React: any;
  export const ComponentRegistry: {
    register: (component: any, opts: { role?: string; location?: any }) => void;
    unregister: (component: any) => void;
  };
  export class MessageViewExtension {
    static formatMessageBody(opts: { message: any }): void;
  }
  export const ExtensionRegistry: {
    MessageView: {
      register: (ext: typeof MessageViewExtension) => void;
      unregister: (ext: typeof MessageViewExtension) => void;
    };
  };
  export const PropTypes: any;
  export const localized: (s: string) => string;
  export const SanitizeTransformer: {
    run: (html: string) => Promise<string>;
  };
  export const MessageStore: {
    listen: (cb: () => void) => () => void;
    items: () => any[];
  };
  export const DatabaseStore: {
    listen: (cb: () => void) => () => void;
  };
  export const MessageBodyProcessor: {
    updateCacheForMessage: (message: any) => void | Promise<void>;
  };
}
