import React from "react";
import { Board } from "./Board";
import { Piece, Color } from "./logic/board";
import { machine, selectHighlightedFields } from "./logic/xStateGame";
import { useMachine } from "@xstate/react";

const App = () => {
  const [machineState, machineDispatch] = useMachine(machine, {
    devTools: true
  });
  const { context: game, value: phase } = machineState;

  return (
    <>
      <p>Current player: {game.currentPlayer}</p>
      <p>Current Phase: {phase}</p>
      <Board
        board={game.board}
        pieces={game.pieces}
        higlighted={selectHighlightedFields(machineState)}
        fieldClicked={fieldClicked}
        pieceClicked={pieceClicked}
      />
    </>
  );

  function pieceClicked(piece: Piece) {
    switch (piece.color) {
      case Color.black:
        machineDispatch({
          type: "SELECTED_BLACK_PIECE",
          targetPiece: piece.id,
          sender: game.currentPlayer
        });
        break;
      case Color.gray:
        machineDispatch({
          type: "SELECTED_GRAY_PIECE",
          targetPiece: piece.id,
          sender: game.currentPlayer
        });
        break;
      default:
        machineDispatch({
          type: "SELECTED_PLAYER_PIECE",
          targetPiece: piece.id,
          sender: game.currentPlayer
        });
    }
  }
  function fieldClicked(field: number) {
    machineDispatch({
      type: "SELECTED_FIELD",
      targetField: field,
      sender: game.currentPlayer
    });
  }
};

export default App;
