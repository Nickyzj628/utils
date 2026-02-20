export type Falsy = false | 0 | -0 | 0n | "" | null | undefined;
/**
 * 检测传入的值是否为**假值**（false、0、''、null、undefined、NaN等）
 *
 * @example
 * isFalsy(""); // true
 * isFalsy(1); // false
 */
export declare const isFalsy: (value: any) => value is Falsy;
