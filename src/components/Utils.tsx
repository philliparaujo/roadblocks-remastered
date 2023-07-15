import { Coord } from "./UI/Board/Coord";

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
