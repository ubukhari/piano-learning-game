import { type SongChart, type SongNote, getNoteLane, getLaneNotes } from "./songCharts";
import { type DetectedNote, PitchDetector, areNotesEqual } from "./pitchDetection";

export type GameState = "idle" | "countdown" | "playing" | "paused" | "finished";

export interface NoteState {
  note: SongNote;
  lane: number;
  hit: boolean;
  missed: boolean;
  y: number;
}

export interface GameStats {
  totalNotes: number;
  hitNotes: number;
  streak: number;
  bestStreak: number;
  score: number;
}

export interface GameSnapshot {
  state: GameState;
  elapsed: number;
  countdown: number;
  notes: NoteState[];
  stats: GameStats;
  detectedNote: DetectedNote | null;
  lanes: string[];
  songName: string;
  levelLabel: string;
  duration: number;
}

const FALL_TIME = 3.0;
const HIT_WINDOW = 0.8;
const VISIBLE_AHEAD = 5.0;

export class GameEngine {
  private chart: SongChart;
  private lanes: string[];
  private noteStates: NoteState[];
  private stats: GameStats;
  private state: GameState = "idle";
  private startTime = 0;
  private elapsed = 0;
  private countdown = 3;
  private countdownStart = 0;
  private pitchDetector: PitchDetector;
  private detectedNote: DetectedNote | null = null;
  private animFrameId = 0;
  private onUpdate: (snapshot: GameSnapshot) => void;
  private pauseElapsed = 0;

  constructor(chart: SongChart, onUpdate: (snapshot: GameSnapshot) => void) {
    this.chart = chart;
    this.lanes = getLaneNotes(chart.level);
    this.noteStates = chart.notes.map((n) => ({
      note: n,
      lane: getNoteLane(n.note, this.lanes),
      hit: false,
      missed: false,
      y: 0,
    }));
    this.stats = { totalNotes: chart.notes.length, hitNotes: 0, streak: 0, bestStreak: 0, score: 0 };
    this.pitchDetector = new PitchDetector();
    this.onUpdate = onUpdate;
  }

  async startCountdown(): Promise<void> {
    await this.pitchDetector.start();
    this.state = "countdown";
    this.countdown = 3;
    this.countdownStart = performance.now() / 1000;
    this.loop();
  }

  pause(): void {
    if (this.state === "playing") {
      this.state = "paused";
      this.pauseElapsed = this.elapsed;
      cancelAnimationFrame(this.animFrameId);
      this.onUpdate(this.getSnapshot());
    }
  }

  resume(): void {
    if (this.state === "paused") {
      this.state = "playing";
      this.startTime = performance.now() / 1000 - this.pauseElapsed;
      this.onUpdate(this.getSnapshot());
      this.loop();
    }
  }

  stop(): void {
    this.state = "idle";
    cancelAnimationFrame(this.animFrameId);
    this.pitchDetector.stop();
  }

  getSnapshot(): GameSnapshot {
    return {
      state: this.state,
      elapsed: this.elapsed,
      countdown: this.countdown,
      notes: this.noteStates,
      stats: { ...this.stats },
      detectedNote: this.detectedNote,
      lanes: this.lanes,
      songName: this.chart.name,
      levelLabel: this.chart.levelLabel,
      duration: this.chart.duration,
    };
  }

  private loop = (): void => {
    if (this.state === "idle" || this.state === "paused") return;

    const now = performance.now() / 1000;

    if (this.state === "countdown") {
      const cdElapsed = now - this.countdownStart;
      this.countdown = Math.ceil(3 - cdElapsed);
      if (cdElapsed >= 3) {
        this.state = "playing";
        this.startTime = now;
        this.elapsed = 0;
      }
      this.onUpdate(this.getSnapshot());
      this.animFrameId = requestAnimationFrame(this.loop);
      return;
    }

    this.elapsed = now - this.startTime;
    this.detectedNote = this.pitchDetector.detect();

    for (const ns of this.noteStates) {
      if (ns.hit || ns.missed) continue;
      const noteTime = ns.note.time;
      const diff = noteTime - this.elapsed;
      ns.y = 1 - diff / FALL_TIME;

      if (diff < -HIT_WINDOW) {
        ns.missed = true;
        this.stats.streak = 0;
      }

      if (
        !ns.hit &&
        !ns.missed &&
        this.detectedNote &&
        Math.abs(diff) < HIT_WINDOW
      ) {
        if (areNotesEqual(this.detectedNote.fullName, ns.note.note, 1)) {
          ns.hit = true;
          this.stats.hitNotes++;
          this.stats.streak++;
          if (this.stats.streak > this.stats.bestStreak) {
            this.stats.bestStreak = this.stats.streak;
          }
          this.stats.score += 100 + this.stats.streak * 10;
        }
      }
    }

    if (this.elapsed >= this.chart.duration) {
      this.state = "finished";
      this.pitchDetector.stop();
    }

    this.onUpdate(this.getSnapshot());

    if (this.state === "playing") {
      this.animFrameId = requestAnimationFrame(this.loop);
    }
  };
}
