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
  export const PropTypes: any;
  export const localized: (s: string) => string;
}
