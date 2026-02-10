import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { GameEngine, type GameSnapshot, type GameState } from "@/lib/gameEngine";
import { getChart, NOTE_COLORS, getLaneNotes } from "@/lib/songCharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Pause,
  Play,
  RotateCcw,
  Star,
  Trophy,
  Music,
  Mic,
  Flame,
} from "lucide-react";

const HIT_LINE_RATIO = 0.85;
const NOTE_HEIGHT = 48;

function NoteLabel({ note }: { note: string }) {
  const stripped = note.replace(/\d+$/, "");
  return (
    <span className="text-sm font-bold text-white drop-shadow-md select-none">
      {stripped}
    </span>
  );
}

function FallingNote({
  note,
  lane,
  y,
  hit,
  missed,
  laneCount,
  containerHeight,
}: {
  note: string;
  lane: number;
  y: number;
  hit: boolean;
  missed: boolean;
  laneCount: number;
  containerHeight: number;
}) {
  const stripped = note.replace(/\d+$/, "");
  const color = NOTE_COLORS[stripped] || "#4D96FF";
  const laneWidth = 100 / laneCount;
  const left = lane * laneWidth + laneWidth / 2;
  const pixelY = y * containerHeight * HIT_LINE_RATIO;

  if (pixelY < -NOTE_HEIGHT || pixelY > containerHeight + NOTE_HEIGHT) return null;

  const opacity = hit ? 0 : missed ? 0.2 : 1;
  const scale = hit ? 1.5 : 1;

  return (
    <div
      className="absolute flex items-center justify-center transition-transform duration-100"
      style={{
        left: `${left}%`,
        top: `${pixelY}px`,
        transform: `translate(-50%, -50%) scale(${scale})`,
        opacity,
        width: `${Math.min(laneWidth - 1, 14)}%`,
        height: `${NOTE_HEIGHT}px`,
        zIndex: 10,
      }}
    >
      <div
        className="w-full h-full rounded-md flex items-center justify-center shadow-lg"
        style={{
          backgroundColor: color,
          boxShadow: hit ? `0 0 20px ${color}` : `0 2px 8px ${color}44`,
        }}
      >
        <NoteLabel note={note} />
      </div>
      {hit && (
        <div
          className="absolute inset-0 rounded-md animate-ping"
          style={{ backgroundColor: color, opacity: 0.3 }}
        />
      )}
    </div>
  );
}

