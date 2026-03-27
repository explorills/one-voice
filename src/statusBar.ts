import * as vscode from 'vscode';

export type VoiceState = 'idle' | 'recording' | 'transcribing';

let statusBarItem: vscode.StatusBarItem;

export function createStatusBar(): vscode.StatusBarItem {
  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  statusBarItem.command = 'one-voice.toggleRecording';
  updateState('idle');
  statusBarItem.show();
  return statusBarItem;
}

export function updateState(state: VoiceState): void {
  switch (state) {
    case 'idle':
      statusBarItem.text = '$(mic) ONE Voice';
      statusBarItem.tooltip = 'Click to start recording (Pause/Break)';
      statusBarItem.backgroundColor = undefined;
      break;
    case 'recording':
      statusBarItem.text = '$(record) Recording...';
      statusBarItem.tooltip = 'Click to stop recording (Pause/Break)';
      statusBarItem.backgroundColor = new vscode.ThemeColor(
        'statusBarItem.warningBackground'
      );
      break;
    case 'transcribing':
      statusBarItem.text = '$(sync~spin) Transcribing...';
      statusBarItem.tooltip = 'Sending audio to Whisper API...';
      statusBarItem.backgroundColor = undefined;
      break;
  }
}

export function disposeStatusBar(): void {
  statusBarItem?.dispose();
}
