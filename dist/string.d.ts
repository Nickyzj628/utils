/**
 * 转换下划线命名法为驼峰命名法
 *
 * @example
 * snakeToCamel("user_name") // 'userName'
 */
export declare const snakeToCamel: (str: string) => string;
/**
 * 转换驼峰命名法为下划线命名法
 *
 * @example
 * camelToSnake("shouldComponentUpdate") // 'should_component_update'
 */
export declare const camelToSnake: (str: string) => string;
