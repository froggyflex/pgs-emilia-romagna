export function isAuthBypassed() {
  return process.env.NODE_ENV !== "production" && process.env.BYPASS_AUTH === "true";
}
