import { Coord } from "./Coord";
import { PlayerColor } from "./Types";

export interface TimedEvent {
  ts: EpochTimeStamp;
  reset?: boolean;
}

class BaseEvent {
  ts: EpochTimeStamp;

  constructor() {
    this.ts = new Date().getTime();
  }
}

export class DiceRollEvent extends BaseEvent implements TimedEvent {
  value: number;

  constructor(value: number) {
    super();
    this.value = value;
  }
}

export class LockWallEvent extends BaseEvent implements TimedEvent {
  locked: boolean;

  constructor(locked: boolean) {
    super();
    this.locked = locked;
  }
}

export class NumWallChangesEvent extends BaseEvent implements TimedEvent {
  wallChanges: number;

  constructor(wallChanges: number) {
    super();
    this.wallChanges = wallChanges;
  }
}

export class PlayerMovedEvent extends BaseEvent implements TimedEvent {
  player: PlayerColor;
  from: Coord;
  to: Coord;
  numMovements: number;

  constructor(
    player: PlayerColor,
    from: Coord,
    to: Coord,
    numMovements: number
  ) {
    super();
    this.player = player;
    this.from = from;
    this.to = to;
    this.numMovements = numMovements;
  }
}

export class StartGameEvent extends BaseEvent implements TimedEvent {
  startingPlayer: PlayerColor;

  constructor(startingPlayer: PlayerColor) {
    super();
    this.startingPlayer = startingPlayer;
  }
}

export class SwitchTurnEvent extends BaseEvent implements TimedEvent {
  turn: PlayerColor;

  constructor(turn: PlayerColor) {
    super();
    this.turn = turn;
  }
}

export class WallToggledEvent extends BaseEvent implements TimedEvent {
  wall: Coord;
  isToggled: boolean;

  constructor(wall: Coord, isToggled: boolean) {
    super();
    this.wall = wall;
    this.isToggled = isToggled;
  }
}

export class WinGameEvent extends BaseEvent implements TimedEvent {
  winner: PlayerColor;

  constructor(winner: PlayerColor) {
    super();
    this.winner = winner;
  }
}

export class ErrorEvent extends BaseEvent implements TimedEvent {
  message: string;

  constructor(message: string) {
    super();
    this.message = message;
  }
}
