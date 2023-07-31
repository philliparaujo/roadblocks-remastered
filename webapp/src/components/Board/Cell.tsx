import { useEffect, useState } from "react";
import GameInstance, { Game } from "../../GameEngine/Game";
import "./Cell.css";
import { Coord } from "@roadblocks/engine";
import { equalCoords } from "@roadblocks/engine";

export type CellElement = "redplayer" | "redend" | "blueplayer" | "blueend";
type CellContents = CellElement[];
export type CellType = "normal" | "disabled";

export interface CellProps {
  coord: Coord;
  initialContents?: CellContents;
  type?: CellType;
  game?: Game;
}

const Cell: React.FC<CellProps> = ({
  coord,
  initialContents = [],
  type = "normal",
  game = GameInstance,
}) => {
  const [contents, setContents] = useState<CellContents>(initialContents);

  const generateCellContents = (): JSX.Element[] => {
    let result: JSX.Element[] = [];

    for (let i = 0; i < contents.length; i++) {
      let element = contents[i];
      switch (element) {
        case "redplayer":
          result.push(
            <span key={i} role="img" aria-label="redplayer">
              🔴
            </span>
          );
          break;
        case "redend":
          result.push(
            <span key={i} role="img" aria-label="redend">
              🟥
            </span>
          );
          break;
        case "blueplayer":
          result.push(
            <span key={i} role="img" aria-label="blueplayer">
              🔵
            </span>
          );
          break;
        case "blueend":
          result.push(
            <span key={i} role="img" aria-label="blueend">
              🟦
            </span>
          );
          break;
      }
    }

    return result;
  };

  useEffect(() => {
    const unsubscribe = game.playerMovedEventSubscription().subscribe((e) => {
      const playerColor: CellElement =
        e.player === "red" ? "redplayer" : "blueplayer";

      // remove player from old cell
      if (equalCoords(coord, e.from)) {
        setContents((oldContents) =>
          oldContents.filter((element) => element !== playerColor)
        );
      }

      // add player to new cell
      if (equalCoords(coord, e.to)) {
        setContents((oldContents) => [...oldContents, playerColor]);
      }
    });
    return () => unsubscribe();
  }, [game]);

  const handleClick = () => {
    if (type === "disabled") {
      return;
    }

    game.setPlayerLocation(coord).catch((err) => {
      console.error(`NAY(${err})! cell: (${coord.row}, ${coord.col})`);
    });
  };

  return (
    <div className="cell" onClick={handleClick}>
      {generateCellContents()}
    </div>
  );
};

export default Cell;
