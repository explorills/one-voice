import FormData from 'form-data';
import * as fs from 'fs';
import * as https from 'https';

export interface TranscribeOptions {
  filePath: string;
  apiKey: string;
  model: string;
  language: string;
}

export interface TranscribeResult {
  text: string;
}

export function transcribe(options: TranscribeOptions): Promise<TranscribeResult> {
  const { filePath, apiKey, model, language } = options;

  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath), {
      filename: 'recording.wav',
      contentType: 'audio/wav',
    });
    form.append('model', model);
    form.append('language', language);
    form.append('response_format', 'json');

    const req = https.request(
      {
        hostname: 'api.openai.com',
        path: '/v1/audio/transcriptions',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          ...form.getHeaders(),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk: Buffer) => {
          body += chunk.toString();
        });
        res.on('end', () => {
          if (!res.statusCode || res.statusCode >= 400) {
            reject(createApiError(res.statusCode, body));
            return;
          }
          try {
            const result = JSON.parse(body) as { text: string };
            resolve({ text: result.text });
          } catch {
            reject(new Error(`Invalid response from OpenAI API: ${body.slice(0, 200)}`));
          }
        });
      }
    );

    req.on('error', (err) => {
      reject(new Error(`Network error: could not reach OpenAI API. ${err.message}`));
    });

    form.pipe(req);
  });
}

function createApiError(statusCode: number | undefined, body: string): Error {
  switch (statusCode) {
    case 401:
      return new Error('Invalid OpenAI API key. Check your configuration.');
    case 429:
      return new Error('OpenAI rate limit exceeded. Wait a moment and try again.');
    default:
      if (statusCode && statusCode >= 500) {
        return new Error(`OpenAI API error (${statusCode}). Try again later.`);
      }
      return new Error(`OpenAI API error (${statusCode}): ${body.slice(0, 200)}`);
  }
}
