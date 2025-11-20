/**
 * 附带时间的 console.log
 * @param args
 *
 * @example
 * timeLog("Hello", "World"); // 14:30:00 Hello World
 */
export const timeLog = (...args: any[]) => {
  console.log(`${new Date().toLocaleTimeString()}`, ...args);
};
