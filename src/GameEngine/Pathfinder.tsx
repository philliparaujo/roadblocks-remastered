import { Coord } from "../Coord";
import { averageCoord, equalCoords, isInBounds } from "../Utils";
import Board from "./Board";
import { TextBoard } from "./TextBoard";

type direction = Coord;
type CoordString = String;

interface Pathfinder {
  directions: direction[];
  visited: Set<CoordString>;
  hasPath: (start: Coord, end: Coord, board: Board) => boolean;
  shortestPath: (start: Coord, end: Coord, board: Board) => Coord[] | null;
}

export class PathfinderImpl implements Pathfinder {
  directions: direction[];
  visited: Set<CoordString>;

  constructor() {
    this.directions = [
      { row: -2, col: 0 },
      { row: 0, col: 2 },
      { row: 2, col: 0 },
      { row: 0, col: -2 },
    ];
    this.visited = new Set();
  }

  isObstacle(coord: Coord, board: Board) {
    const element = board.getByCoord(coord);
    return element === "#" || element === "|" || element === "-";
  }

  hasPath = (start: Coord, end: Coord, board: Board): boolean => {
    return this.shortestPath(start, end, board) !== null;
  };

  shortestPath = (start: Coord, end: Coord, board: Board): Coord[] | null => {
    // setup queue, Map, visisted
    let queue: Coord[] = [];
    let cameFrom: Map<Coord, Coord | undefined> = new Map();
    this.visited = new Set();

    queue.push(start);
    cameFrom.set(start, undefined);

    // while unvisited neighbors exist, search until reaching end
    while (queue.length > 0) {
      let current: Coord | undefined = queue.shift();

      // if end reached, return path
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

      // otherwise, get neighbors and add them
      for (let direction of this.directions) {
        let newCoord: Coord = {
          row: current.row + direction.row,
          col: current.col + direction.col,
        };

        let midPoint: Coord = averageCoord(current, newCoord);

        if (
          isInBounds(
            newCoord,
            2 * board.getWidth() + 1,
            2 * board.getHeight() + 1
          ) &&
          !this.isObstacle(midPoint, board) &&
          !this.visited.has(JSON.stringify(newCoord))
        ) {
          queue.push(newCoord);
          cameFrom.set(newCoord, current);
          this.visited.add(JSON.stringify(newCoord));
        }
      }
    }

    return null;
  };
}
