import { Machine, assign, State } from "xstate";
import {
  initialBoard,
  Player,
  Piece,
  Board,
  initialPieces,
  reachableFields,
  Color
} from "./board";
import { produce } from "immer";

interface Ctx {
  currentPlayer: Player;
  selectedPiece?: number;
  board: Board;
  pieces: Piece[];
  selectBlackTarget?: boolean;
  selectGrayTarget?: boolean;
}

type Event =
  | {
      type: "SELECTED_FIELD";
      targetField: number;
    }
  | {
      type: "SELECTED_PLAYER_PIECE";
      targetPiece: number;
    }
  | {
      type: "SELECTED_BLACK_PIECE";
      targetPiece: number;
    }
  | {
      type: "SELECTED_GRAY_PIECE";
      targetPiece: number;
    };

function produceAssign<E extends Event>(fn: (draft: Ctx, e: E) => void) {
  return assign((ctx: Ctx, e: E) => {
    return produce(ctx, draft => {
      fn(draft, e);
    });
  });
}

type Schema = {
  states: {
    nextAction: {};
    selectPiece: {};
    selectPieceTarget: {};
    selectBlackTarget: {};
    selectGrayTarget: {};
  };
};

export const machine = Machine<Ctx, Schema, Event>({
  context: {
    currentPlayer: "A",
    board: initialBoard,
    pieces: initialPieces
  },
  initial: "selectPiece",
  states: {
    nextAction: {
      on: {
        "": [
          {
            target: "selectBlackTarget",
            cond: ctx => !!ctx.selectBlackTarget,
            actions: produceAssign<any>(ctx => {
              ctx.selectBlackTarget = false;
            })
          },
          {
            target: "selectGrayTarget",
            cond: ctx => !!ctx.selectGrayTarget,
            actions: produceAssign<any>(ctx => {
              ctx.selectGrayTarget = false;
            })
          },
          {
            target: "selectPiece",
            actions: produceAssign<any>(ctx => {
              ctx.currentPlayer = ctx.currentPlayer === "A" ? "B" : "A";
            })
          }
        ]
      }
    },
    selectPiece: {
      on: {
        SELECTED_PLAYER_PIECE: {
          cond: (context, event) =>
            context.currentPlayer ===
            selectPiece(context, event.targetPiece).player,
          target: "selectPieceTarget",
          actions: [
            produceAssign((ctx, e) => {
              ctx.selectedPiece = e.targetPiece;
            })
          ]
        }
      }
    },
    selectPieceTarget: {
      on: {
        SELECTED_FIELD: {
          target: "nextAction",
          cond: (ctx, event) =>
            isReachableForCurrentPiece(ctx, event.targetField) &&
            ctx.board[event.targetField].pieces.length === 0,
          actions: [
            produceAssign((ctx, e) => {
              movePieceToPosition(ctx, ctx.selectedPiece!, e.targetField);
              ctx.selectedPiece = undefined;
            })
          ]
        },
        SELECTED_PLAYER_PIECE: {
          target: "nextAction",
          cond: (ctx, event) =>
            isReachableForCurrentPiece(
              ctx,
              selectPiece(ctx, event.targetPiece).currentPosition
            ),
          actions: produceAssign((ctx, e) => {
            const startPosition = selectCurrentPiece(ctx)!.currentPosition;
            const targetPiece = selectPiece(ctx, e.targetPiece);
            movePieceToPosition(
              ctx,
              ctx.selectedPiece!,
              targetPiece.currentPosition
            );
            movePieceToPosition(ctx, targetPiece.id, startPosition);

            ctx.selectedPiece = undefined;
          })
        },
        SELECTED_BLACK_PIECE: {
          target: "nextAction",
          cond: (ctx, event) =>
            isReachableForCurrentPiece(
              ctx,
              selectPiece(ctx, event.targetPiece).currentPosition
            ),
          actions: produceAssign((ctx, e) => {
            const targetPiece = selectPiece(ctx, e.targetPiece);
            movePieceToPosition(
              ctx,
              ctx.selectedPiece!,
              targetPiece.currentPosition
            );

            ctx.selectedPiece = targetPiece.id;
            ctx.selectBlackTarget = true;
          })
        },
        SELECTED_GRAY_PIECE: {
          target: "nextAction",
          cond: (ctx, event) =>
            isReachableForCurrentPiece(
              ctx,
              selectPiece(ctx, event.targetPiece).currentPosition
            ),
          actions: produceAssign((ctx, e) => {
            const targetPiece = selectPiece(ctx, e.targetPiece);
            movePieceToPosition(
              ctx,
              ctx.selectedPiece!,
              targetPiece.currentPosition
            );

            removePiece(ctx, targetPiece.id);
            ctx.selectedPiece = undefined;
          })
        }
      }
    },
    selectBlackTarget: {
      on: {
        SELECTED_FIELD: {
          cond: (ctx, e) => selectField(ctx, e.targetField).pieces.length === 0,
          target: "nextAction",
          actions: produceAssign((ctx, e) => {
            movePieceToPosition(ctx, ctx.selectedPiece!, e.targetField);

            ctx.selectedPiece = undefined;
            ctx.selectBlackTarget = false;
          })
        }
      }
    },
    selectGrayTarget: {
      on: {
        SELECTED_FIELD: {
          cond: (ctx, e) => selectField(ctx, e.targetField).pieces.length === 0,
          target: "nextAction",
          actions: produceAssign((ctx, e) => {
            const targetField = selectField(ctx, e.targetField);
            const newPiece: Piece = {
              id: ctx.pieces.length,
              color: Color.gray,
              currentPosition: e.targetField
            };
            ctx.pieces.push(newPiece);
            targetField.pieces.push(newPiece.id);

            ctx.selectGrayTarget = false;
          })
        }
      }
    }
  }
});

