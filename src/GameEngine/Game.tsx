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
  randomDiceValue,
} from "../Utils";
import Board from "./Board";
import {
  DiceRollEventSubscription,
  DiceRollSubscriber,
} from "./DiceRollSubscriber";
import {
  LockWallEventSubscription,
  LockWallSubscriber,
} from "./LockWallSubscriber";
import {
  NumWallChangesEventSubscription,
  NumWallChangesSubscriber,
} from "./NumWallChangesSubscriber";
import { PathfinderImpl } from "./Pathfinder";
import {
  PlayerEventSubscription,
  PlayerMovedSubscriber,
} from "./PlayerMovedSubscriber";
import {
  StartGameEventSubscription,
  StartGameSubscriber,
} from "./StartGameSubscriber";
import {
  SwitchTurnEventSubscription,
  SwitchTurnSubscriber,
} from "./SwitchTurnSubscriber";
import { TextBoard } from "./TextBoard";
import {
  WallToggledEventSubscription,
  WallToggledSubscriber,
} from "./WallToggledSubscriber";
import {
  WinGameEventSubscription,
  WinGameSubscriber,
} from "./WinGameSubscriber";

export type TurnPhase = "placingWalls" | "movingPlayer";
export type PlayerColor = "red" | "blue";
type CellLocations = { [key in PlayerColor]: Coord };
export type WallLocations = { [key in PlayerColor | "locked"]: Coord[] };
type DiceInfo = { [key in PlayerColor]: number[] };

export interface GameState {
  gameOver: boolean;
  turn: PlayerColor;
  phase: TurnPhase;
  diceValue: number;
  diceRolled: boolean;
  width: number;
  height: number;
  id: number;
  playerLocations: CellLocations;
  endLocations: CellLocations;
  wallLocations: WallLocations;
  oldBoard: Board | null;
  movements: number;
  diceRolls: DiceInfo;
  rollDurationMs: number;
  playerMovedSubscriptions: PlayerMovedSubscriber;
  switchTurnSubscriptions: SwitchTurnSubscriber;
  wallToggledSubscriptions: WallToggledSubscriber;
  lockWallSubscriptions: LockWallSubscriber;
  diceRollSubscriptions: DiceRollSubscriber;
  winGameSubscriptions: WinGameSubscriber;
  startGameSubscriptions: StartGameSubscriber;
  numWallChangesSubscriptions: NumWallChangesSubscriber;
}
interface StartGameResult {}
interface EdgeResult {}
interface LockWallResult {}
interface EndTurnResult {}
interface ResetResult {}
interface PlayerMovedResult {}
interface DiceRollResult {
  diceValue: number;
}

export interface Game {
  // new(width, height)
  // join(gid)
  // watch(gid)

  startGame: () => Promise<StartGameResult>;

  addEdge: (coord: Coord) => Promise<EdgeResult>;
  removeEdge: (coord: Coord) => Promise<EdgeResult>;
  lockWalls: () => Promise<LockWallResult>;
  switchTurn: () => Promise<EndTurnResult>;
  reset: () => Promise<ResetResult>;
  setPlayerLocation: (coord: Coord) => Promise<PlayerMovedResult>;
  rollDice: () => Promise<DiceRollResult>;

  getTurn: () => Promise<PlayerColor>;
  playerLocation: (player: PlayerColor) => Promise<Coord>;
  endLocation: (player: PlayerColor) => Promise<Coord>;
  getInitialCellLocation: (cellElement: CellElement) => Promise<Coord>;
  getWallLocations: () => Promise<WallLocations>;
  getDiceRolls: (player: PlayerColor) => Promise<number[]>;
  getWidth: () => Promise<number>;
  getHeight: () => Promise<number>;
  pathExists: (player: PlayerColor) => Promise<boolean>;
  getOldBoard: () => Promise<Board | null>;

  playerMovedEventSubscription: () => PlayerEventSubscription;
  switchTurnEventSubscription: () => SwitchTurnEventSubscription;
  wallToggledEventSubscription: () => WallToggledEventSubscription;
  lockWallEventSubscription: () => LockWallEventSubscription;
  diceRollEventSubscription: () => DiceRollEventSubscription;
  winGameEventSubscription: () => WinGameEventSubscription;
  startGameEventSubscription: () => StartGameEventSubscription;
  numWallChangesEventSubscription: () => NumWallChangesEventSubscription;
}

