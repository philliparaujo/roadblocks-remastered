import {
  BlueEnd,
  BluePlayer,
  Board,
  BoardImpl,
  CanEndTurnResult,
  CellLocations,
  Coord,
  CoordResult,
  DiceInfo,
  DiceResult,
  DiceRollEvent,
  DiceRollResult,
  EdgeResult,
  EndTurnResult,
  HeightResult,
  LockWallEvent,
  LockWallResult,
  NumWallChangesEvent,
  PathExistsResult,
  PlayerColor,
  PlayerLocation,
  PlayerMovedEvent,
  PlayerMovedResult,
  RedEnd,
  RedPlayer,
  ResetTurnResult,
  StartGameEvent,
  SwitchTurnEvent,
  TurnPhase,
  TurnResult,
  WallLocations,
  WallLocationsResult,
  WallToggledEvent,
  WidthResult,
  WinGameEvent,
  equalCoords,
  isBorderEdge,
  isEdge,
  isValidMove,
  isVerticalEdge,
  randomDiceValue,
  ErrorEvent,
} from "@roadblocks/types";
import { PathfinderImpl } from "./Pathfinder";
import {
  DiceRollSubscriberServer,
  ErrorSubscriberServer,
  LockWallSubscriberServer,
  NumWallChangesSubscriberServer,
  PlayerMovedSubscriberServer,
  StartGameSubscriberServer,
  SwitchTurnSubscriberServer,
  WallToggledSubscriberServer,
  WinGameSubscriberServer,
} from "./PubSubServer";

export interface GameState {
  gameOver: boolean;
  turn: PlayerColor;
  phase: TurnPhase;
  diceValue: number;
  diceRolled: boolean;
  width: number;
  height: number;
  id: number;
  endLocations: CellLocations;

  oldPlayerLocations: CellLocations;
  playerLocations: CellLocations;

  oldWallLocations: WallLocations;
  wallLocations: WallLocations;

  oldBoard: Board;
  currentBoard: Board;

  movements: number;
  diceRolls: DiceInfo;
  rollDurationMs: number;
}

export interface GameServer {
  addEdge: (coord: Coord) => Promise<EdgeResult>;
  removeEdge: (coord: Coord) => Promise<EdgeResult>;
  getWidth: () => Promise<WidthResult>;
  getHeight: () => Promise<HeightResult>;
  getCellLocation: (player: PlayerLocation) => Promise<CoordResult>;
  getWallLocations: () => Promise<WallLocationsResult>;
  getDice: (player: PlayerColor) => Promise<DiceResult>;
  getTurn: () => Promise<TurnResult>;
  canEndTurn: () => Promise<CanEndTurnResult>;
  pathExists: (player: PlayerColor) => Promise<PathExistsResult>;
  lockWalls: () => Promise<LockWallResult>;
  switchTurn: () => Promise<EndTurnResult>;
  setPlayerLocation: (coord: Coord) => Promise<PlayerMovedResult>;
  rollDice: () => Promise<DiceRollResult>;
  resetTurn: () => Promise<ResetTurnResult>;

  playerMovedSubscriptions: PlayerMovedSubscriberServer;
  switchTurnSubscriptions: SwitchTurnSubscriberServer;
  wallToggledSubscriptions: WallToggledSubscriberServer;
  lockWallSubscriptions: LockWallSubscriberServer;
  diceRollSubscriptions: DiceRollSubscriberServer;
  winGameSubscriptions: WinGameSubscriberServer;
  startGameSubscriptions: StartGameSubscriberServer;
  numWallChangesSubscriptions: NumWallChangesSubscriberServer;
  errorSubscriptions: ErrorSubscriberServer;
}

// export interface GameSubscriptions {}

var id = 1;

type OverridesForTesting = {
  walls?: WallLocations;
  playerLocations?: CellLocations;
  rollDurationMs?: number;
};

