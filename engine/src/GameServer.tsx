import {
  BlueEnd,
  BluePlayer,
  Board,
  BoardImpl,
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
  PlayerColor,
  PlayerLocation,
  PlayerMovedEvent,
  PlayerMovedResult,
  RedEnd,
  RedPlayer,
  ResetResult,
  StartGameEvent,
  StartGameResult,
  SwitchTurnEvent,
  TurnPhase,
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
} from "@roadblocks/types";
import { PathfinderImpl } from "./Pathfinder";
import {
  DiceRollSubscriberServer,
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
  playerLocations: CellLocations;
  endLocations: CellLocations;
  wallLocations: WallLocations;
  oldBoard: Board | null;
  currentBoard: Board | null;
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

  playerMovedSubscriptions: PlayerMovedSubscriberServer;
  switchTurnSubscriptions: SwitchTurnSubscriberServer;
  wallToggledSubscriptions: WallToggledSubscriberServer;
  lockWallSubscriptions: LockWallSubscriberServer;
  diceRollSubscriptions: DiceRollSubscriberServer;
  winGameSubscriptions: WinGameSubscriberServer;
  startGameSubscriptions: StartGameSubscriberServer;
  numWallChangesSubscriptions: NumWallChangesSubscriberServer;

  wallToggledSubscriptions2: () => WallToggledSubscriberServer;
}

// export interface GameSubscriptions {}

var id = 1;

type OverridesForTesting = {
  walls?: WallLocations;
  playerLocations?: CellLocations;
  rollDurationMs?: number;
};

export class GameServerImpl implements GameServer {
  playerMovedSubscriptions: PlayerMovedSubscriberServer;
  switchTurnSubscriptions: SwitchTurnSubscriberServer;
  wallToggledSubscriptions: WallToggledSubscriberServer;
  lockWallSubscriptions: LockWallSubscriberServer;
  diceRollSubscriptions: DiceRollSubscriberServer;
  winGameSubscriptions: WinGameSubscriberServer;
  startGameSubscriptions: StartGameSubscriberServer;
  numWallChangesSubscriptions: NumWallChangesSubscriberServer;

  fakeToggle: boolean = false;

  private state: GameState = {
    gameOver: true,
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
    currentBoard: null,
    movements: 0,
    diceRolls: {
      red: [1, 2, 3, 4, 5, 6],
      blue: [1, 2, 3, 4, 5, 6],
    },
    rollDurationMs: 1,
  };

  constructor(width: number, height: number) {
    this.state.width = width;
    this.state.height = height;
    // console.log("Created game object", this.state.id);
    // this.generateRandomWallLocations(this.state.width, this.state.height);
    this.mirrorLockedWallLocations();

    this.playerMovedSubscriptions = new PlayerMovedSubscriberServer();
    this.switchTurnSubscriptions = new SwitchTurnSubscriberServer();
    this.wallToggledSubscriptions = new WallToggledSubscriberServer();
    this.lockWallSubscriptions = new LockWallSubscriberServer();
    this.diceRollSubscriptions = new DiceRollSubscriberServer();
    this.winGameSubscriptions = new WinGameSubscriberServer();
    this.startGameSubscriptions = new StartGameSubscriberServer();
    this.numWallChangesSubscriptions = new NumWallChangesSubscriberServer();

    setInterval(() => {
      // test game here
      this.wallToggledSubscriptions.notify(
        new WallToggledEvent({ row: 1, col: 4 }, this.fakeToggle)
      );
      this.wallToggledSubscriptions.notify(
        new WallToggledEvent({ row: 2, col: 5 }, !this.fakeToggle)
      );
      this.fakeToggle = !this.fakeToggle;
    }, 2000);

    setInterval(() => {
      this.wallToggledSubscriptions.reset();
    }, 2000 * 3);
  }

