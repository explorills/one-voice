import * as vscode from 'vscode';

export type VoiceState = 'idle' | 'recording' | 'transcribing';

let statusBarItem: vscode.StatusBarItem;
let timerInterval: NodeJS.Timeout | null = null;
let recordingStartTime: number = 0;
let maxDurationSeconds: number = 0;

export function createStatusBar(): vscode.StatusBarItem {
  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    500
  );
  statusBarItem.command = 'one-voice.toggleRecording';
  updateState('idle');
  statusBarItem.show();
  return statusBarItem;
}

export function updateState(state: VoiceState, maxDuration?: number): void {
  stopTimer();

  switch (state) {
    case 'idle':
      statusBarItem.text = '$(mic) ONE voice';
      statusBarItem.tooltip = 'Click to start recording (Pause/Break or Ctrl+Shift+R)';
      statusBarItem.color = '#8fdf8f';
      statusBarItem.backgroundColor = undefined;
      break;
    case 'recording':
      maxDurationSeconds = maxDuration || 300;
      recordingStartTime = Date.now();
      statusBarItem.text = '$(record) ONE voice 0:00';
      statusBarItem.tooltip = `Recording... Click to stop (max ${formatTime(maxDurationSeconds)})`;
      statusBarItem.color = undefined;
      statusBarItem.backgroundColor = new vscode.ThemeColor(
        'statusBarItem.warningBackground'
      );
      startTimer();
      break;
    case 'transcribing':
      statusBarItem.text = '$(sync~spin) ONE voice transcribing...';
      statusBarItem.tooltip = 'Sending audio to Whisper API...';
      statusBarItem.color = undefined;
      statusBarItem.backgroundColor = undefined;
      break;
  }
}

function startTimer(): void {
  timerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
    statusBarItem.text = `$(record) ONE voice ${formatTime(elapsed)}`;
    statusBarItem.tooltip = `Recording... ${formatTime(elapsed)} / ${formatTime(maxDurationSeconds)} — Click to stop`;
  }, 1000);
}

function stopTimer(): void {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function disposeStatusBar(): void {
  stopTimer();
  statusBarItem?.dispose();
}
