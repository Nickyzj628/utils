/**
 * 转换下划线命名法为驼峰命名法
 *
 * @example
 * snakeToCamel("user_name") // 'userName'
 */
export const snakeToCamel = (str: string) => {
  return str.replace(/_([a-zA-Z])/g, (match, pattern) => pattern.toUpperCase());
};

/**
 * 转换驼峰命名法为下划线命名法
 *
 * @example
 * camelToSnake("shouldComponentUpdate") // 'should_component_update'
 */
export const camelToSnake = (str: string) => {
  return str.replace(
    /([A-Z])/g,
    (match, pattern) => `_${pattern.toLowerCase()}`,
  );
};
