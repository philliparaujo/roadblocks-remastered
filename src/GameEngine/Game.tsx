import { CellElement } from "../components/UI/Board/Cell";
import { Coord } from "../components/UI/Board/Coord";
import { isHorizontalEdge, isVerticalEdge } from "../components/Utils";
import {
  PlayerEventSubscription,
  PlayerMovedSubscriber,
} from "./PlayerMovedSubscriber";
import { SwitchTurnSubscriber } from "./SwitchTurnSubscriber";

type TurnPhase = "placingWalls" | "movingPlayer";
export type PlayerColor = "red" | "blue";
type PlayerLocations = { [key in PlayerColor]: Coord };

interface GameState {
  redTurn: boolean;
  phase: TurnPhase;
  id: number;
  playerLocations: PlayerLocations;
  endLocations: PlayerLocations;
  playerMovedSubscriptions: PlayerMovedSubscriber;
  switchTurnSubscriptions: SwitchTurnSubscriber;
}
interface EdgeResult {}
interface LockWallResult {}
interface EndTurnResult {}
interface ResetResult {}
interface PlayerMovedResult {}

export interface Game {
  addEdge: (coord: Coord) => Promise<EdgeResult>;
  removeEdge: (coord: Coord) => Promise<EdgeResult>;
  lockWalls: () => Promise<LockWallResult>;
  switchTurn: () => Promise<EndTurnResult>;
  isRedTurn: () => Promise<boolean>;
  reset: () => Promise<ResetResult>;
  playerLocation: () => Coord;
  setPlayerLocation: (coord: Coord) => Promise<PlayerMovedResult>;
  getInitialLocation: (cellElement: CellElement) => Promise<Coord>;
  playerMovedEventSubscription: () => PlayerEventSubscription;
  switchTurnEventSubscription: () => SwitchTurnSubscriber;
}

var id = 1;

export class GameInstance implements Game {
  state: GameState = {
    redTurn: true,
    phase: "placingWalls",
    id: id++,
    playerLocations: { red: { row: 7, col: 1 }, blue: { row: 1, col: 7 } },
    endLocations: { red: { row: 7, col: 13 }, blue: { row: 13, col: 7 } },
    playerMovedSubscriptions: new PlayerMovedSubscriber(),
    switchTurnSubscriptions: new SwitchTurnSubscriber(),
  };

  constructor() {
    console.log("Created game object", this.state.id);
  }

  addEdge = (coord: Coord): Promise<EdgeResult> => {
    if (this.state.phase !== "placingWalls") {
      return Promise.reject("NOT WALL PHASE");
    }

    if (isVerticalEdge(coord)) {
      return this.state.redTurn
        ? Promise.resolve({})
        : Promise.reject("WRONG TURN");
    }

    if (isHorizontalEdge(coord)) {
      return !this.state.redTurn
        ? Promise.resolve({})
        : Promise.reject("WRONG TURN");
    }

    return Promise.reject("INVALID ADD");
  };

  removeEdge = (coord: Coord): Promise<EdgeResult> => {
    if (this.state.phase !== "placingWalls") {
      return Promise.reject("NOT WALL PHASE");
    }

    if (isVerticalEdge(coord)) {
      return this.state.redTurn
        ? Promise.resolve({})
        : Promise.reject("WRONG TURN");
    }

    if (isHorizontalEdge(coord)) {
      return !this.state.redTurn
        ? Promise.resolve({})
        : Promise.reject("WRONG TURN");
    }

    return Promise.reject("INVALID REMOVE");
  };

  lockWalls = (): Promise<LockWallResult> => {
    this.state.phase = "movingPlayer";
    return Promise.resolve({});
  };

  switchTurn = (): Promise<EndTurnResult> => {
    this.state.redTurn = !this.state.redTurn;
    this.state.phase = "placingWalls";
    this.state.switchTurnSubscriptions.notify({ redTurn: this.state.redTurn });
    // console.log(`redTurn: ${this.state.redTurn}`);
    return Promise.resolve({});
  };

  isRedTurn = (): Promise<boolean> => Promise.resolve(this.state.redTurn);

  reset = (): Promise<ResetResult> => {
    this.state.redTurn = true;
    this.state.phase = "placingWalls";
    return Promise.resolve({});
    // console.log(`redTurn: ${this.state.redTurn}`);
  };

  playerLocation = (): Coord =>
    this.state.redTurn
      ? this.state.playerLocations["red"]
      : this.state.playerLocations["blue"];

  setPlayerLocation = (coord: Coord): Promise<PlayerMovedResult> => {
    if (this.state.phase !== "movingPlayer") {
      return Promise.reject("NOT PLAYER MOVE PHASE");
    }

    const player = this.state.redTurn ? "red" : "blue";
    const oldLocation = this.state.playerLocations[player];

    // TODO: Check if you can really move
    // return Promise.reject if error

    this.state.playerLocations[player] = coord;

    this.state.playerMovedSubscriptions.notify({
      player: player,
      from: oldLocation,
      to: coord,
    });

    return Promise.resolve({});
  };

  getInitialLocation = (cellElement: CellElement): Promise<Coord> => {
    switch (cellElement) {
      case "redplayer":
        return Promise.resolve(this.state.playerLocations.red);
      case "blueplayer":
        return Promise.resolve(this.state.playerLocations.blue);
      case "redend":
        return Promise.resolve(this.state.endLocations.red);
      case "blueend":
        return Promise.resolve(this.state.endLocations.blue);
    }
  };

  playerMovedEventSubscription = (): PlayerEventSubscription =>
    this.state.playerMovedSubscriptions;

  switchTurnEventSubscription = (): SwitchTurnSubscriber =>
    this.state.switchTurnSubscriptions;
}

const instance = new GameInstance();

export default instance;
