import { Coord } from "./Coord";
import { WallLocations } from "./Types";

export interface NewGameResult {
  sessionId: string;
  gameId: string;
}

export interface JoinGameResult {
  sessionId: string;
}

export interface AddEdgeResult {}
export interface RemoveEdgeResult {}
export interface WidthResult {
  width: number;
}
export interface HeightResult {
  height: number;
}
export interface CoordResult {
  coord: Coord;
}
export interface WallLocationsResult {
  locations: WallLocations;
}
export interface DiceResult {
  faces: number[];
}

/* From game */

export interface StartGameResult {}
export interface EdgeResult {}
export interface LockWallResult {}
export interface EndTurnResult {}
export interface ResetResult {}
export interface PlayerMovedResult {}
export interface DiceRollResult {
  diceValue: number;
}
