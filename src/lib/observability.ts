import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

interface ObservabilityTags {
  userId?: string;
  sessionId?: string;
  documentType?: string;
  [key: string]: string | undefined;
}

export interface ObservableAI {
  genAI: GoogleGenerativeAI;
  requestOptions?: any;
}

export function getObservableGenerativeAI(tags?: ObservabilityTags): ObservableAI {
  const apiKey = process.env.GEMINI_API_KEY || '';
  const heliconeKey = process.env.HELICONE_API_KEY;

  if (heliconeKey) {
    const customHeaders: Record<string, string> = {
      'Helicone-Auth': `Bearer ${heliconeKey}`,
      'Helicone-Target-Url': 'https://generativelanguage.googleapis.com'
    };

    if (tags) {
      if (tags.userId) customHeaders['Helicone-User-Id'] = tags.userId;
      if (tags.sessionId) customHeaders['Helicone-Session-Id'] = tags.sessionId;
      Object.keys(tags).forEach((key) => {
        if (key !== 'userId' && key !== 'sessionId' && tags[key]) {
          customHeaders[`Helicone-Property-${key}`] = tags[key] as string;
        }
      });
    }

    return {
      genAI: new GoogleGenerativeAI(apiKey),
      requestOptions: {
        baseUrl: 'https://gateway.helicone.ai',
        customHeaders: customHeaders
      }
    };
  }

  // Fallback if Helicone is not configured
  return { genAI: new GoogleGenerativeAI(apiKey) };
}
