import { createSlice, PayloadAction, Draft } from "@reduxjs/toolkit";
import {
  Player,
  Board,
  initialBoard,
  Piece,
  Color,
  reachableFields,
  initialPieces
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
  selectedPiece?: number;
  phase: Phase;
  board: Board;
  pieces: Piece[];
  phaseQueue: Phase[];
}

export const game = createSlice({
  name: "game",
  initialState: {
    currentPlayer: "A",
    phase: Phase.selectPiece,
    board: initialBoard,
    pieces: initialPieces,
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
    pieceSelected(state, { payload }: PayloadAction<number>) {
      fromPhases(state, [Phase.selectPiece]);
      assert(
        state.pieces[payload].player === state.currentPlayer,
        "cannot select field with pieces, need to select piece directly"
      );
      state.selectedPiece = payload;
      queuePhase(state, Phase.selectTarget);
      nextPhase(state);
    },
    targetSelected(
      state,
      { payload }: PayloadAction<{ field: number } | { piece: number }>
    ) {
      fromPhases(state, [Phase.selectTarget]);

      let targetPosition: number;
      let targetPiece: Piece | undefined;

      if ("field" in payload) {
        assert(
          state.board[payload.field].pieces.length === 0,
          "cannot select field with pieces, need to select piece directly"
        );

        targetPosition = payload.field;
      } else {
        targetPiece = state.pieces[payload.piece];
        targetPosition = targetPiece.currentPosition;
      }

      assert(state.selectedPiece !== undefined, "");
      const currentPiece = state.pieces[state.selectedPiece!];
      assert(
        reachableFields(state.board, currentPiece.currentPosition).includes(
          targetPosition
        ),
        "Field not reachable"
      );

      if (targetPiece) {
        if (targetPiece.color === Color.black) {
          queuePhase(state, Phase.selectBlackTarget);
          state.selectedPiece = targetPiece.id;
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
      movePieceToPosition(
        state,
        state.pieces[state.selectedPiece!],
        targetPosition
      );

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
      const newPiece = addPiece(state, {
        color: Color.gray,
        currentPosition: targetPosition
      });

      state.board[targetPosition].pieces.push(newPiece);
      nextPhase(state);
    }
  }
});

function addPiece(state: Draft<GameState>, piece: Omit<Piece, "id">) {
  const id = state.pieces.length;
  state.pieces.push({ ...piece, id });
  return id;
}

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
  state.board[piece.currentPosition].pieces = state.board[
    piece.currentPosition
  ].pieces.filter(p => p !== piece.id);
}

function movePieceToPosition(
  state: Draft<GameState>,
  piece: Piece,
  target: number
) {
  console.log("movePieceToPosition", [...arguments].map(original));
  removePiece(state, piece);
  state.board[target].pieces.push(piece.id);
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

export function selectHighlightedFields(game: GameState) {
  const currentSelectedPiece =
    typeof game.selectedPiece === "number"
      ? game.pieces[game.selectedPiece]
      : undefined;

  const highlightedFields =
    game.phase === Phase.selectTarget
      ? reachableFields(game.board, currentSelectedPiece?.currentPosition!).map(
          idx => game.board[idx]
        )
      : game.phase === Phase.selectBlackTarget
      ? game.board.filter(field => field.pieces.length === 0)
      : game.phase === Phase.selectPiece
      ? game.board.flatMap(field =>
          field.pieces
            .map(id => game.pieces[id])
            .filter(piece => piece.player === game.currentPlayer)
        )
      : undefined;
  return highlightedFields;
}
