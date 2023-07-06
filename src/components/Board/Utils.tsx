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
