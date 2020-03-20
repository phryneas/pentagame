import React from "react";
import { Board as BoardType, Color, Piece, Field } from "./logic/board";

interface Props {
  board: BoardType;
  pieces: Piece[];
  higlighted?: Array<Piece | Field>;
  fieldClicked(field: number): void;
  pieceClicked(piece: number): void;
}
export function Board({
  board,
  pieces,
  fieldClicked,
  pieceClicked,
  higlighted = []
}: Props) {
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)"
      }}
    >
      {board.map((field, idx) => {
        const [ring, deg] = field.coord;
        return (
          <div
            key={idx}
            data-identity={idx}
            style={{
              border: higlighted.includes(field) ? "2mm solid red" : undefined,
              backgroundColor:
                typeof field.color !== "undefined"
                  ? Color[field.color]
                  : "black",
              padding: "2mm",
              position: "absolute",
              transformOrigin: "center top",
              transform: `rotate(${deg}deg) translate(0, ${ring * 75}px) `,
              borderRadius: "50%",
              width: 25,
              height: 25
            }}
            onClick={e => {
              e.stopPropagation();
              fieldClicked(idx);
              console.log(field);
            }}
          >
            {field.pieces
              .map(id => pieces[id])
              .map(piece => (
                <button
                  key={"" + piece.color + piece.player}
                  style={{
                    backgroundColor: Color[piece.color],
                    border: higlighted.includes(piece)
                      ? "2mm solid aqua"
                      : undefined
                  }}
                  onClick={e => {
                    e.stopPropagation();
                    pieceClicked(piece.id);
                  }}
                >
                  {piece.player || "👻"}
                </button>
              ))}
          </div>
        );
      })}
    </div>
  );
}
