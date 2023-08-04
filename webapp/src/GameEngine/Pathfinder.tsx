import { averageCoord, equalCoords, isInBounds } from "@roadblocks/engine";
import { Coord } from "@roadblocks/types";
import { Board } from "./Board";

type direction = Coord;
type CoordString = String;

const PriorityQueue = require("js-priority-queue");

export const directions: direction[] = [
  { row: -2, col: 0 },
  { row: 0, col: 2 },
  { row: 2, col: 0 },
  { row: 0, col: -2 },
];

function isObstacle(coord: Coord, board: Board) {
  const element = board.get(coord);
  return element === "#" || element === "|" || element === "-";
}

export class PathfinderImpl {
  static hasPath = (start: Coord, end: Coord, board: Board): boolean => {
    return PathfinderImpl.shortestPath(start, end, board) !== null;
  };

  static shortestPath = (
    start: Coord,
    end: Coord,
    board: Board
  ): Coord[] | null => {
    const heuristic = (a: Coord, b: Coord) =>
      Math.abs(a.row - b.row) + Math.abs(a.col - b.col);

    let queue = new PriorityQueue({
      comparator: (
        a: { coord: Coord; priority: number },
        b: { coord: Coord; priority: number }
      ) => a.priority - b.priority,
    });
    queue.queue({ coord: start, priority: 0 });

    let cameFrom: Map<Coord, Coord | undefined> = new Map();
    const visited = new Set();

    queue.queue({ coord: start, priority: 0 });
    cameFrom.set(start, undefined);

    while (queue.length > 0) {
      let currentObject = queue.dequeue();
      let current: Coord | undefined = currentObject.coord;

      if (current && equalCoords(current, end)) {
        let path: Coord[] = [];

        while (current != undefined) {
          path.push(current);
          current = cameFrom.get(current);
        }

        path.reverse();
        return path;
      }

      if (current === undefined) {
        throw new Error("current is somehow undefined ??");
      }

      for (let direction of directions) {
        let newCoord = {
          row: current.row + direction.row,
          col: current.col + direction.col,
        };
        let midPoint = averageCoord(current, newCoord);

        if (
          isInBounds(newCoord, 2 * board.width + 1, 2 * board.height + 1) &&
          !isObstacle(midPoint, board) &&
          !visited.has(JSON.stringify(newCoord))
        ) {
          let cost = currentObject.priority;
          let priority = cost + heuristic(end, newCoord);
          queue.queue({ coord: newCoord, priority });
          cameFrom.set(newCoord, current);
          visited.add(JSON.stringify(newCoord));
        }
      }
    }

    return null;
  };
}
