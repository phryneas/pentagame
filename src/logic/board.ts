import {
  Coordinate,
  PolarCoordinateTuple,
  CoordinateType
} from "coordinate-systems";

export interface Field {
  /*
  ring: number;
  position: number;
*/
  coord: PolarCoordinateTuple;
  neighbors: number[];
  pieces: number[];
  color?: Color;
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
  id: number;
  player?: Player;
  color: Color;
  currentPosition: number;
}

export type Board = Field[];

export const initialBoard: Board = [];
export const initialPieces: Piece[] = [];

function addPiece(piece: Omit<Piece, "id">) {
  const id = initialPieces.length;
  initialPieces.push({ ...piece, id });
  return id;
}

let outerRingStart = initialBoard.length;
for (let idx = 0; idx < 20; idx++) {
  initialBoard.push({
    coord: [8, (idx / 20) * 360],
    neighbors: [(idx + 20 - 1) % 20, idx + (1 % 20)],
    pieces:
      idx % 4 === 0
        ? players.map(player =>
            addPiece({
              player,
              color: idx / 4,
              currentPosition: idx
            })
          )
        : []
  });
}

let innerRingStart = initialBoard.length;
for (let idx = 0; idx < 5; idx++) {
  initialBoard.push({
    coord: [3, (idx / 5) * 360 + 180],
    neighbors: [],
    pieces: [
      addPiece({
        color: Color.black,
        currentPosition: initialBoard.length
      })
    ],
    color: idx
  });
}
for (let i = 0; i < 5; i++) {
  addLine(
    initialBoard[outerRingStart + i * 4],
    initialBoard[innerRingStart + ((i + 2) % 5)],
    6
  );
  addLine(
    initialBoard[outerRingStart + i * 4],
    initialBoard[innerRingStart + ((i + 3) % 5)],
    6
  );
}

for (let i = 0; i < 5; i++) {
  addLine(
    initialBoard[innerRingStart + i],
    initialBoard[innerRingStart + ((i + 1) % 5)],
    3
  );
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

function addLine(a: Field, b: Field, count: number) {
  for (let i = 1; i <= count; i++) {
    const [ax, ay] = fromPolar(a.coord).cartesian();
    const [bx, by] = fromPolar(b.coord).cartesian();

    const [tx, ty] = [
      ax + ((bx - ax) * i) / (count + 1),
      ay + ((by - ay) * i) / (count + 1)
    ];

    const coord = new Coordinate({
      coordinates: [tx, ty],
      type: CoordinateType.CARTESIAN_2D,
      isDegree: true
    }).polar();

    if (i === 1) {
      a.neighbors.push(initialBoard.length);
    }
    if (i === count) {
      b.neighbors.push(initialBoard.length);
    }
    initialBoard.push({
      coord,
      neighbors: [
        i === 1 ? initialBoard.indexOf(a) : initialBoard.length - 1,
        i === count ? initialBoard.indexOf(b) : initialBoard.length + 1
      ],
      pieces: []
    });
  }
}

function fromPolar(p: PolarCoordinateTuple) {
  return new Coordinate({
    coordinates: p,
    type: CoordinateType.POLAR,
    isDegree: true
  });
}
