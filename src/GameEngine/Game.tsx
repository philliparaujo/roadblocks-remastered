import { Coord } from "../components/UI/Board/Coord";
import { isHorizontalEdge, isVerticalEdge } from "../components/Utils";
import {
  PlayerEventSubscription,
  PlayerMovedSubscriber,
} from "./GameSubscriber";

type TurnPhase = "placingWalls" | "movingPlayer";
export type PlayerColor = "red" | "blue";
type PlayerLocations = { [key in PlayerColor]: Coord };

interface GameState {
  redTurn: boolean;
  phase: TurnPhase;
  id: number;
  playerLocations: PlayerLocations;
  playerMovedSubscriptions: PlayerMovedSubscriber;
}
interface EdgeResult {}
interface LockWallResult {}
interface EndTurnResult {}
interface PlayerMovedResult {}

export interface Game {
  addEdge: (coord: Coord) => Promise<EdgeResult>;
  removeEdge: (coord: Coord) => Promise<EdgeResult>;
  lockWalls: () => Promise<LockWallResult>;
  switchTurn: () => Promise<EndTurnResult>;
  isRedTurn: () => Promise<boolean>;
  reset: () => void;
  playerLocation: () => Coord;
  setPlayerLocation: (coord: Coord) => Promise<PlayerMovedResult>;
  playerMovedEventSubscription: () => PlayerEventSubscription;
}

var id = 1;

export class GameInstance implements Game {
  state: GameState = {
    redTurn: true,
    phase: "placingWalls",
    id: id++,
    playerLocations: { red: { row: 0, col: 0 }, blue: { row: 0, col: 0 } },
    playerMovedSubscriptions: new PlayerMovedSubscriber(),
  };

  constructor() {
    console.log("Created game object", this.state.id);
  }

  playerMovedEventSubscription = (): PlayerEventSubscription =>
    this.state.playerMovedSubscriptions;

  playerLocation = (): Coord =>
    this.state.redTurn
      ? this.state.playerLocations["red"]
      : this.state.playerLocations["blue"];

  setPlayerLocation = (coord: Coord): Promise<PlayerMovedResult> => {
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

  isRedTurn = (): Promise<boolean> => Promise.resolve(this.state.redTurn);

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
    // console.log(`redTurn: ${this.state.redTurn}`);
    return Promise.resolve({});
  };

  reset = (): void => {
    this.state.redTurn = true;
    this.state.phase = "placingWalls";
    // console.log(`redTurn: ${this.state.redTurn}`);
  };
}

const instance = new GameInstance();

export default instance;
