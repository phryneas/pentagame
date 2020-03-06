import React from "react";
import { Board } from "./Board";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "./logic/state";
import { Piece, reachableFields } from "./logic/board";
import { Phase, game } from "./logic/game";

const actions = game.actions;

const App = () => {
  const game = useSelector((state: RootState) => state);
  const dispatch = useDispatch();
  function onClick(item: number | Piece) {
    console.log(item);
    if (typeof item === "number") {
      // Field
      if (game.phase === Phase.selectBlackTarget) {
        dispatch(actions.blackTargetSelected(item));
      }
      if (game.phase === Phase.selectGrayTarget) {
        dispatch(actions.grayTargetSelected(item));
      }
    } else {
      // Piece
      if (game.phase === Phase.selectPiece) {
        dispatch(actions.pieceSelected(item));
      }
    }
    if (game.phase === Phase.selectTarget) {
      dispatch(actions.targetSelected(item));
    }
  }

  console.log(game.board);

  const highlightedFields =
    game.phase === Phase.selectTarget
      ? reachableFields(game.board, game.selectedPiece?.currentPosition!).map(
          idx => game.board[idx]
        )
      : game.phase === Phase.selectBlackTarget
      ? game.board.filter(field => field.pieces.length === 0)
      : game.phase === Phase.selectPiece
      ? game.board.flatMap(field =>
          field.pieces.filter(piece => piece.player === game.currentPlayer)
        )
      : undefined;

  return (
    <>
      <p>Current player: {game.currentPlayer}</p>
      <p>Current Phase: {Phase[game.phase]}</p>
      <Board
        board={game.board}
        higlighted={highlightedFields}
        onClick={onClick}
      />
    </>
  );
};

export default App;
