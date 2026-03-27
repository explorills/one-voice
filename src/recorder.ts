import { spawn, execFile, ChildProcess } from 'child_process';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

const TEMP_FILE = path.join(os.tmpdir(), 'one-voice-recording.wav');

let soxProcess: ChildProcess | null = null;
let resolveRecording: ((filePath: string) => void) | null = null;
let rejectRecording: ((error: Error) => void) | null = null;
let timeoutHandle: NodeJS.Timeout | null = null;
let hitTimeout = false;

export function checkSoxAvailable(soxPath: string): Promise<boolean> {
  return new Promise((resolve) => {
    execFile('which', [soxPath], (error) => {
      resolve(!error);
    });
  });
}

export function startRecording(soxPath: string, maxDuration: number): Promise<string> {
  hitTimeout = false;

  return new Promise((resolve, reject) => {
    resolveRecording = resolve;
    rejectRecording = reject;

    soxProcess = spawn(soxPath, [
      '-d',          // default audio device
      '-r', '16000', // 16kHz sample rate (Whisper optimal)
      '-c', '1',     // mono
      '-b', '16',    // 16-bit
      TEMP_FILE,
    ]);

    soxProcess.on('error', (err) => {
      clearTimer();
      soxProcess = null;
      resolveRecording = null;
      rejectRecording = null;
      reject(new Error(`Failed to start sox: ${err.message}`));
    });

    soxProcess.on('close', (code) => {
      clearTimer();
      soxProcess = null;
      const res = resolveRecording;
      const rej = rejectRecording;
      resolveRecording = null;
      rejectRecording = null;

      if (code === 0 || code === null) {
        res?.(TEMP_FILE);
      } else {
        rej?.(new Error(`sox exited with code ${code}. Check your audio device.`));
      }
    });

    timeoutHandle = setTimeout(() => {
      timeoutHandle = null;
      hitTimeout = true;
      stopRecording();
    }, maxDuration * 1000);
  });
}

export function stopRecording(): void {
  if (soxProcess && !soxProcess.killed) {
    soxProcess.kill('SIGTERM');
  }
  clearTimer();
}

export function didHitTimeout(): boolean {
  return hitTimeout;
}

export function isRecording(): boolean {
  return soxProcess !== null && !soxProcess.killed;
}

export function cleanup(): void {
  stopRecording();
  try {
    if (fs.existsSync(TEMP_FILE)) {
      fs.unlinkSync(TEMP_FILE);
    }
  } catch {
    // ignore cleanup errors
  }
}

function clearTimer(): void {
  if (timeoutHandle) {
    clearTimeout(timeoutHandle);
    timeoutHandle = null;
  }
}
