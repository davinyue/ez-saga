declare module 'global/window' {
    const window: Window & typeof globalThis;
    export default window;
}

interface Window {
    app: any;
    terminalType: string;
    __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: any;
}
