import * as vscode from 'vscode';
import { createStatusBar, updateState, disposeStatusBar } from './statusBar';
import { checkSoxAvailable, startRecording, stopRecording, didHitTimeout, cleanup as cleanupRecorder } from './recorder';
import { transcribe } from './transcriber';
import { getConfig, getApiKey } from './config';

type State = 'idle' | 'recording' | 'transcribing';
let currentState: State = 'idle';

function openSettings(setting?: string) {
  vscode.commands.executeCommand(
    'workbench.action.openSettings',
    setting || 'one-voice'
  );
}

export async function activate(context: vscode.ExtensionContext) {
  try {
    const statusBar = createStatusBar();
    context.subscriptions.push(statusBar);

    const toggleCommand = vscode.commands.registerCommand(
      'one-voice.toggleRecording',
      handleToggle
    );
    context.subscriptions.push(toggleCommand);

    const keybindingCommand = vscode.commands.registerCommand(
      'one-voice.changeKeybinding',
      () => {
        vscode.commands.executeCommand(
          'workbench.action.openGlobalKeybindings',
          'one-voice.toggleRecording'
        );
      }
    );
    context.subscriptions.push(keybindingCommand);

    const config = getConfig();
    checkSoxAvailable(config.soxPath).then((available) => {
      if (!available) {
        vscode.window.showWarningMessage(
          'ONE voice: sox is not installed. Recording will not work. Install: sudo apt install sox',
          'Open Settings'
        ).then((action) => {
          if (action === 'Open Settings') { openSettings('one-voice.soxPath'); }
        });
      }
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    vscode.window.showErrorMessage(`ONE voice failed to activate: ${msg}`);
  }
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
        'ONE voice: Transcription in progress, please wait...'
      );
      break;
  }
}

async function handleStartRecording() {
  const config = getConfig();

  if (config.outputTarget === 'editor' && !vscode.window.activeTextEditor) {
    vscode.window.showErrorMessage(
      'ONE voice: Open a file first, or change output target to clipboard or terminal.',
      'Open Settings'
    ).then((action) => {
      if (action === 'Open Settings') { openSettings('one-voice.outputTarget'); }
    });
    return;
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    vscode.window.showErrorMessage(
      'ONE voice: Set your OpenAI API key in Settings (one-voice.apiKey) or OPENAI_API_KEY env var.',
      'Open Settings'
    ).then((action) => {
      if (action === 'Open Settings') { openSettings('one-voice.apiKey'); }
    });
    return;
  }

  currentState = 'recording';
  updateState('recording', config.maxDuration);

  try {
    const filePath = await startRecording(config.soxPath, config.maxDuration);

    // Transition immediately — don't block on the warning
    currentState = 'transcribing';
    updateState('transcribing');

    if (didHitTimeout()) {
      // Non-blocking notification with settings button
      vscode.window.showWarningMessage(
        `ONE voice: Max recording duration (${config.maxDuration}s) reached. Transcribing what was recorded. You can increase this in settings.`,
        'Open Settings'
      ).then((action) => {
        if (action === 'Open Settings') { openSettings('one-voice.maxDuration'); }
      });
    }

    const result = await transcribe({
      filePath,
      apiKey,
      model: config.model,
      language: config.language,
      grammarCleanup: config.grammarCleanup,
      grammarModel: config.grammarModel,
      grammarPrompt: config.grammarPrompt,
    });

    const text = result.text.trim();
    if (!text) {
      return;
    }

    // Build status message
    const grammarStatus = config.grammarCleanup
      ? (result.grammarApplied ? 'grammar applied' : 'grammar failed, raw output')
      : 'raw';

    switch (config.outputTarget) {
      case 'clipboard':
        await vscode.env.clipboard.writeText(text);
        vscode.window.showInformationMessage(`ONE voice: Copied to clipboard (${grammarStatus}).`);
        break;

      case 'terminal': {
        const terminal = vscode.window.activeTerminal;
        if (terminal) {
          terminal.sendText(text, false);
          terminal.show();
        } else {
          await vscode.env.clipboard.writeText(text);
          vscode.window.showWarningMessage(
            'ONE voice: No active terminal. Copied to clipboard instead.',
            'Change Output Target'
          ).then((action) => {
            if (action === 'Change Output Target') { openSettings('one-voice.outputTarget'); }
          });
        }
        break;
      }

      case 'editor':
      default: {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          await editor.edit((editBuilder) => {
            const selection = editor.selection;
            if (selection.isEmpty) {
              editBuilder.insert(selection.active, text);
            } else {
              editBuilder.replace(selection, text);
            }
          });
        } else {
          await vscode.env.clipboard.writeText(text);
          vscode.window.showWarningMessage(
            'ONE voice: No active editor. Copied to clipboard instead.',
            'Change Output Target'
          ).then((action) => {
            if (action === 'Change Output Target') { openSettings('one-voice.outputTarget'); }
          });
        }
        break;
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    vscode.window.showErrorMessage(`ONE voice: ${message}`, 'Open Settings').then((action) => {
      if (action === 'Open Settings') { openSettings(); }
    });
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
