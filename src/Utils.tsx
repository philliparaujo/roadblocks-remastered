import { Coord } from "./Coord";

export const isCorner = (coord: Coord): boolean =>
  coord.row % 2 === 0 && coord.col % 2 === 0;

export const isCell = (coord: Coord): boolean =>
  coord.row % 2 === 1 && coord.col % 2 === 1;

export const isVerticalEdge = (coord: Coord): boolean =>
  coord.row % 2 === 1 && coord.col % 2 === 0;

export const isHorizontalEdge = (coord: Coord): boolean =>
  coord.row % 2 === 0 && coord.col % 2 === 1;

export const isEdge = (coord: Coord): boolean =>
  isVerticalEdge(coord) || isHorizontalEdge(coord);

export const equalCoords = (coord1: Coord, coord2: Coord): boolean =>
  coord1.row === coord2.row && coord1.col === coord2.col;

export const isBorderEdge = (
  coord: Coord,
  width: number,
  height: number
): boolean =>
  coord.row == 0 ||
  coord.col == 0 ||
  coord.row == 2 * height ||
  coord.col == 2 * width;

export const isInBounds = (
  coord: Coord,
  width: number,
  height: number
): boolean =>
  coord.row >= 0 && coord.row < height && coord.col >= 0 && coord.col < width;

export const isAdjacent = (from: Coord, to: Coord): boolean => {
  if (!isCell(from) || !isCell(to)) {
    return false;
  }

  const rowDiff = Math.abs(from.row - to.row);
  const colDiff = Math.abs(from.col - to.col);
  return rowDiff + colDiff == 2;
};

export const averageCoord = (from: Coord, to: Coord): Coord => {
  return { row: (from.row + to.row) / 2, col: (from.col + to.col) / 2 };
};

export const isValidMove = (
  from: Coord,
  to: Coord,
  walls: Coord[]
): boolean => {
  if (!isAdjacent(from, to)) return false;
  const middleEdge: Coord = averageCoord(from, to);

  for (let wall of walls) {
    if (equalCoords(middleEdge, wall)) {
      return false;
    }
  }

  return true;
};
