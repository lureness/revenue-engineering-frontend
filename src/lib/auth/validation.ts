export function isValidEmail(value: string) {
  return /\S+@\S+\.\S+/.test(value);
}

export function isValidPasswordLength(value: string) {
  return value.length >= 8;
}
