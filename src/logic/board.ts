export interface Field {
  ring: number;
  position: number;
  neighbors: number[];
  pieces: Piece[];
}

const players = ["A", "B"] as const;

export type Player = typeof players[number];
export enum Color {
  "white",
  "blue",
  "red",
  "yellow",
  "green",
  "black",
  "gray"
}

export interface Piece {
  player?: Player;
  color: Color;
  currentPosition: number;
}

export type Board = Field[];

export const initialBoard: Board = [];

for (let idx = 0; idx < 20; idx++) {
  initialBoard.push({
    ring: 0,
    position: (idx * 360) / 20,
    neighbors: [
      (idx + 20 - 1) % 20,
      idx + (1 % 20),
      ...(idx % 5 === 0 ? [20 + idx / 5] : [])
    ],
    pieces:
      idx % 4 === 0
        ? players.map(player => ({
            player,
            color: idx / 4,
            currentPosition: idx
          }))
        : []
  });
}
initialBoard.push(
  { ring: 1, position: (0 * 360) / 5, neighbors: [0, 25], pieces: [] },
  { ring: 1, position: (1 * 360) / 5, neighbors: [4, 26], pieces: [] },
  { ring: 1, position: (2 * 360) / 5, neighbors: [8, 27], pieces: [] },
  { ring: 1, position: (3 * 360) / 5, neighbors: [12, 28], pieces: [] },
  { ring: 1, position: (4 * 360) / 5, neighbors: [16, 29], pieces: [] }
);
for (let ring = 2; ring < 7; ring++) {
  for (let idx = 0; idx < 5; idx++) {
    initialBoard.push({
      ring,
      position: (idx * 360) / 5,
      neighbors: [20 + (ring - 2) * 5, 20 + ring * 5],
      pieces: []
    });
  }
}
for (let idx = 0; idx < 20; idx++) {
  initialBoard.push({
    ring: 7,
    position: (idx * 360) / 20,
    neighbors: [
      50 + ((idx + 20 - 1) % 20),
      50 + ((idx + 1) % 20),
      ...(idx % 5 === 0 ? [45 + idx / 5] : [])
    ],
    pieces:
      idx % 4 === 0
        ? [
            {
              color: Color.black,
              currentPosition: initialBoard.length
            }
          ]
        : []
  });
}

export function reachableFields(board: Board, idx: number) {
  const reachable = [];
  const iterate = new Set([idx, ...board[idx].neighbors]);

  for (const i of iterate.values()) {
    const field = board[i];
    if (i !== idx) {
      reachable.push(i);
    }
    if (field.pieces.length === 0)
      for (const neighbor of field.neighbors) {
        iterate.add(neighbor);
      }
  }
  return reachable;
}
