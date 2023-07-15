import Cell, { CellElement } from "./Cell";
import Corner from "./Corner";
import Edge, { EdgeType } from "./Edge";
import { equalCoords, isCell, isCorner } from "../../Utils";
import GameInstance, { Game, PlayerColor } from "../../../GameEngine/Game";
import { Coord } from "./Coord";
import { useEffect, useState } from "react";

export interface UIBoardProps {
  height?: number;
  width?: number;
  debug?: boolean;
  game?: Game;
}

const useGameSize = (
  game: Game,
  initialHeight?: number,
  initialWidth?: number
) => {
  const [size, setSize] = useState<[number, number] | null>(null);

  useEffect(() => {
    const fetchSize = async () => {
      if (game) {
        const [gameHeight, gameWidth] = await Promise.all([
          game.getHeight(),
          game.getWidth(),
        ]);
        setSize([initialHeight ?? gameHeight, initialWidth ?? gameWidth]);
      }
    };
    fetchSize();
  }, [game]);

  return size;
};

const useInitialLocations = (game: Game) => {
  const [initialCellLocations, setInitialCellLocations] = useState<{
    [key in CellElement]?: Coord;
  }>({});
  const [initialWallLocations, setInitialWallLocations] = useState<Coord[]>([]);
  const [locationsFetched, setLocationsFetched] = useState(false);

  useEffect(() => {
    const fetchInitialLocations = async () => {
      const cellLocations: { [key in CellElement]?: Coord } = {
        redplayer: await game.getInitialCellLocation("redplayer"),
        blueplayer: await game.getInitialCellLocation("blueplayer"),
        redend: await game.getInitialCellLocation("redend"),
        blueend: await game.getInitialCellLocation("blueend"),
      };
      setInitialCellLocations(cellLocations);

      const wallLocations = await game.getInitialWallLocations();
      setInitialWallLocations(wallLocations);

      setLocationsFetched(true);
    };
    fetchInitialLocations();
  }, [game]);

  return locationsFetched
    ? { initialCellLocations, initialWallLocations }
    : null;
};

const createCorner = (coord: Coord, game: Game, i: number, j: number) => {
  return (
    <td key={`${i},${j}`}>
      <Corner coord={coord} game={game} />
    </td>
  );
};

const createCell = (
  coord: Coord,
  game: Game,
  initialCellLocations: { [key in CellElement]?: Coord },
  i: number,
  j: number
) => {
  let initialContents: CellElement[] = [];

  for (const key in initialCellLocations) {
    const cellElement = key as CellElement;
    const cellElementCoord: Coord | undefined =
      initialCellLocations[cellElement];
    if (cellElementCoord && equalCoords(coord, cellElementCoord)) {
      initialContents.push(cellElement);
    }
  }

  return (
    <td key={`${i},${j}`}>
      <Cell coord={coord} game={game} initialContents={initialContents} />
    </td>
  );
};

const createEdge = (
  coord: Coord,
  game: Game,
  debug: boolean,
  initialWallLocations: Coord[],
  i: number,
  j: number
) => {
  let edgeType: EdgeType = "normal";
  for (const initialCoord of initialWallLocations) {
    if (equalCoords(coord, initialCoord)) {
      edgeType = "locked";
    }
  }

  return (
    <td key={`${i},${j}`}>
      <Edge
        coord={coord}
        orientation={i % 2 === 0 ? "horizontal" : "vertical"}
        type={edgeType}
        debug={debug}
        game={game}
      />
    </td>
  );
};

const UIBoard: React.FC<UIBoardProps> = ({
  height: initialHeight,
  width: initialWidth,
  debug = false,
  game = GameInstance,
}) => {
  const size = useGameSize(game, initialHeight, initialWidth);
  const locations = useInitialLocations(game);

  if (!size || !locations) {
    return <div>Loading...</div>;
  }

  const [height, width] = size;
  const { initialCellLocations, initialWallLocations } = locations;

  const generateEmptyBoard = (): JSX.Element[] => {
    const board: JSX.Element[] = [];

    for (let i = 0; i < 2 * height + 1; i++) {
      const row: JSX.Element[] = [];
      for (let j = 0; j < 2 * width + 1; j++) {
        const coord: Coord = { row: i, col: j };
        if (isCorner(coord)) {
          row.push(createCorner(coord, game, i, j));
        } else if (isCell(coord)) {
          row.push(createCell(coord, game, initialCellLocations, i, j));
        } else {
          row.push(createEdge(coord, game, debug, initialWallLocations, i, j));
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
