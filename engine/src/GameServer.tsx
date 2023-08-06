import {
  BlueEnd,
  BluePlayer,
  Board,
  BoardImpl,
  RedEnd,
  RedPlayer,
} from "./Board";

import {
  equalCoords,
  isBorderEdge,
  isEdge,
  isValidMove,
  isVerticalEdge,
  randomDiceValue,
} from "./Utils";

import {
  CellElement,
  CellLocations,
  Coord,
  DiceInfo,
  DiceRollEvent,
  DiceRollResult,
  EdgeResult,
  EndTurnResult,
  LockWallEvent,
  LockWallResult,
  NumWallChangesEvent,
  PlayerColor,
  PlayerMovedEvent,
  PlayerMovedResult,
  ResetResult,
  StartGameEvent,
  StartGameResult,
  SwitchTurnEvent,
  TurnPhase,
  WallLocations,
  WallToggledEvent,
  WinGameEvent,
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
} from "./PubSub/SubscriberServer";

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

  playerMovedSubscriptions: PlayerMovedSubscriberServer;
  switchTurnSubscriptions: SwitchTurnSubscriberServer;
  wallToggledSubscriptions: WallToggledSubscriberServer;
  lockWallSubscriptions: LockWallSubscriberServer;
  diceRollSubscriptions: DiceRollSubscriberServer;
  winGameSubscriptions: WinGameSubscriberServer;
  startGameSubscriptions: StartGameSubscriberServer;
  numWallChangesSubscriptions: NumWallChangesSubscriberServer;
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
    console.log("Created game object", this.state.id);
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

  startGame = async (): Promise<StartGameResult> => {
    this.state.gameOver = false;
    this.startGameSubscriptions.notify(new StartGameEvent(this.state.turn));
    this.state.oldBoard = await this.initFromGame();

    this.state.currentBoard = this.state.oldBoard.copy();

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

  private setPlayerLocation = async (
    coord: Coord
  ): Promise<PlayerMovedResult> => {
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

    this.diceRollSubscriptions.notify(new DiceRollEvent("start"));
    this.state.diceRolled = true;

    return new Promise((resolve) => {
      setTimeout(() => {
        // console.time("rollDice");
        try {
          const currentDiceRolls = this.state.diceRolls[this.state.turn];
          const newValue = randomDiceValue(currentDiceRolls);
          const result = { diceValue: newValue };
          this.diceRollSubscriptions.notify(
            new DiceRollEvent("stop", newValue)
          );
          this.state.diceValue = newValue;
          resolve(result);
        } finally {
          // console.timeEnd("rollDice");
        }
      }, this.state.rollDurationMs);
    });
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

  private getInitialCellLocation = (
    cellElement: CellElement
  ): Promise<Coord> => {
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

  private getWallLocations = (): Promise<WallLocations> => {
    return Promise.resolve(
      JSON.parse(JSON.stringify(this.state.wallLocations))
    );
  };

  private getDiceRolls = (player: PlayerColor): Promise<number[]> =>
    Promise.resolve(this.state.diceRolls[player]);

  private getWidth = (): Promise<number> => {
    return Promise.resolve(this.state.width);
  };

  private getHeight = (): Promise<number> => {
    return Promise.resolve(this.state.height);
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

  private initFromGame = async (): Promise<Board> => {
    const board: Board = new BoardImpl(this.state.width, this.state.height);

    const redPlayerCoord: Coord = await this.getInitialCellLocation(
      "redplayer"
    );
    const redplayer: RedPlayer = "r";
    board.addToCell(redPlayerCoord, redplayer);

    const bluePlayerCoord: Coord = await this.getInitialCellLocation(
      "blueplayer"
    );
    const blueplayer: BluePlayer = "b";
    board.addToCell(bluePlayerCoord, blueplayer);

    const redEndCoord: Coord = await this.getInitialCellLocation("redend");
    const redend: RedEnd = "R";
    board.addToCell(redEndCoord, redend);

    const blueEndCoord: Coord = await this.getInitialCellLocation("blueend");
    const blueend: BlueEnd = "B";
    board.addToCell(blueEndCoord, blueend);

    const wallLocations = await this.getWallLocations();
    for (const wall of wallLocations.locked) {
      board.set(wall, "#");
    }
    for (const redWall of wallLocations.red) {
      board.set(redWall, "|");
    }
    for (const blueWall of wallLocations.blue) {
      board.set(blueWall, "-");
    }

    return board;
  };
}
