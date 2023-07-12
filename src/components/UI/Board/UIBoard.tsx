import Cell from "./Cell";
import Corner from "./Corner";
import Edge from "./Edge";
import { isCell, isCorner } from "../../Utils";
import GameInstance, { Game } from "../../../GameEngine/Game";

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
          let cell = (
            <td key={`${i},${j}`}>
              <Cell coord={{ row: i, col: j }} game={game} />
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