const initialPlayerLocations = () => ({
  red: { row: 7, col: 1 },
  blue: { row: 1, col: 7 },
});
const initialEndLocations = () => ({
  red: { row: 7, col: 13 },
  blue: { row: 13, col: 7 },
});
const initialWallLocations = () => ({
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

    { col: 1, row: 10 },
    { col: 2, row: 1 },
    { col: 2, row: 7 },
    { col: 2, row: 11 },
    { col: 3, row: 12 },
    { col: 4, row: 5 },
    { col: 4, row: 9 },
    { col: 4, row: 13 },
    { col: 6, row: 7 },
    { col: 7, row: 12 },
    { col: 9, row: 10 },
    { col: 12, row: 13 },
  ],
});
const standardDice = () => [1, 2, 3, 4, 5, 6];
// const standardDice = () => [1, 1, 1, 1, 1, 1];

export class GameServerImpl implements GameServer {
  playerMovedSubscriptions: PlayerMovedSubscriberServer;
  switchTurnSubscriptions: SwitchTurnSubscriberServer;
  wallToggledSubscriptions: WallToggledSubscriberServer;
  lockWallSubscriptions: LockWallSubscriberServer;
  diceRollSubscriptions: DiceRollSubscriberServer;
  winGameSubscriptions: WinGameSubscriberServer;
  startGameSubscriptions: StartGameSubscriberServer;
  numWallChangesSubscriptions: NumWallChangesSubscriberServer;
  errorSubscriptions: ErrorSubscriberServer;

  fakeToggle: boolean = false;

  private state: GameState;

  constructor(width: number, height: number) {
    const board = initFromGame(width, height);

    this.state = {
      gameOver: false,
      turn: "red",
      phase: "placingWalls",
      diceValue: 1,
      diceRolled: false,
      width: width,
      height: height,
      id: id++,
      playerLocations: initialPlayerLocations(),
      oldPlayerLocations: initialPlayerLocations(),
      endLocations: initialEndLocations(),
      wallLocations: initialWallLocations(),
      oldWallLocations: initialWallLocations(),
      oldBoard: board.copy(),
      currentBoard: board,
      movements: 0,
      diceRolls: {
        red: standardDice(),
        blue: standardDice(),
      },
      rollDurationMs: 1,
    };
    // console.log("Created game object", this.state.id);
    // this.generateRandomWallLocations(this.state.width, this.state.height);

    this.playerMovedSubscriptions = new PlayerMovedSubscriberServer();
    this.switchTurnSubscriptions = new SwitchTurnSubscriberServer();
    this.wallToggledSubscriptions = new WallToggledSubscriberServer();
    this.lockWallSubscriptions = new LockWallSubscriberServer();
    this.diceRollSubscriptions = new DiceRollSubscriberServer();
    this.winGameSubscriptions = new WinGameSubscriberServer();
    this.startGameSubscriptions = new StartGameSubscriberServer();
    this.numWallChangesSubscriptions = new NumWallChangesSubscriberServer();
    this.errorSubscriptions = new ErrorSubscriberServer();

    this.startGameSubscriptions.notify(new StartGameEvent(this.state.turn));
  }

  static createForTesting(
    width: number,
    height: number,
    overrides?: OverridesForTesting
  ) {
    const result = new GameServerImpl(width, height);
    if (overrides) {
      if (overrides.playerLocations)
        result.state.playerLocations = overrides.playerLocations;
      if (overrides.walls) result.state.wallLocations = overrides.walls;
      if (overrides.rollDurationMs)
        result.state.rollDurationMs = overrides.rollDurationMs;
    }
    return result;
  }

  addEdge = (coord: Coord): Promise<EdgeResult> => {
    if (this.state.gameOver) {
      this.errorSubscriptions.notify(new ErrorEvent("Game already over!"));
      return Promise.reject("Game over");
    }
    if (!this.state.diceRolled) return Promise.reject("Dice not rolled");
    return this.handleEdgeAction(coord, true);
  };

  removeEdge = (coord: Coord): Promise<EdgeResult> => {
    if (this.state.gameOver) {
      this.errorSubscriptions.notify(new ErrorEvent("Game already over!"));
      return Promise.reject("Game over");
    }
    if (!this.state.diceRolled) return Promise.reject("Dice not rolled");
    return this.handleEdgeAction(coord, false);
  };

