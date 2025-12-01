/**
 * 深度合并两个对象，规则如下：
 * 1. 原始值覆盖：如果两个值都是原始类型（string、number、boolean、null、undefined、symbol、bigint），则用后者覆盖;
 * 2. 数组拼接：如果两个值都是数组，则拼接为大数组；
 * 3. 对象递归合并：如果两个值都是对象，则进行递归深度合并；
 * 4. 类型不匹配覆盖：如果两个值的类型不同，则用后者覆盖；
 * 5. 独有属性保留：如果字段只存在于其中一个对象中，则保留它。
 *
 * @template T 第一个对象
 * @template U 第二个对象
 * @param {T} obj1 要合并的第一个对象，相同字段可能会被 obj2 覆盖
 * @param {U} obj2 要合并的第二个对象
 */
export declare const mergeObjects: <T extends Record<string, any>, U extends Record<string, any>>(obj1: T, obj2: U) => T & U;