var id = 1;

type OverridesForTesting = {
  walls?: WallLocations;
  playerLocations?: CellLocations;
  rollDurationMs?: number;
};

export class GameImpl implements Game {
  private state: GameState = {
    gameOver: false,
    turn: "red",
    phase: "placingWalls",
    diceValue: 1,
    diceRolled: false,
    width: 7,
    height: 7,
    id: id++,
    playerLocations: { red: { row: 7, col: 1 }, blue: { row: 1, col: 7 } },
    endLocations: { red: { row: 7, col: 13 }, blue: { row: 13, col: 7 } },
    wallLocations: {
      red: [],
      blue: [],
      locked: [
        { row: 1, col: 10 },
        { row: 2, col: 1 },
        { row: 2, col: 7 },
        { row: 2, col: 11 },
        { row: 3, col: 12 },
        { row: 4, col: 5 },
        { row: 4, col: 9 },
        { row: 4, col: 13 },
        { row: 6, col: 7 },
        { row: 7, col: 12 },
        { row: 9, col: 10 },
        { row: 12, col: 13 },
      ],
    },
    oldBoard: null,
    movements: 0,
    diceRolls: {
      red: [1, 2, 3, 4, 5, 6],
      blue: [1, 2, 3, 4, 5, 6],
    },
    rollDurationMs: 1,
    playerMovedSubscriptions: new PlayerMovedSubscriber(),
    switchTurnSubscriptions: new SwitchTurnSubscriber(),
    wallToggledSubscriptions: new WallToggledSubscriber(),
    lockWallSubscriptions: new LockWallSubscriber(),
    diceRollSubscriptions: new DiceRollSubscriber(),
    winGameSubscriptions: new WinGameSubscriber(),
    startGameSubscriptions: new StartGameSubscriber(),
    numWallChangesSubscriptions: new NumWallChangesSubscriber(),
  };

  constructor(width: number, height: number) {
    this.state.width = width;
    this.state.height = height;
    console.log("Created game object", this.state.id);
    // this.generateRandomWallLocations(this.state.width, this.state.height);
    this.mirrorLockedWallLocations();
  }

  static createForTesting(
    width: number,
    height: number,
    overrides?: OverridesForTesting
  ) {
    const result = new GameImpl(width, height);
    if (overrides) {
      if (overrides.playerLocations)
        result.state.playerLocations = overrides.playerLocations;
      if (overrides.walls) result.state.wallLocations = overrides.walls;
      if (overrides.rollDurationMs)
        result.state.rollDurationMs = overrides.rollDurationMs;
    }
    return result;
  }

  getStateForTesting(): GameState {
    return {
      ...this.state,
      playerMovedSubscriptions: new PlayerMovedSubscriber(),
      switchTurnSubscriptions: new SwitchTurnSubscriber(),
      wallToggledSubscriptions: new WallToggledSubscriber(),
    };
  }

  startGame = async (): Promise<StartGameResult> => {
    this.state.gameOver = false;
    this.state.startGameSubscriptions.notify({
      startingPlayer: this.state.turn,
    });
    this.state.oldBoard = await this.createBoard();
    console.time(`_________________FULL GAME ${this.state.id}`);
    return Promise.resolve({});
  };

  addEdge = (coord: Coord): Promise<EdgeResult> => {
    if (this.state.gameOver) return Promise.reject("Game over");
    if (!this.state.diceRolled) return Promise.reject("Dice not rolled");
    return this.handleEdgeAction(coord, true);
  };

  removeEdge = (coord: Coord): Promise<EdgeResult> => {
    if (this.state.gameOver) return Promise.reject("Game over");
    if (!this.state.diceRolled) return Promise.reject("Dice not rolled");
    return this.handleEdgeAction(coord, false);
  };

