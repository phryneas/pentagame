import React from "react";
import { Board as BoardType, Color, Piece, Field } from "./logic/board";

interface Props {
  board: BoardType;
  higlightedPiece?: Piece;
  onClick(elem: Piece | number): void;
}
export function Board({ board, onClick, higlightedPiece }: Props) {
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)"
      }}
    >
      {board.map((field, idx) => (
        <div
          key={idx}
          data-identity={idx}
          style={{
            border: "1px solid black",
            padding: "2mm",
            position: "absolute",
            transformOrigin: "center top",
            transform: `rotate(${field.position + 180}deg) translate(0, ${(10 -
              field.ring) *
              50}px) `
          }}
          onClick={e => {
            e.stopPropagation();
            onClick(idx);
          }}
        >
          {field.pieces.map(piece => (
            <button
              key={"" + piece.color + piece.player}
              style={{ backgroundColor: Color[piece.color] }}
              onClick={e => {
                e.stopPropagation();
                onClick(piece);
              }}
            >
              {piece.player || "👻"}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
