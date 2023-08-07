export interface NewGameResult {
  sessionId: string;
  gameId: string;
}

export interface JoinGameResult {
  sessionId: string;
}

export interface AddEdgeResult {}
export interface RemoveEdgeResult {}

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
