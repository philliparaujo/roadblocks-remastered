import { Coord, WallLocations } from "@roadblocks/types";

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
  walls: WallLocations,
  width: number,
  height: number
): boolean => {
  if (!isAdjacent(from, to) || !isInBounds(to, width, height)) return false;
  const middleEdge: Coord = averageCoord(from, to);
  const allWalls = [...walls.red, ...walls.blue, ...walls.locked];

  for (let wall of allWalls) {
    if (equalCoords(middleEdge, wall)) {
      return false;
    }
  }

  return true;
};

export const randomDiceValue = (diceRolls = [1, 2, 3, 4, 5, 6]): number => {
  const index = Math.floor(Math.random() * 6);
  return diceRolls[index];
};

export const distanceBetween = (from: Coord, to: Coord): number => {
  return Math.sqrt(
    Math.pow(from.row - to.row, 2) + Math.pow(from.col - to.col, 2)
  );
};
