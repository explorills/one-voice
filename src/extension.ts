import * as vscode from 'vscode';
import { createStatusBar, updateState, disposeStatusBar } from './statusBar';
import { checkSoxAvailable, startRecording, stopRecording, isRecording, cleanup as cleanupRecorder } from './recorder';
import { transcribe } from './transcriber';
import { getConfig, getApiKey } from './config';

type State = 'idle' | 'recording' | 'transcribing';
let currentState: State = 'idle';

export async function activate(context: vscode.ExtensionContext) {
  const statusBar = createStatusBar();
  context.subscriptions.push(statusBar);

  const config = getConfig();
  const soxAvailable = await checkSoxAvailable(config.soxPath);
  if (!soxAvailable) {
    vscode.window.showWarningMessage(
      'ONE Voice: sox is not installed. Recording will not work. Install: sudo apt install sox'
    );
  }

  const toggleCommand = vscode.commands.registerCommand(
    'one-voice.toggleRecording',
    handleToggle
  );
  context.subscriptions.push(toggleCommand);
}

async function handleToggle() {
  switch (currentState) {
    case 'idle':
      await handleStartRecording();
      break;
    case 'recording':
      handleStopRecording();
      break;
    case 'transcribing':
      vscode.window.showInformationMessage(
        'ONE Voice: Transcription in progress, please wait...'
      );
      break;
  }
}

async function handleStartRecording() {
  if (!vscode.window.activeTextEditor) {
    vscode.window.showErrorMessage('ONE Voice: Open a file first to use voice transcription.');
    return;
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    vscode.window.showErrorMessage(
      'ONE Voice: Set your OpenAI API key in Settings (one-voice.apiKey) or OPENAI_API_KEY env var.'
    );
    return;
  }

  const config = getConfig();

  currentState = 'recording';
  updateState('recording');

  try {
    const filePath = await startRecording(config.soxPath, config.maxDuration);

    currentState = 'transcribing';
    updateState('transcribing');

    const result = await transcribe({
      filePath,
      apiKey,
      model: config.model,
      language: config.language,
    });

    const editor = vscode.window.activeTextEditor;
    if (editor && result.text.trim()) {
      await editor.edit((editBuilder) => {
        const selection = editor.selection;
        if (selection.isEmpty) {
          editBuilder.insert(selection.active, result.text);
        } else {
          editBuilder.replace(selection, result.text);
        }
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    vscode.window.showErrorMessage(`ONE Voice: ${message}`);
  } finally {
    currentState = 'idle';
    updateState('idle');
  }
}

function handleStopRecording() {
  stopRecording();
}

export function deactivate() {
  cleanupRecorder();
  disposeStatusBar();
}
