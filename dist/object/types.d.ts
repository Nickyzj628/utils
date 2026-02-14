export type DeepMapKeys<T> = T extends Array<infer U> ? Array<DeepMapKeys<U>> : T extends object ? {
    [key: string]: DeepMapKeys<T[keyof T]>;
} : T;
export type DeepMapValues<T, R> = T extends Array<infer U> ? Array<DeepMapValues<U, R>> : T extends object ? {
    [K in keyof T]: T[K] extends object ? DeepMapValues<T[K], R> : R;
} : R;
