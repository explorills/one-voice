import * as vscode from 'vscode';

export interface OneVoiceConfig {
  apiKey: string;
  model: string;
  language: string;
  maxDuration: number;
  soxPath: string;
  grammarCleanup: boolean;
  grammarModel: string;
  grammarPrompt: string;
  outputTarget: 'editor' | 'clipboard' | 'terminal';
}

export function getConfig(): OneVoiceConfig {
  const config = vscode.workspace.getConfiguration('one-voice');
  return {
    apiKey: config.get<string>('apiKey', ''),
    model: config.get<string>('model', 'gpt-4o-transcribe'),
    language: config.get<string>('language', 'en'),
    maxDuration: config.get<number>('maxDuration', 300),
    soxPath: config.get<string>('soxPath', 'sox'),
    grammarCleanup: config.get<boolean>('grammarCleanup', false),
    grammarModel: config.get<string>('grammarModel', 'gpt-4o-mini'),
    grammarPrompt: config.get<string>('grammarPrompt', ''),
    outputTarget: config.get<string>('outputTarget', 'clipboard') as OneVoiceConfig['outputTarget'],
  };
}

export function getApiKey(): string {
  const config = getConfig();
  if (config.apiKey) {
    return config.apiKey;
  }
  return process.env.OPENAI_API_KEY || '';
}
