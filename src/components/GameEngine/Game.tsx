import { Coord } from "../Board/Coord";
import { isHorizontalEdge, isVerticalEdge } from "../Board/Utils";

interface GameState {
  redTurn: boolean;
}
interface EdgeResult {}
interface EndTurnResult {}

export interface Game {
  addEdge: (coord: Coord) => Promise<EdgeResult>;
  removeEdge: (coord: Coord) => Promise<EdgeResult>;
  switchTurn: () => Promise<EndTurnResult>;
  isRedTurn: () => Promise<boolean>;
  reset: () => void;
}

var id = 1;

export class GameInstance implements Game {
  state = {
    redTurn: true,
    id: id++,
  };

  constructor() {
    console.log("Created game object", this.state.id);
  }

  isRedTurn = (): Promise<boolean> => Promise.resolve(this.state.redTurn);

  addEdge = (coord: Coord): Promise<EdgeResult> => {
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

  switchTurn = (): Promise<EndTurnResult> => {
    this.state.redTurn = !this.state.redTurn;
    // console.log(`redTurn: ${this.state.redTurn}`);
    return Promise.resolve({});
  };

  reset = (): void => {
    this.state.redTurn = true;
    // console.log(`redTurn: ${this.state.redTurn}`);
  };
}

const instance = new GameInstance();

export default instance;
