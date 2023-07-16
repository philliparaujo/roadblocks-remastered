import { CellElement } from "../components/UI/Board/Cell";
import { Coord } from "../components/UI/Board/Coord";
import {
  equalCoords,
  isAdjacent,
  isBorderEdge,
  isEdge,
  isHorizontalEdge,
  isValidMove,
  isVerticalEdge,
} from "../components/Utils";
import {
  PlayerEventSubscription,
  PlayerMovedSubscriber,
} from "./PlayerMovedSubscriber";
import { SwitchTurnSubscriber } from "./SwitchTurnSubscriber";

type TurnPhase = "placingWalls" | "movingPlayer";
export type PlayerColor = "red" | "blue";
type CellLocations = { [key in PlayerColor]: Coord };
type WallLocations = Coord[];

interface GameState {
  redTurn: boolean;
  phase: TurnPhase;
  width: number;
  height: number;
  id: number;
  playerLocations: CellLocations;
  endLocations: CellLocations;
  wallLocations: WallLocations;
  playerMovedSubscriptions: PlayerMovedSubscriber;
  switchTurnSubscriptions: SwitchTurnSubscriber;
}
interface EdgeResult {}
interface LockWallResult {}
interface EndTurnResult {}
interface ResetResult {}
interface PlayerMovedResult {}

export interface Game {
  // new(width, height)
  // join(gid)
  // watch(gid)
  addEdge: (coord: Coord) => Promise<EdgeResult>;
  removeEdge: (coord: Coord) => Promise<EdgeResult>;
  lockWalls: () => Promise<LockWallResult>;
  switchTurn: () => Promise<EndTurnResult>;
  isRedTurn: () => Promise<boolean>;
  reset: () => Promise<ResetResult>;
  playerLocation: () => Coord;
  setPlayerLocation: (coord: Coord) => Promise<PlayerMovedResult>;
  getInitialCellLocation: (cellElement: CellElement) => Promise<Coord>;
  getInitialWallLocations: () => Promise<WallLocations>;
  getWidth: () => Promise<number>;
  getHeight: () => Promise<number>;
  playerMovedEventSubscription: () => PlayerEventSubscription;
  switchTurnEventSubscription: () => SwitchTurnSubscriber;
}

var id = 1;

export class GameInstance implements Game {
  state: GameState = {
    redTurn: true,
    phase: "placingWalls",
    width: 7,
    height: 7,
    id: id++,
    playerLocations: { red: { row: 7, col: 1 }, blue: { row: 1, col: 7 } },
    endLocations: { red: { row: 7, col: 13 }, blue: { row: 13, col: 7 } },
    wallLocations: [],
    playerMovedSubscriptions: new PlayerMovedSubscriber(),
    switchTurnSubscriptions: new SwitchTurnSubscriber(),
  };

  constructor(width: number, height: number) {
    this.state.width = width;
    this.state.height = height;
    console.log("Created game object", this.state.id);
    this.generateRandomWallLocations(this.state.width, this.state.height);
  }

  addEdge = (coord: Coord): Promise<EdgeResult> => {
    if (this.state.phase !== "placingWalls") {
      return Promise.reject("NOT WALL PHASE");
    }

    if (!isEdge(coord)) {
      return Promise.reject("INVALID COORD");
    }

    if (isVerticalEdge(coord)) {
      if (this.state.redTurn) {
        this.state.wallLocations.push(coord);
        console.log(this.state.wallLocations);
        return Promise.resolve({});
      } else {
        return Promise.reject("WRONG TURN");
      }
    } else {
      if (!this.state.redTurn) {
        this.state.wallLocations.push(coord);
        console.log(this.state.wallLocations);
        return Promise.resolve({});
      } else {
        return Promise.reject("WRONG TURN");
      }
    }
  };

  removeEdge = (coord: Coord): Promise<EdgeResult> => {
    if (this.state.phase !== "placingWalls") {
      return Promise.reject("NOT WALL PHASE");
    }

    if (!isVerticalEdge(coord) && !isHorizontalEdge(coord)) {
      return Promise.reject("INVALID ADD");
    }

    this.state.wallLocations = this.state.wallLocations.filter(
      (wall) => wall !== coord
    );
    console.log(this.state.wallLocations);

    if (isVerticalEdge(coord)) {
      return this.state.redTurn
        ? Promise.resolve({})
        : Promise.reject("WRONG TURN");
    } else {
      return !this.state.redTurn
        ? Promise.resolve({})
        : Promise.reject("WRONG TURN");
    }
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
      return Promise.reject("NOT MOVE PHASE");
    }

    const player = this.state.redTurn ? "red" : "blue";
    const oldLocation = this.state.playerLocations[player];

    if (!isValidMove(oldLocation, coord, this.state.wallLocations)) {
      return Promise.reject("NOT ADJACENT CELL");
    }

    this.state.playerLocations[player] = coord;

    this.state.playerMovedSubscriptions.notify({
      player: player,
      from: oldLocation,
      to: coord,
    });

    const end = this.state.redTurn
      ? this.state.endLocations.red
      : this.state.endLocations.blue;
    if (equalCoords(coord, end)) {
      this.winGame();
    }

    return Promise.resolve({});
  };

  getInitialCellLocation = (cellElement: CellElement): Promise<Coord> => {
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

  getInitialWallLocations = (): Promise<WallLocations> => {
    return Promise.resolve(this.state.wallLocations);
  };

  getWidth = (): Promise<number> => {
    return Promise.resolve(this.state.width);
  };

  getHeight = (): Promise<number> => {
    return Promise.resolve(this.state.height);
  };

  playerMovedEventSubscription = (): PlayerEventSubscription =>
    this.state.playerMovedSubscriptions;

  switchTurnEventSubscription = (): SwitchTurnSubscriber =>
    this.state.switchTurnSubscriptions;

  generateRandomWallLocations = (width: number, height: number): void => {
    for (let i = 0; i <= height * 2; i++) {
      for (let j = 0; j <= width * 2; j++) {
        const coord: Coord = { row: i, col: j };
        const symmetricalCoord: Coord = { row: j, col: i };
        if (isEdge(coord) && !isBorderEdge(coord, width, height)) {
          if (!this.state.wallLocations.includes(coord)) {
            if (Math.random() > 0.9) {
              this.state.wallLocations.push(coord);
              this.state.wallLocations.push(symmetricalCoord);
            }
          }
        }
      }
    }
  };

  winGame = (): void => {
    alert((this.state.redTurn ? "Red" : "Blue") + " player won!");
  };
}

const instance = new GameInstance(7, 7);

export default instance;