  lockWalls = (): Promise<LockWallResult> => {
    if (this.state.gameOver) return Promise.reject("Game over");
    if (!this.state.diceRolled) return Promise.reject("Dice not rolled");

    return Promise.all([this.pathExists("red"), this.pathExists("blue")]).then(
      ([redPathExists, bluePathExists]) => {
        if (!redPathExists || !bluePathExists) {
          return Promise.reject("No path found for at least one player");
        }

        this.state.phase = "movingPlayer";
        this.state.lockWallSubscriptions.notify({});

        return {};
      }
    );
  };

  switchTurn = (): Promise<EndTurnResult> => {
    if (this.state.gameOver) return Promise.reject("Game over");

    return Promise.all([this.pathExists("red"), this.pathExists("blue")]).then(
      ([redPathExists, bluePathExists]) => {
        if (!redPathExists || !bluePathExists) {
          return Promise.reject("No path found for at least one player");
        }

        this.state.turn = this.state.turn === "red" ? "blue" : "red";
        this.state.phase = "placingWalls";
        this.state.switchTurnSubscriptions.notify({ turn: this.state.turn });
        this.state.diceRolled = false;
        this.state.movements = 0;
        this.state.numWallChangesSubscriptions.notify({ wallChanges: 0 });

        this.createBoard().then((board) => (this.state.oldBoard = board));

        return {};
      }
    );
  };

  reset = (): Promise<ResetResult> => {
    // needs to be modified!!!
    this.state.turn = "red";
    this.state.phase = "placingWalls";
    return Promise.resolve({});
  };

  setPlayerLocation = async (coord: Coord): Promise<PlayerMovedResult> => {
    if (this.state.gameOver) return Promise.reject("Game over");
    if (!this.state.diceRolled) return Promise.reject("Dice not rolled");

    if (this.state.phase !== "movingPlayer") {
      return Promise.reject("NOT MOVE PHASE");
    }

    const player = this.state.turn;
    const oldLocation = this.state.playerLocations[player];

    if (
      !isValidMove(
        oldLocation,
        coord,
        this.state.wallLocations,
        2 * (await this.getWidth()) + 1,
        2 * (await this.getHeight()) + 1
      )
    ) {
      return Promise.reject("NOT ADJACENT CELL");
    }

    this.state.playerLocations[player] = coord;
    this.state.movements++;

    this.state.playerMovedSubscriptions.notify({
      player: player,
      from: oldLocation,
      to: coord,
      numMovements: this.state.movements,
    });

    const end = this.state.endLocations[player];
    if (equalCoords(coord, end)) {
      this.winGame();
    }

    return Promise.resolve({});
  };

  rollDice = (): Promise<DiceRollResult> => {
    if (this.state.gameOver) return Promise.reject("Game over");

    if (this.state.diceRolled) {
      console.warn("Dice already rolled");
      return Promise.resolve({
        diceValue: this.state.diceValue,
      });
    }

    this.state.diceRollSubscriptions.notify({ type: "start" });
    this.state.diceRolled = true;

    return new Promise((resolve) => {
      setTimeout(() => {
        // console.time("rollDice");
        try {
          const currentDiceRolls = this.state.diceRolls[this.state.turn];
          const newValue = randomDiceValue(currentDiceRolls);
          const result = { diceValue: newValue };
          this.state.diceRollSubscriptions.notify({
            type: "stop",
            value: newValue,
          });
          resolve(result);
        } finally {
          // console.timeEnd("rollDice");
        }
      }, this.state.rollDurationMs);
    });
  };

  handleEdgeAction = async (
    coord: Coord,
    placing: boolean
  ): Promise<EdgeResult> => {
    if (this.state.gameOver) return Promise.reject("Game over");
    if (!this.state.diceRolled) return Promise.reject("Dice not rolled");

    if (this.state.phase !== "placingWalls") {
      return Promise.reject("NOT WALL PHASE");
    }

    if (!isEdge(coord)) {
      return Promise.reject("INVALID COORD");
    }

    const numWalls = this.state.wallLocations[this.state.turn].length;
    if (placing && numWalls >= 6) {
      return Promise.reject("Too many walls");
    }

    const isVertical = isVerticalEdge(coord);
    const isCorrectTurn = isVertical
      ? this.state.turn === "red"
      : this.state.turn === "blue";

    if (!isCorrectTurn) {
      return Promise.reject("WRONG TURN");
    }

    if (placing) {
      this.state.wallLocations[this.state.turn].push(coord);
    } else {
      this.state.wallLocations[this.state.turn] = this.state.wallLocations[
        this.state.turn
      ].filter((wall) => !equalCoords(wall, coord));
    }

    const numWallChanges = await this.getNumWallChanges();
    this.notifyWallToggled(coord, placing, numWallChanges);
    return Promise.resolve({});
  };

