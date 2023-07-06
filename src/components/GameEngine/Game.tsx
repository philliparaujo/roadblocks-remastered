import { Coord } from "../Board/Coord";
import { isHorizontalEdge, isVerticalEdge } from "../Board/Utils";

interface GameState {
  redTurn: boolean;
}
interface EdgeResult {}
interface EndTurnResult {}

interface Game {
  state: GameState;
  addEdge: (coord: Coord) => Promise<EdgeResult>;
  removeEdge: (coord: Coord) => Promise<EdgeResult>;
  switchTurn: () => Promise<EndTurnResult>;
}

class GameInstance implements Game {
  state = {
    redTurn: true,
  };

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

    return Promise.reject("INVALID");
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

    return Promise.reject("INVALID");
  };

  switchTurn = (): Promise<EndTurnResult> => {
    this.state.redTurn = !this.state.redTurn;
    console.log(`redTurn: ${this.state.redTurn}`);
    return Promise.resolve({});
  };
}

const instance = new GameInstance();

export default instance;
