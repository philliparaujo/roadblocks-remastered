import Cell, { CellElement } from "./Cell";
import Corner from "./Corner";
import Edge from "./Edge";
import { equalCoords, isCell, isCorner } from "../../Utils";
import GameInstance, { Game, PlayerColor } from "../../../GameEngine/Game";
import { Coord } from "./Coord";
import { useEffect, useState } from "react";

export interface UIBoardProps {
  height: number;
  width: number;
  debug?: boolean;
  game?: Game;
}

const UIBoard: React.FC<UIBoardProps> = ({
  height,
  width,
  debug = false,
  game = GameInstance,
}) => {
  const [initialLocations, setInitialLocations] = useState<{
    [key in CellElement]?: Coord;
  }>({});
  const [locationsFetched, setLocationsFetched] = useState(false);

  const fetchInitialLocations = async () => {
    const locations: { [key in CellElement]?: Coord } = {
      redplayer: await game.getInitialLocation("redplayer"),
      blueplayer: await game.getInitialLocation("blueplayer"),
      redend: await game.getInitialLocation("redend"),
      blueend: await game.getInitialLocation("blueend"),
    };
    setInitialLocations(locations);
    setLocationsFetched(true);
  };

  useEffect(() => {
    fetchInitialLocations();
  }, [game]);

  if (!locationsFetched) {
    return <div>Loading...</div>;
  }

  const generateEmptyBoard = (): JSX.Element[] => {
    const board: JSX.Element[] = [];

    for (let i = 0; i < 2 * height + 1; i++) {
      const row: JSX.Element[] = [];
      for (let j = 0; j < 2 * width + 1; j++) {
        if (isCorner({ row: i, col: j })) {
          let corner = (
            <td key={`${i},${j}`}>
              <Corner coord={{ row: i, col: j }} game={game} />
            </td>
          );
          row.push(corner);
        } else if (isCell({ row: i, col: j })) {
          let initialContents: CellElement[] = [];

          for (const key in initialLocations) {
            const cellElement = key as CellElement;
            const cellElementCoord: Coord | undefined =
              initialLocations[cellElement];
            if (cellElementCoord) {
              if (equalCoords({ row: i, col: j }, cellElementCoord)) {
                initialContents.push(cellElement);
              }
            }
          }

          let cell = (
            <td key={`${i},${j}`}>
              <Cell
                coord={{ row: i, col: j }}
                game={game}
                initialContents={initialContents}
              />
            </td>
          );
          row.push(cell);
        } else {
          let edge = (
            <td key={`${i},${j}`}>
              <Edge
                coord={{ row: i, col: j }}
                orientation={i % 2 === 0 ? "horizontal" : "vertical"}
                type="normal"
                debug={debug}
                game={game}
              />
            </td>
          );
          row.push(edge);
        }
      }
      board.push(<tr key={i}>{row}</tr>);
    }
    return board;
  };

  return (
    <div className="game-board">
      <table>
        <tbody>{generateEmptyBoard()}</tbody>
      </table>
    </div>
  );
};

export default UIBoard;
