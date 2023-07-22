import { CellElement } from "../components/Board/Cell";
import { Coord } from "../Coord";
import {
  equalCoords,
  isAdjacent,
  isBorderEdge,
  isEdge,
  isHorizontalEdge,
  isValidMove,
  isVerticalEdge,
} from "../Utils";
import {
  PlayerEventSubscription,
  PlayerMovedSubscriber,
} from "./PlayerMovedSubscriber";
import { SwitchTurnSubscriber } from "./SwitchTurnSubscriber";
import {
  WallToggledEventSubscription,
  WallToggledSubscriber,
} from "./WallToggledSubscriber";

type TurnPhase = "placingWalls" | "movingPlayer";
export type PlayerColor = "red" | "blue";
type CellLocations = { [key in PlayerColor]: Coord };
export type WallLocations = { [key in PlayerColor | "locked"]: Coord[] };

interface GameState {
  turn: PlayerColor;
  phase: TurnPhase;
  width: number;
  height: number;
  id: number;
  playerLocations: CellLocations;
  endLocations: CellLocations;
  wallLocations: WallLocations;
  playerMovedSubscriptions: PlayerMovedSubscriber;
  switchTurnSubscriptions: SwitchTurnSubscriber;
  wallToggledSubscriptions: WallToggledSubscriber;
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
  getTurn: () => Promise<PlayerColor>;
  reset: () => Promise<ResetResult>;
  playerLocation: (player: PlayerColor) => Promise<Coord>;
  endLocation: (player: PlayerColor) => Promise<Coord>;
  setPlayerLocation: (coord: Coord) => Promise<PlayerMovedResult>;
  getInitialCellLocation: (cellElement: CellElement) => Promise<Coord>;
  getWallLocations: () => Promise<WallLocations>;
  getWidth: () => Promise<number>;
  getHeight: () => Promise<number>;
  playerMovedEventSubscription: () => PlayerEventSubscription;
  switchTurnEventSubscription: () => SwitchTurnSubscriber;
  wallToggledEventSubscription: () => WallToggledEventSubscription;
}

var id = 1;

export class GameImpl implements Game {
  state: GameState = {
    turn: "red",
    phase: "placingWalls",
    width: 7,
    height: 7,
    id: id++,
    playerLocations: { red: { row: 7, col: 1 }, blue: { row: 1, col: 7 } },
    endLocations: { red: { row: 7, col: 13 }, blue: { row: 13, col: 7 } },
    wallLocations: { red: [], blue: [], locked: [] },
    playerMovedSubscriptions: new PlayerMovedSubscriber(),
    switchTurnSubscriptions: new SwitchTurnSubscriber(),
    wallToggledSubscriptions: new WallToggledSubscriber(),
  };

  constructor(width: number, height: number) {
    this.state.width = width;
    this.state.height = height;
    console.log("Created game object", this.state.id);
    this.generateRandomWallLocations(this.state.width, this.state.height);
  }

  handleEdgeAction = (coord: Coord, placing: boolean): Promise<EdgeResult> => {
    if (this.state.phase !== "placingWalls") {
      return Promise.reject("NOT WALL PHASE");
    }

    if (!isEdge(coord)) {
      return Promise.reject("INVALID COORD");
    }

    const isVertical = isVerticalEdge(coord);
    const isCorrectTurn = isVertical
      ? this.state.turn === "red"
      : this.state.turn === "blue";

    if (placing && isCorrectTurn) {
      this.state.wallLocations[this.state.turn].push(coord);
      this.notifyWallToggled(coord, true);
      console.log(this.state.wallLocations);
      return Promise.resolve({});
    } else if (!placing && isCorrectTurn) {
      this.state.wallLocations[this.state.turn] = this.state.wallLocations[
        this.state.turn
      ].filter((wall) => !equalCoords(wall, coord));
      this.notifyWallToggled(coord, false);
      return Promise.resolve({});
    } else {
      return Promise.reject("WRONG TURN");
    }
  };

  notifyWallToggled = (coord: Coord, isToggled: boolean): void => {
    this.state.wallToggledSubscriptions.notify({
      wall: coord,
      isToggled: isToggled,
    });
    // console.log(this.state.wallLocations);
  };

  addEdge = (coord: Coord): Promise<EdgeResult> => {
    return this.handleEdgeAction(coord, true);
  };

  removeEdge = (coord: Coord): Promise<EdgeResult> => {
    return this.handleEdgeAction(coord, false);
  };

  lockWalls = (): Promise<LockWallResult> => {
    this.state.phase = "movingPlayer";
    return Promise.resolve({});
  };

  switchTurn = (): Promise<EndTurnResult> => {
    this.state.turn = this.state.turn === "red" ? "blue" : "red";
    this.state.phase = "placingWalls";
    this.state.switchTurnSubscriptions.notify({ turn: this.state.turn });
    return Promise.resolve({});
  };

  getTurn = (): Promise<PlayerColor> => Promise.resolve(this.state.turn);

  reset = (): Promise<ResetResult> => {
    this.state.turn = "red";
    this.state.phase = "placingWalls";
    return Promise.resolve({});
  };

  playerLocation = (player: PlayerColor): Promise<Coord> =>
    Promise.resolve(this.state.playerLocations[player]);

  endLocation = (player: PlayerColor): Promise<Coord> =>
    Promise.resolve(this.state.endLocations[player]);

  setPlayerLocation = (coord: Coord): Promise<PlayerMovedResult> => {
    if (this.state.phase !== "movingPlayer") {
      return Promise.reject("NOT MOVE PHASE");
    }

    const player = this.state.turn;
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

    const end =
      this.state.turn === "red"
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

  getWallLocations = (): Promise<WallLocations> => {
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

  wallToggledEventSubscription = (): WallToggledSubscriber =>
    this.state.wallToggledSubscriptions;

  generateRandomWallLocations = (width: number, height: number): void => {
    for (let i = 0; i <= height * 2; i++) {
      for (let j = 0; j <= width * 2; j++) {
        const coord: Coord = { row: i, col: j };
        const symmetricalCoord: Coord = { row: j, col: i };
        if (isEdge(coord) && !isBorderEdge(coord, width, height)) {
          if (!this.state.wallLocations.locked.includes(coord)) {
            if (Math.random() > 0.9) {
              this.state.wallLocations.locked.push(coord);
              this.state.wallLocations.locked.push(symmetricalCoord);
            }
          }
        }
      }
    }
  };

  winGame = (): void => {
    alert((this.state.turn === "red" ? "Red" : "Blue") + " player won!");
  };
}

const instance = new GameImpl(7, 7);

export default instance;
