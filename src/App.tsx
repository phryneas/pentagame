import React from "react";
import { Board } from "./Board";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "./logic/state";
import { Piece, Color } from "./logic/board";
import {
  Phase,
  game,
  selectHighlightedFields as selectReduxHighlightedFields
} from "./logic/game";
import {
  machine,
  selectHighlightedFields as selectXStateHighlightedFields
} from "./logic/xStateGame";
import { useMachine } from "@xstate/react";

const actions = game.actions;

const App = () => {
  const reduxGame = useSelector((state: RootState) => state);
  const reduxDispatch = useDispatch();
  const reduxHighlightedFields = useSelector(selectReduxHighlightedFields);

  const [machineGame, machineDispatch] = useMachine(machine, {
    devTools: true
  });
  const xMachineHighlightedFields = selectXStateHighlightedFields(machineGame);

  const game = machineGame.context;

  function pieceClicked(piece: Piece) {
    switch (piece.color) {
      case Color.black:
        machineDispatch({
          type: "SELECTED_BLACK_PIECE",
          targetPiece: piece.id
        });
        break;
      case Color.gray:
        machineDispatch({ type: "SELECTED_GRAY_PIECE", targetPiece: piece.id });
        break;
      default:
        machineDispatch({
          type: "SELECTED_PLAYER_PIECE",
          targetPiece: piece.id
        });
    }

    // Piece
    if (reduxGame.phase === Phase.selectPiece) {
      reduxDispatch(actions.pieceSelected(piece.id));
    }
    if (reduxGame.phase === Phase.selectTarget) {
      reduxDispatch(actions.targetSelected({ piece: piece.id }));
    }
  }
  function fieldClicked(field: number) {
    machineDispatch({ type: "SELECTED_FIELD", targetField: field });
    // Field
    if (reduxGame.phase === Phase.selectBlackTarget) {
      reduxDispatch(actions.blackTargetSelected(field));
    }
    if (reduxGame.phase === Phase.selectGrayTarget) {
      reduxDispatch(actions.grayTargetSelected(field));
    }
    if (reduxGame.phase === Phase.selectTarget) {
      reduxDispatch(actions.targetSelected({ field }));
    }
  }

  const highlightedFields = xMachineHighlightedFields;

  //const phase = Phase[phasereduxGame.phase];
  const phase = machineGame.value;

  return (
    <>
      <p>Current player: {game.currentPlayer}</p>
      <p>Current Phase: {phase}</p>
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