function isReachableForCurrentPiece(ctx: Ctx, targetField: number) {
  return reachableFields(
    ctx.board,
    selectCurrentPiece(ctx)!.currentPosition
  ).includes(targetField);
}

function removePiece(state: Ctx, pieceId: number) {
  const piece = selectPiece(state, pieceId);
  const field = selectField(state, piece.currentPosition);
  field.pieces = field.pieces.filter(id => id !== piece.id);
}

function movePieceToPosition(state: Ctx, pieceId: number, fieldId: number) {
  const piece = selectPiece(state, pieceId);
  removePiece(state, pieceId);
  piece.currentPosition = fieldId;
  selectField(state, fieldId).pieces.push(piece.id);

  if (
    state.selectedPiece === pieceId &&
    piece.player === state.currentPlayer &&
    selectField(state, piece.currentPosition).color === piece.color
  ) {
    // reached target field
    removePiece(state, pieceId);
    state.selectGrayTarget = true;
  }
}

function selectPiece(state: Ctx, pieceId: number) {
  return state.pieces[pieceId];
}

function selectField(state: Ctx, fieldId: number) {
  return state.board[fieldId];
}

function selectCurrentPiece(state: Ctx) {
  return typeof state.selectedPiece === "number"
    ? state.pieces[state.selectedPiece]
    : undefined;
}

export function selectHighlightedFields(state: State<Ctx, Event, any, any>) {
  const game = state.context;
  const phase: keyof Schema["states"] = state.value as any;

  const currentSelectedPiece =
    typeof game.selectedPiece === "number"
      ? game.pieces[game.selectedPiece]
      : undefined;

  const highlightedFields =
    phase === "selectPieceTarget"
      ? reachableFields(game.board, currentSelectedPiece?.currentPosition!).map(
          idx => game.board[idx]
        )
      : phase === "selectBlackTarget" || phase === "selectGrayTarget"
      ? game.board.filter(field => field.pieces.length === 0)
      : phase === "selectPiece"
      ? game.board.flatMap(field =>
          field.pieces
            .map(id => game.pieces[id])
            .filter(piece => piece.player === game.currentPlayer)
        )
      : undefined;
  return highlightedFields;
}