  lockWalls = (): Promise<LockWallResult> => {
    if (this.state.gameOver) {
      this.errorSubscriptions.notify(new ErrorEvent("Game already over!"));
      return Promise.reject("Game over");
    }
    if (!this.state.diceRolled) return Promise.reject("Dice not rolled");
    this.canEndTurn().then((canI) => {
      if (!canI) return Promise.reject("Too many wall movements (probably)");
    });

    return Promise.all([this.pathExists("red"), this.pathExists("blue")]).then(
      ([redPathExists, bluePathExists]) => {
        if (!redPathExists || !bluePathExists) {
          return Promise.reject("No path found for at least one player");
        }

        this.state.phase = "movingPlayer";
        this.lockWallSubscriptions.notify(new LockWallEvent(true));

        return { locked: true };
      }
    );
  };

  switchTurn = (): Promise<EndTurnResult> => {
    if (this.state.gameOver) {
      this.errorSubscriptions.notify(new ErrorEvent("Game already over!"));
      return Promise.reject("Game over");
    }
    this.canEndTurn().then((canI) => {
      if (!canI) return Promise.reject("Too many wall or player movements");
    });

    return Promise.all([this.pathExists("red"), this.pathExists("blue")]).then(
      ([redPathExists, bluePathExists]) => {
        if (!redPathExists || !bluePathExists) {
          return Promise.reject("No path found for at least one player");
        }

        this.state.turn = this.state.turn === "red" ? "blue" : "red";
        this.state.phase = "placingWalls";
        this.switchTurnSubscriptions.notify(
          new SwitchTurnEvent(this.state.turn)
        );
        this.state.diceRolled = false;
        this.state.movements = 0;
        this.numWallChangesSubscriptions.notify(new NumWallChangesEvent(0));

        this.state.oldBoard = this.state.currentBoard.copy();

        this.state.oldPlayerLocations.red = this.state.playerLocations.red;
        this.state.oldPlayerLocations.blue = this.state.playerLocations.blue;

        this.state.oldWallLocations.red = [...this.state.wallLocations.red];
        this.state.oldWallLocations.blue = [...this.state.wallLocations.blue];
        this.state.oldWallLocations.locked = [
          ...this.state.wallLocations.locked,
        ];

        return {};
      }
    );
  };