  wallToggledSubscriptions2 = () => this.wallToggledSubscriptions;

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
    if (this.state.gameOver) return Promise.reject("Game over");
    if (!this.state.diceRolled) return Promise.reject("Dice not rolled");
    return this.handleEdgeAction(coord, true);
  };

  removeEdge = (coord: Coord): Promise<EdgeResult> => {
    if (this.state.gameOver) return Promise.reject("Game over");
    if (!this.state.diceRolled) return Promise.reject("Dice not rolled");
    return this.handleEdgeAction(coord, false);
  };

  private lockWalls = (): Promise<LockWallResult> => {
    if (this.state.gameOver) return Promise.reject("Game over");
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
        this.lockWallSubscriptions.notify(new LockWallEvent());

        return {};
      }
    );
  };

  private switchTurn = (): Promise<EndTurnResult> => {
    if (this.state.gameOver) return Promise.reject("Game over");
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

        if (this.state.currentBoard) {
          this.state.oldBoard = this.state.currentBoard;
          this.initFromGame().then((board) => {
            this.state.currentBoard = board;
          });
        }

        return {};
      }
    );
  };

  private reset = (): Promise<ResetResult> => {
    // needs to be modified!!!
    this.state.turn = "red";
    this.state.phase = "placingWalls";
    return Promise.resolve({});
  };

  private setPlayerLocation = (coord: Coord): Promise<PlayerMovedResult> => {
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
        2 * this.state.width + 1,
        2 * this.state.height + 1
      )
    ) {
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

  private rollDice = (): Promise<DiceRollResult> => {
    if (this.state.gameOver) return Promise.reject("Game over");

    if (this.state.diceRolled) {
      console.warn("Dice already rolled");
      return Promise.resolve({
        diceValue: this.state.diceValue,
      });
    }

    const currentDiceRolls = this.state.diceRolls[this.state.turn];
    const newValue = randomDiceValue(currentDiceRolls);
    this.diceRollSubscriptions.notify(new DiceRollEvent(newValue));
    this.state.diceRolled = true;

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
    if (placing && numWalls >= 6) return Promise.reject("Too many walls");

    const isVertical = isVerticalEdge(coord);
    const isCorrectTurn = isVertical
      ? this.state.turn === "red"
      : this.state.turn === "blue";

    if (!isCorrectTurn) return Promise.reject("WRONG TURN");

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

  private getTurn = (): Promise<PlayerColor> =>
    Promise.resolve(this.state.turn);

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

  // playerMovedEventSubscription = (): PlayerEventSubscription =>
  //   this.state.playerMovedSubscriptions;

  // switchTurnEventSubscription = (): SwitchTurnSubscriber =>
  //   this.state.switchTurnSubscriptions;

  // wallToggledEventSubscription = (): WallToggledSubscriber =>
  //   this.state.wallToggledSubscriptions;

  // lockWallEventSubscription = (): LockWallEventSubscription =>
  //   this.state.lockWallSubscriptions;

  // diceRollEventSubscription = (): DiceRollEventSubscription =>
  //   this.state.diceRollSubscriptions;

  // winGameEventSubscription = (): WinGameEventSubscription =>
  //   this.state.winGameSubscriptions;

  // startGameEventSubscription = (): StartGameEventSubscription =>
  //   this.state.startGameSubscriptions;

  // numWallChangesEventSubscription = (): NumWallChangesEventSubscription =>
  //   this.state.numWallChangesSubscriptions;

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

  private mirrorLockedWallLocations = (): void => {
    const wallLocationCopy: Coord[] = [...this.state.wallLocations.locked];
    for (const coord of this.state.wallLocations.locked) {
      wallLocationCopy.push({ row: coord.col, col: coord.row });
    }
    this.state.wallLocations.locked = wallLocationCopy;
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

  private pathExists = (player: PlayerColor): Promise<boolean> => {
    const board = this.state.currentBoard;
    if (board == null) throw new Error("board is null");

    const path = PathfinderImpl.shortestPath(
      this.state.playerLocations[player],
      this.state.endLocations[player],
      board
    );

    return Promise.resolve(!!path);
  };

  private getOldBoard = (): Promise<Board | null> => {
    return Promise.resolve(this.state.oldBoard);
  };

  private getNumWallChanges = async (): Promise<number> => {
    const oldBoard: Board | null = this.state.oldBoard;
    const newBoard: Board | null = this.state.currentBoard;

    if (oldBoard == null) throw new Error("could not get old board");
    if (newBoard == null) throw new Error("could not get new board");

    return newBoard.compareEdges(oldBoard);
  };

  private canEndTurn = async (): Promise<boolean> => {
    const dice = this.state.diceValue;
    const playerMovements = this.state.movements;
    const wallChanges = await this.getNumWallChanges();

    return playerMovements <= dice && wallChanges <= 7 - dice;
  };

  private initFromGame = (): Promise<Board> => {
    const board: Board = new BoardImpl(this.state.width, this.state.height);

    const redPlayerCoord: Coord = this.state.playerLocations.red;
    const redplayer: RedPlayer = "r";
    board.addToCell(redPlayerCoord, redplayer);

    const bluePlayerCoord: Coord = this.state.playerLocations.blue;
    const blueplayer: BluePlayer = "b";
    board.addToCell(bluePlayerCoord, blueplayer);

    const redEndCoord: Coord = this.state.endLocations.red;
    const redend: RedEnd = "R";
    board.addToCell(redEndCoord, redend);

    const blueEndCoord: Coord = this.state.endLocations.blue;
    const blueend: BlueEnd = "B";
    board.addToCell(blueEndCoord, blueend);

    const wallLocations: WallLocations = this.state.wallLocations;
    for (const wall of wallLocations.locked) {
      board.set(wall, "#");
    }
    for (const redWall of wallLocations.red) {
      board.set(redWall, "|");
    }
    for (const blueWall of wallLocations.blue) {
      board.set(blueWall, "-");
    }

    return Promise.resolve(board);
  };
}
