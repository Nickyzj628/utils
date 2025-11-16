export const isObject = (value: any): value is object => {
  return value?.constructor === Object;
};
