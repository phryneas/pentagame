import { Machine, assign } from "xstate";
import { initialBoard, Player, Piece, Board } from "./board";
import { produce } from "immer";
import { original } from "immer";

interface Ctx {
  currentPlayer: Player;
  selectedPiece?: Piece;
  board: Board;
}

type Event =
  | {
      type: "SELECTED_PIECE";
      targetPiece: Piece;
    }
  | {
      type: "SELECTED_TARGET_FIELD";
      targetField: number;
    }
  | {
      type: "SELECTED_TARGET_PLAYER_PIECE";
      targetPiece: Piece;
    }
  | {
      type: "SELECTED_TARGET_MONOCHROME_PIECE";
      targetPiece: Piece;
    };

function produceAssign<E extends Event>(fn: (draft: Ctx, e: E) => void) {
  return assign((ctx: Ctx, e: E) => {
    return produce(ctx, draft => {
      fn(draft, e);
    });
  });
}

export const machine = Machine<
  Ctx,
  {
    states: {
      selectPiece: {};
      selectPieceTarget: {};
      selectBlackTarget: {};
      selectGrayTarget: {};
    };
  },
  Event
>({
  context: {
    currentPlayer: "A",
    board: initialBoard
  },
  states: {
    selectPiece: {
      on: {
        SELECTED_PIECE: {
          target: "selectPieceTarget",
          cond(context, event) {
            return context.currentPlayer === event.targetPiece.player;
          }
        }
      }
    },
    selectPieceTarget: {
      on: {
        SELECTED_TARGET_FIELD: {
          target: "selectPiece",
          actions: [
            produceAssign((ctx, e) => {
              movePieceToPosition(
                ctx as any,
                ctx.selectedPiece!,
                e.targetField
              );
              ctx.selectedPiece = undefined;
            })
          ]
        },
        SELECTED_TARGET_PLAYER_PIECE: {
          target: "selectPiece",
          actions: produceAssign((ctx, e) => {
            //e.targetPiece;
          })
        }
      }
    },
    selectBlackTarget: {},
    selectGrayTarget: {}
  }
});

function assert(condition: any, msg?: string): asserts condition {
  if (!condition) {
    throw new Error(msg);
  }
}

export function removePiece(state: Ctx, piece: Piece) {
  console.log("remove %o from %o", piece, state.board[piece.currentPosition]);
  state.board[piece.currentPosition].pieces = state.board[
    piece.currentPosition
  ].pieces.filter(p => original(p) !== original(piece));
}

export function movePieceToPosition(state: Ctx, piece: Piece, target: number) {
  console.log("movePieceToPosition", [...arguments].map(original));
  removePiece(state, piece);
  state.board[target].pieces.push(piece);
  piece.currentPosition = target;
}
