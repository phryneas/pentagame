import { createSlice, PayloadAction, Draft } from "@reduxjs/toolkit";
import {
  Player,
  Board,
  initialBoard,
  Piece,
  Color,
  reachableFields
} from "./board";
import { original } from "immer";

export enum Phase {
  selectPiece,
  selectTarget,
  selectBlackTarget,
  selectGrayTarget
}

interface GameState {
  currentPlayer: Player;
  selectedPiece?: Piece;
  phase: Phase;
  board: Board;
  phaseQueue: Phase[];
}

export const game = createSlice({
  name: "game",
  initialState: {
    currentPlayer: "A",
    phase: Phase.selectPiece,
    board: initialBoard,
    phaseQueue: []
  } as GameState,
  reducers: {
    startSelectPiecePhase(state) {
      fromPhases(state, [
        Phase.selectTarget,
        Phase.selectBlackTarget,
        Phase.selectGrayTarget
      ]);
      queuePhase(state, Phase.selectPiece);
      nextPhase(state);
    },
    pieceSelected(state, { payload }: PayloadAction<Piece>) {
      fromPhases(state, [Phase.selectPiece]);
      assert(
        payload.player === state.currentPlayer,
        "cannot select field with pieces, need to select piece directly"
      );
      state.selectedPiece = payload;
      queuePhase(state, Phase.selectTarget);
      nextPhase(state);
    },
    targetSelected(state, { payload }: PayloadAction<number | Piece>) {
      fromPhases(state, [Phase.selectTarget]);

      let targetPosition: number;
      let targetPiece: Piece | undefined;

      if (typeof payload === "number") {
        assert(
          state.board[payload].pieces.length === 0,
          "cannot select field with pieces, need to select piece directly"
        );

        targetPosition = payload;
      } else {
        targetPosition = payload.currentPosition;
        targetPiece = payload;
      }

      assert(state.selectedPiece !== undefined, "");
      const currentPiece = state.selectedPiece!;
      assert(
        reachableFields(state.board, currentPiece.currentPosition).includes(
          targetPosition
        ),
        "Field not reachable"
      );

      if (targetPiece) {
        if (targetPiece.color === Color.black) {
          queuePhase(state, Phase.selectBlackTarget);
          state.selectedPiece = targetPiece;
        } else if (targetPiece.color === Color.gray) {
          removePiece(state, targetPiece);
        } else {
          movePieceToPosition(state, targetPiece, currentPiece.currentPosition);
        }
      }

      if (targetPosition === 50 + currentPiece.color * 4) {
        removePiece(state, currentPiece);
        queuePhase(state, Phase.selectGrayTarget);
      } else {
        movePieceToPosition(state, currentPiece, targetPosition);
      }

      queuePhase(state, Phase.selectPiece);
      nextPhase(state);
    },
    blackTargetSelected(
      state,
      { payload: targetPosition }: PayloadAction<number>
    ) {
      fromPhases(state, [Phase.selectBlackTarget]);
      assert(
        state.board[targetPosition].pieces.length === 0,
        "cannot select field with pieces present"
      );
      movePieceToPosition(state, state.selectedPiece!, targetPosition);

      nextPhase(state);
    },
    grayTargetSelected(
      state,
      { payload: targetPosition }: PayloadAction<number>
    ) {
      fromPhases(state, [Phase.selectBlackTarget]);
      assert(
        state.board[targetPosition].pieces.length === 0,
        "cannot select field with pieces present"
      );
      state.board[targetPosition].pieces.push({
        color: Color.gray,
        currentPosition: targetPosition
      });
      nextPhase(state);
    }
  }
});

function queuePhase(state: Draft<GameState>, phase: Phase) {
  state.phaseQueue.push(phase);
}

function nextPhase(state: Draft<GameState>) {
  const nextPhase = state.phaseQueue.shift();
  assert(nextPhase !== undefined, "no next phase queued!");
  if (nextPhase === Phase.selectPiece) {
    swapPlayers(state);
  }
  state.phase = nextPhase!;
}

function removePiece(state: Draft<GameState>, piece: Piece) {
  console.log(
    "remove %o from %o",
    piece,
    original(state.board[piece.currentPosition])
  );
  const found = state.board[piece.currentPosition].pieces.find(
    p => original(p) === original(piece)
  )!;
  state.board[piece.currentPosition].pieces = state.board[
    piece.currentPosition
  ].pieces.filter(p => original(p) !== original(piece));
  return found;
}

function movePieceToPosition(
  state: Draft<GameState>,
  piece: Piece,
  target: number
) {
  console.log("movePieceToPosition", [...arguments].map(original));
  piece = removePiece(state, piece);
  state.board[target].pieces.push(piece);
  piece.currentPosition = target;
}

function swapPlayers(state: Draft<GameState>) {
  state.currentPlayer = state.currentPlayer === "A" ? "B" : "A";
}

function fromPhases(state: GameState, phases: Phase[]) {
  if (!phases.includes(state.phase)) {
    throw new Error("invalid action!");
  }
}

function assert(valid: boolean, err: string): asserts valid is true {
  if (!valid) {
    throw new Error(err);
  }
}
