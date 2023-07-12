import { Coord } from "../components/UI/Board/Coord";
import { isHorizontalEdge, isVerticalEdge } from "../components/Utils";

type TurnPhase = "placingWalls" | "movingPlayer";

interface GameState {
  redTurn: boolean;
  phase: TurnPhase;
  id: number;
}
interface EdgeResult {}
interface LockWallResult {}
interface EndTurnResult {}

export interface Game {
  addEdge: (coord: Coord) => Promise<EdgeResult>;
  removeEdge: (coord: Coord) => Promise<EdgeResult>;
  lockWalls: () => Promise<LockWallResult>;
  switchTurn: () => Promise<EndTurnResult>;
  isRedTurn: () => Promise<boolean>;
  reset: () => void;
}

var id = 1;

export class GameInstance implements Game {
  state: GameState = {
    redTurn: true,
    phase: "placingWalls",
    id: id++,
  };

  constructor() {
    console.log("Created game object", this.state.id);
  }

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
