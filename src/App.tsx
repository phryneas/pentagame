import React from "react";
import { Board } from "./Board";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "./logic/state";
import { Piece, reachableFields } from "./logic/board";
import { Phase, game } from "./logic/game";
import { stateValuesEqual } from "xstate/lib/State";

const actions = game.actions;

const App = () => {
  const game = useSelector((state: RootState) => state);
  const dispatch = useDispatch();

  function pieceClicked(piece: number) {
    // Piece
    if (game.phase === Phase.selectPiece) {
      dispatch(actions.pieceSelected(piece));
    }
    if (game.phase === Phase.selectTarget) {
      dispatch(actions.targetSelected({ piece }));
    }
  }
  function fieldClicked(field: number) {
    // Field
    if (game.phase === Phase.selectBlackTarget) {
      dispatch(actions.blackTargetSelected(field));
    }
    if (game.phase === Phase.selectGrayTarget) {
      dispatch(actions.grayTargetSelected(field));
    }
    if (game.phase === Phase.selectTarget) {
      dispatch(actions.targetSelected({ field }));
    }
  }

  console.log(game.board);
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

  return (
    <>
      <p>Current player: {game.currentPlayer}</p>
      <p>Current Phase: {Phase[game.phase]}</p>
      <Board
        board={game.board}
        pieces={game.pieces}
        higlighted={highlightedFields}
        fieldClicked={fieldClicked}
        pieceClicked={pieceClicked}
      />
    </>
  );
};

export default App;
