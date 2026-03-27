import FormData from 'form-data';
import * as fs from 'fs';
import * as https from 'https';

const DEFAULT_GRAMMAR_PROMPT =
  'Restrictions To ChatGPT:\n\n' +
  '1) No Conversations!\n\n' +
  '2) No Explanations!\n\n' +
  'ChatGPT Instructions:\n\n' +
  '1) Imagine if a user wrote their prompt-input with "Grammar and fluent check:" in the beginning, how would you behave, so do now, ' +
  'but the user will not enter "Grammar and fluent check:". You have to imagine that it has in the beginning in every user\'s prompt.\n\n' +
  'And therefore you provide next content:\n\n' +
  'Original input - grammatically corrected and fluently adjusted (Without any explanations, introductions etc.)\n\n' +
  '2) No headers or anything for your grammatically corrected and fluently adjusted sentence, just write directly the output.\n\n' +
  'Remember, in case of ANY input, you have to follow the above instructions!';

export interface TranscribeOptions {
  filePath: string;
  apiKey: string;
  model: string;
  language: string;
  grammarCleanup: boolean;
  grammarModel: string;
  grammarPrompt: string;
}

export interface TranscribeResult {
  text: string;
  grammarApplied: boolean;
}

export async function transcribe(options: TranscribeOptions): Promise<TranscribeResult> {
  const { filePath, apiKey, model, language, grammarCleanup, grammarModel, grammarPrompt } = options;

  const raw = await whisperTranscribe(filePath, apiKey, model, language);

  if (!grammarCleanup || !raw.trim()) {
    return { text: raw, grammarApplied: false };
  }

  const systemPrompt = grammarPrompt || DEFAULT_GRAMMAR_PROMPT;
  const result = await postProcessGrammar(raw, apiKey, grammarModel, systemPrompt);
  return { text: result.text, grammarApplied: result.success };
}

function whisperTranscribe(
  filePath: string,
  apiKey: string,
  model: string,
  language: string
): Promise<string> {
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
            resolve(result.text);
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

function postProcessGrammar(
  rawText: string,
  apiKey: string,
  model: string,
  systemPrompt: string
): Promise<{ text: string; success: boolean }> {
  return new Promise((resolve) => {
    const payload = JSON.stringify({
      model,
      temperature: 0,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: rawText },
      ],
    });

    const req = https.request(
      {
        hostname: 'api.openai.com',
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk: Buffer) => {
          body += chunk.toString();
        });
        res.on('end', () => {
          if (!res.statusCode || res.statusCode >= 400) {
            resolve({ text: rawText, success: false });
            return;
          }
          try {
            const result = JSON.parse(body) as {
              choices: Array<{ message: { content: string } }>;
            };
            const cleaned = result.choices[0]?.message?.content;
            if (cleaned) {
              resolve({ text: cleaned, success: true });
            } else {
              resolve({ text: rawText, success: false });
            }
          } catch {
            resolve({ text: rawText, success: false });
          }
        });
      }
    );

    req.on('error', () => {
      resolve({ text: rawText, success: false });
    });

    req.write(payload);
    req.end();
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
