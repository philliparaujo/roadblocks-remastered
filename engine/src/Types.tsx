import { Coord } from "./Coord";

export type TurnPhase = "placingWalls" | "movingPlayer";
export type PlayerColor = "red" | "blue";
export type CellLocations = {
  [key in PlayerColor]: Coord;
};
export type WallLocations = {
  [key in PlayerColor | "locked"]: Coord[];
};
export type DiceInfo = {
  [key in PlayerColor]: number[];
};