  setPlayerLocation = (coord: Coord): Promise<PlayerMovedResult> => {
    if (this.state.gameOver) {
      this.errorSubscriptions.notify(new ErrorEvent("Game already over!"));
      return Promise.reject("Game over");
    }
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
        2 * this.state.width + 1,
        2 * this.state.height + 1
      )
    ) {
      this.errorSubscriptions.notify(
        new ErrorEvent("Not an adjacent movement!")
      );
      return Promise.reject("NOT ADJACENT CELL");
    }

    this.state.playerLocations[player] = coord;
    this.state.movements++;

    const playerType = this.state.turn === "red" ? "r" : "b";
    this.state.currentBoard?.removeFromCell(oldLocation, playerType);
    this.state.currentBoard?.addToCell(coord, playerType);

    this.playerMovedSubscriptions.notify(
      new PlayerMovedEvent(player, oldLocation, coord, this.state.movements)
    );

    const end = this.state.endLocations[player];
    if (equalCoords(coord, end)) {
      this.winGame();
    }

    return Promise.resolve({});
  };

  rollDice = (): Promise<DiceRollResult> => {
    if (this.state.gameOver) {
      this.errorSubscriptions.notify(new ErrorEvent("Game already over!"));
      return Promise.reject("Game over");
    }

    if (this.state.diceRolled) {
      this.errorSubscriptions.notify(new ErrorEvent("Dice already rolled!"));
      return Promise.reject("Dice already rolled");
    }

    const currentDiceRolls = this.state.diceRolls[this.state.turn];
    const newValue = randomDiceValue(currentDiceRolls);
    this.diceRollSubscriptions.notify(new DiceRollEvent(newValue));
    this.state.diceRolled = true;
    this.state.diceValue = newValue;

    return Promise.resolve({ diceValue: newValue });
  };

  private handleEdgeAction = async (
    coord: Coord,
    placing: boolean
  ): Promise<EdgeResult> => {
    if (this.state.gameOver) return Promise.reject("Game over");
    if (!this.state.diceRolled) return Promise.reject("Dice not rolled");

    if (this.state.phase !== "placingWalls")
      return Promise.reject("NOT WALL PHASE");
    if (!isEdge(coord)) return Promise.reject("INVALID COORD");

    const numWalls = this.state.wallLocations[this.state.turn].length;
    if (placing && numWalls >= 6) {
      this.errorSubscriptions.notify(new ErrorEvent("Too many walls!"));
      return Promise.reject("Too many walls");
    }

    const isVertical = isVerticalEdge(coord);
    const isCorrectTurn = isVertical
      ? this.state.turn === "red"
      : this.state.turn === "blue";

    if (!isCorrectTurn) {
      this.errorSubscriptions.notify(new ErrorEvent("Wrong edge color!"));
      return Promise.reject("WRONG TURN");
    }

    if (placing) {
      this.state.wallLocations[this.state.turn].push(coord);

      const wallType = this.state.turn === "red" ? "|" : "-";
      this.state.currentBoard?.set(coord, wallType);
    } else {
      this.state.wallLocations[this.state.turn] = this.state.wallLocations[
        this.state.turn
      ].filter((wall) => !equalCoords(wall, coord));

      this.state.currentBoard?.set(coord, " ");
    }

    const numWallChanges = await this.getNumWallChanges();
    this.notifyWallToggled(coord, placing, numWallChanges);
    return Promise.resolve({});
  };

  resetTurn = (): Promise<ResetTurnResult> => {
    // unlock walls
    if (this.state.phase !== "placingWalls") {
      this.state.phase = "placingWalls";
      this.lockWallSubscriptions.notify(new LockWallEvent(false));
    }

    // reset current board state
    this.state.currentBoard = this.state.oldBoard.copy();

    // reset player position
    const newLocation = this.state.playerLocations[this.state.turn];
    const oldLocation = this.state.oldPlayerLocations[this.state.turn];

    if (!equalCoords(newLocation, oldLocation)) {
      this.state.playerLocations[this.state.turn] = oldLocation;

      const playerType = this.state.turn === "red" ? "r" : "b";
      this.state.currentBoard?.removeFromCell(newLocation, playerType);
      this.state.currentBoard?.addToCell(oldLocation, playerType);

      this.playerMovedSubscriptions.notify(
        new PlayerMovedEvent(this.state.turn, newLocation, oldLocation, 0)
      );
    }

    // reset wall positions
    const newWalls = this.state.wallLocations[this.state.turn];
    const oldWalls = this.state.oldWallLocations[this.state.turn];

    console.log(this.state.wallLocations);
    console.log(this.state.oldWallLocations);

    // 1) for every wall in newWalls NOT in oldWalls, notify a deletion
    for (let coord of newWalls) {
      if (!oldWalls.some((oldCoord) => equalCoords(oldCoord, coord))) {
        this.wallToggledSubscriptions.notify(
          new WallToggledEvent(coord, false)
        );
      }
    }
    // 2) for every wall in oldWalls NOT in newWalls, notify an addition
    for (let coord of oldWalls) {
      if (!newWalls.some((newCoord) => equalCoords(newCoord, coord))) {
        this.wallToggledSubscriptions.notify(new WallToggledEvent(coord, true));
      }
    }

    this.state.wallLocations[this.state.turn] = [...oldWalls];

    // reset number of actions made in turn
    this.numWallChangesSubscriptions.notify(new NumWallChangesEvent(0));
    this.state.movements = 0;

    console.log(this.state.wallLocations);
    console.log(this.state.oldWallLocations);

    return Promise.resolve({});
  };

  getTurn = (): Promise<TurnResult> =>
    Promise.resolve({ turn: this.state.turn });

  private playerLocation = (player: PlayerColor): Promise<Coord> =>
    Promise.resolve(this.state.playerLocations[player]);

  private endLocation = (player: PlayerColor): Promise<Coord> =>
    Promise.resolve(this.state.endLocations[player]);

  getCellLocation = (cellElement: PlayerLocation): Promise<CoordResult> => {
    switch (cellElement) {
      case "redplayer":
        return Promise.resolve({ coord: this.state.playerLocations.red });
      case "blueplayer":
        return Promise.resolve({ coord: this.state.playerLocations.blue });
      case "redend":
        return Promise.resolve({ coord: this.state.endLocations.red });
      case "blueend":
        return Promise.resolve({ coord: this.state.endLocations.blue });
    }
  };

  getWallLocations = (): Promise<WallLocationsResult> => {
    return Promise.resolve({ locations: this.state.wallLocations });
  };

  getDice = (player: PlayerColor): Promise<DiceResult> =>
    Promise.resolve({ faces: this.state.diceRolls[player] });

  getWidth = (): Promise<WidthResult> => {
    return Promise.resolve({ width: this.state.width });
  };

  getHeight = (): Promise<HeightResult> => {
    return Promise.resolve({ height: this.state.height });
  };

  private notifyWallToggled = (
    coord: Coord,
    isToggled: boolean,
    numWallChanges: number
  ): void => {
    this.wallToggledSubscriptions.notify(
      new WallToggledEvent(coord, isToggled)
    );
    this.numWallChangesSubscriptions.notify(
      new NumWallChangesEvent(numWallChanges)
    );
  };

  private generateRandomWallLocations = (
    width: number,
    height: number
  ): void => {
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

  private winGame = (): void => {
    this.state.gameOver = true;
    this.winGameSubscriptions.notify(new WinGameEvent(this.state.turn));
    console.log(
      (this.state.turn === "red" ? "Red" : "Blue") + " player won!",
      this.state.id
    );
    console.timeEnd(`_________________FULL GAME ${this.state.id}`);
  };

  pathExists = (player: PlayerColor): Promise<PathExistsResult> => {
    const board = this.state.currentBoard;
    if (board == null) throw new Error("board is null");

    const path = PathfinderImpl.shortestPath(
      this.state.playerLocations[player],
      this.state.endLocations[player],
      board
    );

    return Promise.resolve({ pathExists: !!path });
  };

  private getOldBoard = (): Promise<Board | null> => {
    return Promise.resolve(this.state.oldBoard);
  };

  private getNumWallChanges = (): Promise<number> => {
    const oldBoard: Board | null = this.state.oldBoard;
    const newBoard: Board | null = this.state.currentBoard;

    if (oldBoard == null) throw new Error("could not get old board");
    if (newBoard == null) throw new Error("could not get new board");

    return Promise.resolve(newBoard.compareEdges(oldBoard));
  };

  canEndTurn = (): Promise<CanEndTurnResult> => {
    const dice = this.state.diceValue;
    const playerMovements = this.state.movements;
    return this.getNumWallChanges().then((wallChanges) => {
      return { canEndTurn: playerMovements <= dice && wallChanges <= 7 - dice };
    });
  };
}

function initFromGame(width: number, height: number): Board {
  const board: Board = new BoardImpl(width, height);

  const redPlayerCoord: Coord = initialPlayerLocations().red;
  const redplayer: RedPlayer = "r";
  board.addToCell(redPlayerCoord, redplayer);

  const bluePlayerCoord: Coord = initialPlayerLocations().blue;
  const blueplayer: BluePlayer = "b";
  board.addToCell(bluePlayerCoord, blueplayer);

  const redEndCoord: Coord = initialEndLocations().red;
  const redend: RedEnd = "R";
  board.addToCell(redEndCoord, redend);

  const blueEndCoord: Coord = initialEndLocations().blue;
  const blueend: BlueEnd = "B";
  board.addToCell(blueEndCoord, blueend);

  const wallLocations: WallLocations = initialWallLocations();
  for (const wall of wallLocations.locked) {
    board.set(wall, "#");
  }
  for (const redWall of wallLocations.red) {
    board.set(redWall, "|");
  }
  for (const blueWall of wallLocations.blue) {
    board.set(blueWall, "-");
  }

  board.dump(console.log);
  return board;
}
