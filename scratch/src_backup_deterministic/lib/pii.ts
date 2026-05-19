/**
 * AI SHIELD: PII Sanitizer
 * Automatically masks sensitive information before sending data to external AI APIs.
 */

const PII_PATTERNS = {
  EMAIL: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  PHONE: /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
  CREDIT_CARD: /\b(?:\d[ -]*?){13,16}\b/g,
  SSN: /\b\d{3}-\d{2}-\d{4}\b/g,
  IP_ADDRESS: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
};

export function sanitizeInput(text: string): string {
  if (!text) return "";

  let sanitized = text;

  // Mask sensitive data
  sanitized = sanitized.replace(PII_PATTERNS.EMAIL, "[REDACTED_EMAIL]");
  sanitized = sanitized.replace(PII_PATTERNS.PHONE, "[REDACTED_PHONE]");
  sanitized = sanitized.replace(PII_PATTERNS.CREDIT_CARD, "[REDACTED_CARD]");
  sanitized = sanitized.replace(PII_PATTERNS.SSN, "[REDACTED_SSN]");
  sanitized = sanitized.replace(PII_PATTERNS.IP_ADDRESS, "[REDACTED_IP]");

  return sanitized;
}

export function hasPII(text: string): boolean {
  return Object.values(PII_PATTERNS).some(pattern => pattern.test(text));
}
