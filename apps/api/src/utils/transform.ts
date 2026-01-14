export function transformStringToBool({value}) {
  if (typeof value === 'boolean') return value;
  return value === 'true';
}
