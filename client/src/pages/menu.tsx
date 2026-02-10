import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Music, Crown, Star, Mic, Piano } from "lucide-react";

export default function Menu() {
  const [, setLocation] = useLocation();
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);

  const startGame = () => {
    if (selectedLevel) {
      setLocation(`/play/${selectedLevel}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50 to-yellow-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex flex-col items-center justify-center p-4 overflow-hidden relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-20 h-20 rounded-full bg-amber-200/30 dark:bg-amber-500/10 animate-pulse" />
        <div className="absolute top-40 right-20 w-16 h-16 rounded-full bg-orange-200/30 dark:bg-orange-500/10 animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute bottom-20 left-1/4 w-24 h-24 rounded-full bg-yellow-200/30 dark:bg-yellow-500/10 animate-pulse" style={{ animationDelay: "2s" }} />
        <div className="absolute bottom-40 right-1/3 w-14 h-14 rounded-full bg-red-200/20 dark:bg-red-500/10 animate-pulse" style={{ animationDelay: "0.5s" }} />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6 max-w-lg w-full">
        <div className="flex items-center gap-3 mb-2">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
              <Crown className="w-9 h-9 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center shadow-md">
              <Star className="w-3.5 h-3.5 text-amber-800" />
            </div>
          </div>
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-600 via-orange-500 to-red-500 dark:from-amber-400 dark:via-orange-400 dark:to-red-400 bg-clip-text text-transparent">
            Piano King
          </h1>
          <p className="text-muted-foreground text-lg">
            Learn to play like royalty
          </p>
        </div>

        <Card className="w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-amber-200/50 dark:border-amber-800/30">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Music className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <h2 className="font-semibold text-foreground text-lg">
                I Just Can't Wait to Be King
              </h2>
            </div>
            <p className="text-muted-foreground text-sm">
              From The Lion King - play the full melody on your piano!
            </p>
          </CardContent>
        </Card>

        <div className="w-full space-y-3">
          <p className="text-sm font-medium text-muted-foreground text-center">Choose your level</p>
          <div className="grid grid-cols-1 gap-3">
            <button
              data-testid="button-level-1"
              onClick={() => setSelectedLevel(1)}
              className={`relative w-full text-left p-4 rounded-md border-2 transition-all duration-200
                ${selectedLevel === 1
                  ? "border-green-400 bg-green-50 dark:bg-green-950/40 dark:border-green-600"
                  : "border-transparent bg-white dark:bg-gray-900 hover:border-green-200 dark:hover:border-green-800"
                }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-md bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shrink-0">
                  <span className="text-white font-bold text-xl">1</span>
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground">Easy - White Keys Only</h3>
                  <p className="text-sm text-muted-foreground">Notes: C, D, E, F, G, A - Slow and simple</p>
                </div>
              </div>
            </button>

            <button
              data-testid="button-level-2"
              onClick={() => setSelectedLevel(2)}
              className={`relative w-full text-left p-4 rounded-md border-2 transition-all duration-200
                ${selectedLevel === 2
                  ? "border-purple-400 bg-purple-50 dark:bg-purple-950/40 dark:border-purple-600"
                  : "border-transparent bg-white dark:bg-gray-900 hover:border-purple-200 dark:hover:border-purple-800"
                }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-md bg-gradient-to-br from-purple-400 to-violet-500 flex items-center justify-center shrink-0">
                  <span className="text-white font-bold text-xl">2</span>
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground">Medium - Sharps & Flats</h3>
                  <p className="text-sm text-muted-foreground">Adds F# and Bb - A fun challenge!</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        <Button
          data-testid="button-start-game"
          size="lg"
          disabled={!selectedLevel}
          onClick={startGame}
          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 text-lg no-default-hover-elevate no-default-active-elevate"
        >
          <Piano className="w-5 h-5 mr-2" />
          Start Playing
        </Button>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Mic className="w-4 h-4" />
          <span>Uses your microphone to listen to your piano</span>
        </div>
      </div>
    </div>
  );
}
