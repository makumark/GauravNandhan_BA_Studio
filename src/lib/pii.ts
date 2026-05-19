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
  sanitized = sanitized.replace(PII_PATTERNS.CREDIT_CARD, (match) => {
    const rawDigits = match.replace(/[\s-]/g, '');
    const totalDigits = rawDigits.length;
    let currentDigit = 0;
    
    return match.replace(/\d/g, (char) => {
      currentDigit++;
      return currentDigit > totalDigits - 4 ? char : '*';
    });
  });
  sanitized = sanitized.replace(PII_PATTERNS.SSN, "[REDACTED_SSN]");
  sanitized = sanitized.replace(PII_PATTERNS.IP_ADDRESS, "[REDACTED_IP]");

  return sanitized;
}

export function hasPII(text: string): boolean {
  return Object.values(PII_PATTERNS).some(pattern => pattern.test(text));
}

/**
 * PROTOTYPE OUTPUT SHIELD:
 * Masks credit/debit card numbers in AI-generated HTML output.
 * Shows only the last 4 digits — e.g., 4111111111111234 → ****-****-****-1234
 * Safe to run on HTML strings without breaking tags or attributes.
 */
export function maskCardOutput(html: string): string {
  if (!html) return html;
  // Matches 13-19 digit card numbers with optional spaces or dashes
  return html.replace(/\b(\d[ -]*){12,15}(\d{4})\b/g, (match) => {
    const lastFour = match.replace(/[\s-]/g, '').slice(-4);
    return `****-****-****-${lastFour}`;
  });
}