  getTurn = (): Promise<PlayerColor> => Promise.resolve(this.state.turn);

  playerLocation = (player: PlayerColor): Promise<Coord> =>
    Promise.resolve(this.state.playerLocations[player]);

  endLocation = (player: PlayerColor): Promise<Coord> =>
    Promise.resolve(this.state.endLocations[player]);

  getInitialCellLocation = (cellElement: CellElement): Promise<Coord> => {
    switch (cellElement) {
      case "redplayer":
        return Promise.resolve(
          JSON.parse(JSON.stringify(this.state.playerLocations.red))
        );
      case "blueplayer":
        return Promise.resolve(
          JSON.parse(JSON.stringify(this.state.playerLocations.blue))
        );
      case "redend":
        return Promise.resolve(
          JSON.parse(JSON.stringify(this.state.endLocations.red))
        );
      case "blueend":
        return Promise.resolve(
          JSON.parse(JSON.stringify(this.state.endLocations.blue))
        );
    }
  };

  getWallLocations = (): Promise<WallLocations> => {
    return Promise.resolve(
      JSON.parse(JSON.stringify(this.state.wallLocations))
    );
  };

  getDiceRolls = (player: PlayerColor): Promise<number[]> =>
    Promise.resolve(this.state.diceRolls[player]);

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

  lockWallEventSubscription = (): LockWallEventSubscription =>
    this.state.lockWallSubscriptions;

  diceRollEventSubscription = (): DiceRollEventSubscription =>
    this.state.diceRollSubscriptions;

  winGameEventSubscription = (): WinGameEventSubscription =>
    this.state.winGameSubscriptions;

  startGameEventSubscription = (): StartGameEventSubscription =>
    this.state.startGameSubscriptions;

  numWallChangesEventSubscription = (): NumWallChangesEventSubscription =>
    this.state.numWallChangesSubscriptions;

  notifyWallToggled = (
    coord: Coord,
    isToggled: boolean,
    numWallChanges: number
  ): void => {
    console.log("Sending wall change");
    this.state.wallToggledSubscriptions.notify({
      wall: coord,
      isToggled: isToggled,
    });
    this.state.numWallChangesSubscriptions.notify({
      wallChanges: numWallChanges,
    });
  };

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

  mirrorLockedWallLocations = (): void => {
    const wallLocationCopy: Coord[] = [...this.state.wallLocations.locked];
    for (const coord of this.state.wallLocations.locked) {
      wallLocationCopy.push({ row: coord.col, col: coord.row });
    }
    this.state.wallLocations.locked = wallLocationCopy;
  };

  winGame = (): void => {
    this.state.gameOver = true;
    this.state.winGameSubscriptions.notify({ winner: this.state.turn });
    console.log(
      (this.state.turn === "red" ? "Red" : "Blue") + " player won!",
      this.state.id
    );
    console.timeEnd(`_________________FULL GAME ${this.state.id}`);
  };

  pathExists = (player: PlayerColor): Promise<boolean> => {
    return this.createBoard().then((board) => {
      const path = PathfinderImpl.shortestPath(
        this.state.playerLocations[player],
        this.state.endLocations[player],
        board
      );

      return !!path;
    });
  };

  getOldBoard = (): Promise<Board | null> => {
    return Promise.resolve(this.state.oldBoard);
  };

  getNumWallChanges = async (): Promise<number> => {
    const oldBoard: Board | null = this.state.oldBoard;
    if (oldBoard == null) {
      throw new Error("could not get old board");
    }
    const newBoard = await this.createBoard();

    return newBoard.compareEdges(oldBoard);
  };

  createBoard = async (): Promise<Board> => {
    const board: Board = new Board(this.state.width, this.state.height);
    await board.initFromGame(this);
    return board;
  };
}

const instance = new GameImpl(7, 7);

export default instance;
