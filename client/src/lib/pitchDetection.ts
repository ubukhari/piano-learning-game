const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const A4_FREQ = 440;
const MIN_VOLUME_THRESHOLD = 0.015;

export interface DetectedNote {
  note: string;
  octave: number;
  fullName: string;
  frequency: number;
  volume: number;
}

export function frequencyToNote(freq: number): { note: string; octave: number; cents: number } {
  const semitones = 12 * Math.log2(freq / A4_FREQ);
  const roundedSemitones = Math.round(semitones);
  const cents = Math.round((semitones - roundedSemitones) * 100);
  const noteIndex = ((roundedSemitones % 12) + 12 + 9) % 12;
  const octave = Math.floor((roundedSemitones + 9) / 12) + 4;
  return { note: NOTE_NAMES[noteIndex], octave, cents };
}

export function noteToDisplayName(noteName: string): string {
  return noteName.replace("#", "#").replace("b", "b");
}

export function areNotesEqual(detected: string, target: string, toleranceSemitones: number = 1): boolean {
  const detectedMidi = noteNameToMidi(detected);
  const targetMidi = noteNameToMidi(target);
  if (detectedMidi === -1 || targetMidi === -1) return false;
  return Math.abs(detectedMidi - targetMidi) <= toleranceSemitones;
}

function noteNameToMidi(name: string): number {
  const match = name.match(/^([A-G])(#|b)?(\d+)$/);
  if (!match) return -1;
  const [, letter, accidental, octaveStr] = match;
  const baseNotes: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  let semitone = baseNotes[letter];
  if (accidental === "#") semitone += 1;
  if (accidental === "b") semitone -= 1;
  return (parseInt(octaveStr) + 1) * 12 + semitone;
}

export class PitchDetector {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private stream: MediaStream | null = null;
  private buffer: Float32Array = new Float32Array(0);
  private isRunning = false;

  async start(): Promise<void> {
    if (this.isRunning) return;
    this.audioContext = new AudioContext();
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    });
    const source = this.audioContext.createMediaStreamSource(this.stream);
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 4096;
    this.buffer = new Float32Array(this.analyser.fftSize);
    source.connect(this.analyser);
    this.isRunning = true;
  }

  stop(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.isRunning = false;
  }

  detect(): DetectedNote | null {
    if (!this.analyser || !this.isRunning) return null;
    this.analyser.getFloatTimeDomainData(this.buffer);

    let rms = 0;
    for (let i = 0; i < this.buffer.length; i++) {
      rms += this.buffer[i] * this.buffer[i];
    }
    rms = Math.sqrt(rms / this.buffer.length);
    if (rms < MIN_VOLUME_THRESHOLD) return null;

    const freq = this.autoCorrelate(this.buffer, this.audioContext!.sampleRate);
    if (freq === -1) return null;
    if (freq < 60 || freq > 2000) return null;

    const { note, octave } = frequencyToNote(freq);
    return {
      note,
      octave,
      fullName: `${note}${octave}`,
      frequency: freq,
      volume: rms,
    };
  }

  private autoCorrelate(buf: Float32Array, sampleRate: number): number {
    const SIZE = buf.length;
    let bestOffset = -1;
    let bestCorrelation = 0;
    let foundGoodCorrelation = false;
    const correlations = new Float32Array(SIZE);

    const minPeriod = Math.floor(sampleRate / 2000);
    const maxPeriod = Math.floor(sampleRate / 60);

    for (let offset = minPeriod; offset < maxPeriod && offset < SIZE; offset++) {
      let correlation = 0;
      let norm1 = 0;
      let norm2 = 0;
      for (let i = 0; i < SIZE - offset; i++) {
        correlation += buf[i] * buf[i + offset];
        norm1 += buf[i] * buf[i];
        norm2 += buf[i + offset] * buf[i + offset];
      }
      const denom = Math.sqrt(norm1 * norm2);
      correlation = denom > 0 ? correlation / denom : 0;
      correlations[offset] = correlation;

      if (correlation > 0.9 && correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestOffset = offset;
        foundGoodCorrelation = true;
      } else if (foundGoodCorrelation && correlation < 0.85) {
        break;
      }
    }

    if (!foundGoodCorrelation || bestOffset === -1) {
      for (let offset = minPeriod; offset < maxPeriod && offset < SIZE; offset++) {
        if (correlations[offset] > 0.7 && correlations[offset] > bestCorrelation) {
          bestCorrelation = correlations[offset];
          bestOffset = offset;
        }
      }
    }

    if (bestCorrelation < 0.7 || bestOffset < 1) return -1;

    const prev = correlations[bestOffset - 1] || 0;
    const curr = correlations[bestOffset];
    const next = correlations[bestOffset + 1] || 0;
    const shift = (prev - next) / (2 * (prev - 2 * curr + next));
    const refinedOffset = bestOffset + (isFinite(shift) ? shift : 0);

    return sampleRate / refinedOffset;
  }
}
