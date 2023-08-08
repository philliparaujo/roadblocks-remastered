import { Coord } from "./Coord";
import { PlayerColor, WallLocations } from "./Types";

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
export interface TurnResult {
  turn: PlayerColor;
}
export interface CanEndTurnResult {
  canEndTurn: boolean;
}
export interface PathExistsResult {
  pathExists: boolean;
}
export interface LockWallResult {}
export interface EndTurnResult {}
export interface PlayerMovedResult {}
export interface DiceRollResult {
  diceValue: number;
}

/* From game */

export interface StartGameResult {}
export interface EdgeResult {}
export interface ResetResult {}