function HitFeedback({ streak }: { streak: number }) {
  if (streak === 0) return null;
  let text = "Nice!";
  let feedbackColor = "text-green-400";
  if (streak >= 20) {
    text = "INCREDIBLE!";
    feedbackColor = "text-yellow-300";
  } else if (streak >= 10) {
    text = "AMAZING!";
    feedbackColor = "text-amber-400";
  } else if (streak >= 5) {
    text = "Great!";
    feedbackColor = "text-emerald-400";
  }

  return (
    <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-30 text-center pointer-events-none`}>
      <p className={`text-2xl font-bold ${feedbackColor} drop-shadow-lg animate-bounce`}>
        {text}
      </p>
      {streak >= 3 && (
        <div className="flex items-center justify-center gap-1 mt-1">
          <Flame className="w-4 h-4 text-orange-400" />
          <span className="text-sm font-semibold text-orange-300">{streak}x Streak</span>
        </div>
      )}
    </div>
  );
}

function GameOverScreen({
  stats,
  songName,
  onRestart,
  onMenu,
}: {
  stats: GameSnapshot["stats"];
  songName: string;
  onRestart: () => void;
  onMenu: () => void;
}) {
  const percent = stats.totalNotes > 0 ? Math.round((stats.hitNotes / stats.totalNotes) * 100) : 0;
  let starsCount = 1;
  if (percent >= 80) starsCount = 3;
  else if (percent >= 50) starsCount = 2;

  let message = "Good try! Keep practicing!";
  if (percent >= 80) message = "You're a piano superstar!";
  else if (percent >= 50) message = "Great job! You're getting better!";

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50 to-yellow-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-amber-200/50 dark:border-amber-800/30">
        <CardContent className="p-6 flex flex-col items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <Trophy className="w-10 h-10 text-white" />
          </div>

          <div className="text-center space-y-1">
            <h1 className="text-3xl font-bold text-foreground">Song Complete!</h1>
            <p className="text-muted-foreground">{songName}</p>
          </div>

          <div className="flex items-center gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <Star
                key={i}
                className={`w-10 h-10 transition-all duration-500 ${
                  i < starsCount
                    ? "text-yellow-400 fill-yellow-400 scale-110"
                    : "text-gray-300 dark:text-gray-700"
                }`}
                style={{ transitionDelay: `${i * 200}ms` }}
              />
            ))}
          </div>

          <p className="text-lg font-medium text-foreground">{message}</p>

          <div className="w-full grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-md bg-card">
              <p className="text-2xl font-bold text-foreground">{stats.score}</p>
              <p className="text-xs text-muted-foreground">Score</p>
            </div>
            <div className="p-3 rounded-md bg-card">
              <p className="text-2xl font-bold text-foreground">{percent}%</p>
              <p className="text-xs text-muted-foreground">Accuracy</p>
            </div>
            <div className="p-3 rounded-md bg-card">
              <p className="text-2xl font-bold text-foreground">{stats.bestStreak}</p>
              <p className="text-xs text-muted-foreground">Best Streak</p>
            </div>
          </div>

          <div className="flex gap-3 w-full">
            <Button
              data-testid="button-back-to-menu"
              variant="outline"
              onClick={onMenu}
              className="flex-1"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Menu
            </Button>
            <Button
              data-testid="button-play-again"
              onClick={onRestart}
              className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 no-default-hover-elevate no-default-active-elevate"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Play Again
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CountdownOverlay({ count }: { count: number }) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="text-center">
        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto shadow-2xl animate-pulse">
          <span className="text-6xl font-bold text-white">{count > 0 ? count : "Go!"}</span>
        </div>
        <p className="text-white text-xl mt-4 font-medium">Get ready to play!</p>
      </div>
    </div>
  );
}

export default function PlayPage() {
  const params = useParams<{ level: string }>();
  const [, setLocation] = useLocation();
  const level = parseInt(params.level || "1");
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [snapshot, setSnapshot] = useState<GameSnapshot | null>(null);
  const [containerHeight, setContainerHeight] = useState(600);
  const [micError, setMicError] = useState<string | null>(null);

  const handleUpdate = useCallback((snap: GameSnapshot) => {
    setSnapshot({ ...snap });
  }, []);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, []);

  const startGame = useCallback(async () => {
    setMicError(null);
    const chart = getChart(level);
    const engine = new GameEngine(chart, handleUpdate);
    engineRef.current = engine;
    try {
      await engine.startCountdown();
    } catch {
      setMicError("Microphone access is needed to play. Please allow microphone access and try again.");
    }
  }, [level, handleUpdate]);

  useEffect(() => {
    startGame();
    return () => {
      engineRef.current?.stop();
    };
  }, [startGame]);

  const handlePause = () => {
    if (snapshot?.state === "playing") engineRef.current?.pause();
    else if (snapshot?.state === "paused") engineRef.current?.resume();
  };

  const handleRestart = () => {
    engineRef.current?.stop();
    startGame();
  };

  const handleMenu = () => setLocation("/");

  const state = snapshot?.state || "idle";
  const lanes = snapshot?.lanes || getLaneNotes(level);

  if (micError) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50 to-yellow-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center">
              <Mic className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">Microphone Access Needed</h2>
            <p className="text-muted-foreground">{micError}</p>
            <div className="flex gap-3 w-full">
              <Button variant="outline" onClick={handleMenu} className="flex-1" data-testid="button-mic-error-menu">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Menu
              </Button>
              <Button onClick={handleRestart} className="flex-1" data-testid="button-mic-error-retry">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (state === "finished" && snapshot) {
    return (
      <GameOverScreen
        stats={snapshot.stats}
        songName={snapshot.songName}
        onRestart={handleRestart}
        onMenu={handleMenu}
      />
    );
  }

  const progress = snapshot ? (snapshot.elapsed / snapshot.duration) * 100 : 0;

  return (
    <div className="h-screen flex flex-col bg-gray-950 overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-3 py-2 bg-gray-900 border-b border-gray-800 shrink-0">
        <Button
          size="icon"
          variant="ghost"
          onClick={handleMenu}
          data-testid="button-game-back"
          className="text-gray-400 hover:text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>

        <div className="flex-1 min-w-0 flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 shrink-0">
            <Music className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium text-gray-300 truncate" data-testid="text-song-title">
              {snapshot?.songName || "Loading..."}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <Progress value={Math.min(progress, 100)} className="h-2 bg-gray-800" data-testid="progress-song" />
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-gray-800 text-amber-400">
            <Star className="w-3.5 h-3.5 fill-amber-400" />
            <span className="text-sm font-semibold" data-testid="text-score">{snapshot?.stats.score || 0}</span>
          </div>

          {snapshot && snapshot.stats.streak >= 3 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-orange-900/50 text-orange-400">
              <Flame className="w-3.5 h-3.5" />
              <span className="text-sm font-semibold" data-testid="text-streak">{snapshot.stats.streak}</span>
            </div>
          )}

          <Button
            size="icon"
            variant="ghost"
            onClick={handlePause}
            data-testid="button-pause"
            className="text-gray-400 hover:text-white"
          >
            {state === "paused" ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {snapshot?.detectedNote && state === "playing" && (
        <div className="absolute bottom-3 right-3 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gray-800/80 backdrop-blur-sm border border-gray-700">
          <Mic className="w-3.5 h-3.5 text-green-400" />
          <span className="text-sm font-mono font-semibold text-green-400" data-testid="text-detected-note">
            {snapshot.detectedNote.fullName}
          </span>
        </div>
      )}

      <div ref={containerRef} className="flex-1 relative overflow-hidden">
        {lanes.map((laneName, i) => {
          const laneWidth = 100 / lanes.length;
          const color = NOTE_COLORS[laneName] || "#4D96FF";
          return (
            <div
              key={laneName}
              className="absolute top-0 bottom-0"
              style={{
                left: `${i * laneWidth}%`,
                width: `${laneWidth}%`,
                borderRight: i < lanes.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
              }}
            >
              <div
                className="absolute bottom-0 left-0 right-0 flex items-center justify-center py-2 z-20"
                style={{
                  top: `${HIT_LINE_RATIO * 100}%`,
                  height: `${(1 - HIT_LINE_RATIO) * 100}%`,
                  backgroundColor: `${color}15`,
                }}
              >
                <span
                  className="text-base font-bold select-none"
                  style={{ color: `${color}AA` }}
                  data-testid={`text-lane-${laneName}`}
                >
                  {laneName}
                </span>
              </div>
            </div>
          );
        })}

        <div
          className="absolute left-0 right-0 z-20"
          style={{
            top: `${HIT_LINE_RATIO * 100}%`,
            height: "3px",
            background: "linear-gradient(90deg, rgba(255,255,255,0.1), rgba(255,255,255,0.5), rgba(255,255,255,0.1))",
            boxShadow: "0 0 12px rgba(255,255,255,0.3)",
          }}
        />

        {snapshot?.notes
          .filter((ns) => {
            const diff = ns.note.time - (snapshot.elapsed || 0);
            return diff > -1 && diff < 5;
          })
          .map((ns) => (
            <FallingNote
              key={ns.note.id}
              note={ns.note.note}
              lane={ns.lane}
              y={ns.y}
              hit={ns.hit}
              missed={ns.missed}
              laneCount={lanes.length}
              containerHeight={containerHeight}
            />
          ))}

        {snapshot && <HitFeedback streak={snapshot.stats.streak} />}

        {state === "countdown" && snapshot && <CountdownOverlay count={snapshot.countdown} />}

        {state === "paused" && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <Card className="bg-gray-900/95 border-gray-700 max-w-xs w-full mx-4">
              <CardContent className="p-6 flex flex-col items-center gap-4">
                <h2 className="text-2xl font-bold text-white">Paused</h2>
                <div className="flex gap-3 w-full">
                  <Button variant="outline" onClick={handleMenu} className="flex-1 border-gray-600 text-gray-300" data-testid="button-pause-menu">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Menu
                  </Button>
                  <Button onClick={handlePause} className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 no-default-hover-elevate no-default-active-elevate" data-testid="button-resume">
                    <Play className="w-4 h-4 mr-2" />
                    Resume
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
