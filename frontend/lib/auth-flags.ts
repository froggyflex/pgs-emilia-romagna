export function isAuthBypassed() {
  return process.env.BYPASS_AUTH === "true";
}
