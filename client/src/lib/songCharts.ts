export interface SongNote {
  note: string;
  time: number;
  id: number;
}

export interface SongChart {
  name: string;
  level: number;
  levelLabel: string;
  notes: SongNote[];
  duration: number;
  description: string;
}

interface SectionNote {
  note: string;
  offset: number;
}

const LEVEL1_INTRO: SectionNote[] = [
  { note: "C4", offset: 0.0 },
  { note: "E4", offset: 1.8 },
  { note: "G4", offset: 3.6 },
];

const LEVEL1_VERSE: SectionNote[] = [
  { note: "E4", offset: 0.0 },
  { note: "G4", offset: 1.8 },
  { note: "A4", offset: 3.6 },
  { note: "G4", offset: 5.4 },
  { note: "E4", offset: 7.2 },
];

const LEVEL1_CHORUS: SectionNote[] = [
  { note: "G4", offset: 0.0 },
  { note: "A4", offset: 1.8 },
  { note: "C5", offset: 3.6 },
  { note: "A4", offset: 5.4 },
  { note: "G4", offset: 7.2 },
];

const LEVEL1_OUTRO: SectionNote[] = [
  { note: "E4", offset: 0.0 },
  { note: "D4", offset: 1.8 },
  { note: "C4", offset: 3.6 },
];

const LEVEL2_INTRO: SectionNote[] = [
  { note: "C4", offset: 0.0 },
  { note: "D4", offset: 1.0 },
  { note: "E4", offset: 1.8 },
  { note: "G4", offset: 2.8 },
  { note: "A4", offset: 3.6 },
];

const LEVEL2_VERSE: SectionNote[] = [
  { note: "E4", offset: 0.0 },
  { note: "F#4", offset: 0.9 },
  { note: "G4", offset: 1.8 },
  { note: "A4", offset: 2.7 },
  { note: "Bb4", offset: 3.6 },
  { note: "A4", offset: 4.5 },
  { note: "G4", offset: 5.4 },
  { note: "F#4", offset: 6.3 },
  { note: "E4", offset: 7.2 },
];

const LEVEL2_CHORUS: SectionNote[] = [
  { note: "G4", offset: 0.0 },
  { note: "A4", offset: 0.9 },
  { note: "Bb4", offset: 1.8 },
  { note: "C5", offset: 2.7 },
  { note: "D5", offset: 3.6 },
  { note: "C5", offset: 4.5 },
  { note: "A4", offset: 5.4 },
  { note: "G4", offset: 6.3 },
  { note: "F#4", offset: 7.2 },
];

const LEVEL2_OUTRO: SectionNote[] = [
  { note: "G4", offset: 0.0 },
  { note: "F#4", offset: 0.9 },
  { note: "E4", offset: 1.8 },
  { note: "D4", offset: 2.7 },
  { note: "C4", offset: 3.6 },
];

function getSectionDuration(section: SectionNote[]): number {
  const lastNote = section[section.length - 1];
  return lastNote.offset + 2.0;
}

function buildChart(sections: SectionNote[][], sectionGap: number): SongNote[] {
  const notes: SongNote[] = [];
  let currentTime = 3.0;
  let id = 0;

  for (const section of sections) {
    for (const sn of section) {
      notes.push({ note: sn.note, time: currentTime + sn.offset, id: id++ });
    }
    currentTime += getSectionDuration(section) + sectionGap;
  }

  return notes;
}

function repeatSections(
  intro: SectionNote[],
  verse: SectionNote[],
  chorus: SectionNote[],
  outro: SectionNote[],
  sectionGap: number,
  targetDuration: number
): SongNote[] {
  const allSections: SectionNote[][] = [intro, verse, chorus, verse, chorus];

  let estimatedDuration = 3.0;
  for (const s of allSections) {
    estimatedDuration += getSectionDuration(s) + sectionGap;
  }

  while (estimatedDuration < targetDuration - 15) {
    allSections.push(verse);
    estimatedDuration += getSectionDuration(verse) + sectionGap;
    if (estimatedDuration >= targetDuration - 15) break;
    allSections.push(chorus);
    estimatedDuration += getSectionDuration(chorus) + sectionGap;
  }

  allSections.push(outro);

  return buildChart(allSections, sectionGap);
}

export function getLevel1Chart(): SongChart {
  const notes = repeatSections(
    LEVEL1_INTRO, LEVEL1_VERSE, LEVEL1_CHORUS, LEVEL1_OUTRO,
    1.5, 170
  );
  const duration = notes.length > 0 ? notes[notes.length - 1].time + 5 : 170;
  return {
    name: "I Just Can't Wait to Be King",
    level: 1,
    levelLabel: "Easy - White Keys Only",
    notes,
    duration,
    description: "Play the melody using only white keys. Notes fall slowly so you have plenty of time!",
  };
}

export function getLevel2Chart(): SongChart {
  const notes = repeatSections(
    LEVEL2_INTRO, LEVEL2_VERSE, LEVEL2_CHORUS, LEVEL2_OUTRO,
    1.0, 170
  );
  const duration = notes.length > 0 ? notes[notes.length - 1].time + 5 : 170;
  return {
    name: "I Just Can't Wait to Be King",
    level: 2,
    levelLabel: "Medium - With Sharps & Flats",
    notes,
    duration,
    description: "The same song with black keys added and faster timing. A fun challenge!",
  };
}

export function getChart(level: number): SongChart {
  return level === 2 ? getLevel2Chart() : getLevel1Chart();
}

export function getUniqueNotes(chart: SongChart): string[] {
  const noteSet = new Set<string>();
  for (const n of chart.notes) {
    const noteName = n.note.replace(/\d+$/, "");
    noteSet.add(noteName);
  }
  const order = ["C", "D", "E", "F", "F#", "G", "A", "Bb", "B", "C5"];
  const result = Array.from(noteSet);
  result.sort((a, b) => {
    const ai = order.indexOf(a);
    const bi = order.indexOf(b);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
  return result;
}

export function getLaneNotes(level: number): string[] {
  if (level === 1) {
    return ["C", "D", "E", "F", "G", "A"];
  }
  return ["C", "D", "E", "F", "F#", "G", "A", "Bb"];
}

export function getNoteLane(noteName: string, lanes: string[]): number {
  const stripped = noteName.replace(/\d+$/, "");
  const idx = lanes.indexOf(stripped);
  return idx === -1 ? Math.floor(lanes.length / 2) : idx;
}

export const NOTE_COLORS: Record<string, string> = {
  "C": "#FF6B6B",
  "D": "#FFA94D",
  "E": "#FFD93D",
  "F": "#6BCB77",
  "F#": "#9B59B6",
  "G": "#4D96FF",
  "A": "#FF6B9D",
  "Bb": "#C084FC",
  "B": "#67E8F9",
};
