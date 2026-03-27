import * as vscode from 'vscode';

export interface OneVoiceConfig {
  apiKey: string;
  model: string;
  language: string;
  maxDuration: number;
  soxPath: string;
}

export function getConfig(): OneVoiceConfig {
  const config = vscode.workspace.getConfiguration('one-voice');
  return {
    apiKey: config.get<string>('apiKey', ''),
    model: config.get<string>('model', 'whisper-1'),
    language: config.get<string>('language', 'en'),
    maxDuration: config.get<number>('maxDuration', 300),
    soxPath: config.get<string>('soxPath', 'sox'),
  };
}

export function getApiKey(): string {
  const config = getConfig();
  if (config.apiKey) {
    return config.apiKey;
  }
  return process.env.OPENAI_API_KEY || '';
}
