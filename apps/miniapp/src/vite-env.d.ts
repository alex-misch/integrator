/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />
/// <reference types="yandex-maps" />

// https://vitejs.dev/guide/env-and-mode.html
interface ImportMetaEnv {
    VITE_API_URL: string
    VITE_YMAPS_API_KEY?: string
    // NOTE that any new env vars must be added to vite.config.lib.ts for downstream retention/replacement
    //  otherwise they will be removed by the build process.
}

interface ImportMeta {
    readonly env: ImportMetaEnv
    readonly hot?: ViteHotContext
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ModuleNamespace = Record<string, any> & {
    [Symbol.toStringTag]: 'Module'
}

// https://vitejs.dev/guide/api-hmr.html
interface ViteHotContext {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    readonly data: any

    // accept(): void
    accept(cb?: (mod: ModuleNamespace | undefined) => void): void
    accept(dep: string, cb: (mod: ModuleNamespace | undefined) => void): void
    accept(deps: readonly string[], cb: (mods: Array<ModuleNamespace | undefined>) => void): void

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dispose(cb: (data: any) => void): void
    decline(): void
    invalidate(): void

    // `InferCustomEventPayload` provides types for built-in Vite events
    on<T extends string>(event: T, cb: (payload: InferCustomEventPayload<T>) => void): void
    send<T extends string>(event: T, data?: InferCustomEventPayload<T>): void
}

// Allow for virtual module imports
// https://vitejs.dev/guide/api-plugin.html#virtual-modules-convention
declare module 'virtual:*'
