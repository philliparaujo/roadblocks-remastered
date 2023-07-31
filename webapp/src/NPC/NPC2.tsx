import { Coord } from "@roadblocks/engine";
import {
  averageCoord,
  distanceBetween,
  equalCoords,
  isAdjacent,
  isBorderEdge,
  isCell,
  isEdge,
  isHorizontalEdge,
  isVerticalEdge,
} from "@roadblocks/engine";
import Board, { BoardElement, EdgeElement } from "../GameEngine/Board";
import { Game } from "../GameEngine/Game";
import { PlayerColor, TurnPhase, WallLocations } from "@roadblocks/engine";
import { PathfinderImpl } from "../GameEngine/Pathfinder";
import { TextBoard } from "../GameEngine/TextBoard";
import { NPCUtils } from "./NPCUtils";
import { text } from "stream/consumers";

export type score = number;

interface NPCDurations {
  sleepTimeMs?: number;
  wallActionIntervalMs?: number;
  movementIntervalMs?: number;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class NPC2Impl {
  game: Game;
  player: PlayerColor;
  textBoard: TextBoard;
  utils: NPCUtils;
  mcts: MCTS;

  disabled?: boolean;
  gameOver: boolean;

  weightFn: (i: number) => number;

  private unsubscribeWall: () => void;
  private unsubscribePlayer: () => void;
  private unsubscribeSwitchTurn: () => void;
  private unsubscribeWinGame: () => void;
  private unsubscribeStartGame: () => void;

  sleepTimeMs: number;
  wallActionIntervalMs: number;
  movementIntervalMs: number;

  private constructor(
    game: Game,
    player: PlayerColor,
    textBoard: TextBoard,
    mcts: MCTS,
    durations: NPCDurations,
    disabled: boolean = false
  ) {
    this.game = game;
    this.player = player;
    this.textBoard = textBoard;
    this.utils = new NPCUtils(this.player, this.textBoard, this.game);
    this.mcts = mcts;

    this.disabled = disabled;
    this.gameOver = false;

    this.weightFn = (i: number) => 1 / (i + 1);

    this.unsubscribeWall = game
      .wallToggledEventSubscription()
      .subscribe(async (e) => {});
    this.unsubscribePlayer = game
      .playerMovedEventSubscription()
      .subscribe(async (e) => {});

    this.unsubscribeSwitchTurn = game
      .switchTurnEventSubscription()
      .subscribe(async (e) => {
        if (e.turn === player && (await this.utils.isMyTurn())) {
          this.play();
        }
      });
    this.unsubscribeWinGame = game.winGameEventSubscription().subscribe((e) => {
      this.gameOver = true;
    });
    this.unsubscribeStartGame = game
      .startGameEventSubscription()
      .subscribe(async (e) => {
        if (e.startingPlayer == this.player && (await this.utils.isMyTurn())) {
          this.play();
        }
      });

    // Set durations using provided values or default values
    this.sleepTimeMs = durations.sleepTimeMs ?? 500;
    this.wallActionIntervalMs = durations.wallActionIntervalMs ?? 300;
    this.movementIntervalMs = durations.movementIntervalMs ?? 200;
  }

  static async create(
    game: Game,
    player: PlayerColor,
    durations: NPCDurations = {},
    disabled: boolean = false
  ): Promise<NPC2Impl> {
    const mcts = await MCTS.create(game, player);
    const textBoard: TextBoard = await TextBoard.create(game, console.log);
    return Promise.resolve(
      new NPC2Impl(game, player, textBoard, mcts, durations, disabled)
    );
  }

  /* Public methods */
  public play = async (): Promise<void> => {
    if (this.disabled || this.gameOver || (await !this.utils.isMyTurn())) {
      return;
    }

    await sleep(this.sleepTimeMs);

    this.game.rollDice().then(async (result) => {
      this.mcts = await MCTS.create(this.game, this.player);
      // this.textBoard.getBoardForTesting().dump(console.log);
      const numMovements = result.diceValue;
      const numWallChanges = 7 - result.diceValue;

      for (let i = 0; i < numWallChanges; i++) {
        const bestMove: Coord | null = await this.mcts.calculate(100);

        if (bestMove === null) {
          console.error("best move is null");
        }

        if (bestMove && isEdge(bestMove)) {
          const allWalls: WallLocations = await this.game.getWallLocations();
          const myWalls: Coord[] = allWalls[this.player];
          if (this.utils.isCoordInArray(bestMove, myWalls)) {
            await this.game.removeEdge(bestMove);
          } else {
            await this.game.addEdge(bestMove);
          }
        }

        await sleep(this.wallActionIntervalMs);
      }

      try {
        await this.game.lockWalls();
      } catch (error) {
        console.error("Error in switching turns", error);
      }

      await sleep(this.sleepTimeMs);

      try {
        const movements = await this.bestXMovements(numMovements);
        if (movements) {
          for (let coord of movements) {
            this.game.setPlayerLocation(coord);
            await sleep(this.movementIntervalMs);
          }
        }
      } catch (error) {
        if (!this.gameOver) console.error("Error in moving:", error);
      }

      if (this.gameOver) {
        return;
      }

      await sleep(this.sleepTimeMs);
      try {
        // this.textBoard.getBoardForTesting().dump(console.log);
        await this.game.switchTurn();
        console.log("finished turn :)");
      } catch (error) {
        console.error("Error in ending turns", error);
      }
    });
  };

  /* Private methods */
  private bestXMovements = async (x: number): Promise<Coord[] | null> => {
    const path = await this.utils.getShortestPathOf(this.player);
    if (path) {
      if (path.length <= 1) {
        return Promise.reject("Already won?");
      } else {
        // Get first x coordinates, starting at index 1. If x > length, return entire path except first index
        return path.slice(1, x + 1);
      }
    } else {
      return Promise.reject("No path?");
    }
  };

  dispose() {
    this.unsubscribePlayer();
    this.unsubscribeWall();
  }
}

class Node {
  game: Game;
  player: PlayerColor;
  board: Board;
  parent: Node | null;
  children: Node[];
  action: Coord | null;
  visits: number;
  totalReward: number;
  walls: number;

  private constructor(
    game: Game,
    player: PlayerColor,
    board: Board,
    parent: Node | null,
    action: Coord | null,
    walls: number
  ) {
    this.game = game;
    this.player = player;
    this.board = board;
    this.parent = parent;
    this.children = [];
    this.action = action;
    this.visits = 0;
    this.totalReward = 0;
    this.walls = walls;
  }

  static async create(
    game: Game,
    player: PlayerColor,
    parent: Node | null = null,
    action: Coord | null = null,
    board?: Board,
    walls: number = 0
  ) {
    if (!board) {
      board = (await TextBoard.create(game, console.log)).getBoardForTesting();
    }

    // board.dump(console.log);
    return new Node(game, player, board, parent, action, walls);
  }
}

class MCTS {
  game: Game;
  player: PlayerColor;
  root: Node;
  textBoard: TextBoard;
  utils: NPCUtils;
  width: number;
  height: number;
  redEndLocation: Coord;
  blueEndLocation: Coord;

  private constructor(
    game: Game,
    player: PlayerColor,
    root: Node,
    textBoard: TextBoard,
    redEndLocation: Coord,
    blueEndLocation: Coord
  ) {
    this.game = game;
    this.player = player;
    this.root = root;
    this.textBoard = textBoard;
    this.utils = new NPCUtils(player, textBoard, game);
    this.width = textBoard.getWidth();
    this.height = textBoard.getHeight();
    this.redEndLocation = redEndLocation;
    this.blueEndLocation = blueEndLocation;
  }

  static async create(game: Game, player: PlayerColor) {
    const textBoard: TextBoard = await TextBoard.create(game, console.log);
    const root = await Node.create(game, player);

    const redEndLocation = await game.endLocation("red");
    const blueEndLocation = await game.endLocation("blue");

    return new MCTS(
      game,
      player,
      root,
      textBoard,
      redEndLocation,
      blueEndLocation
    );
  }

  select(node: Node): Node {
    return node.children.reduce((bestChild, child) => {
      // Additional check: disregard child if it corresponds to an illegal move
      // if (child.action !== null && child.walls >= 6) {
      // console.error("an illegal move was considered ?");
      // return bestChild;
      // }

      const childScore =
        child.visits === 0
          ? Infinity
          : child.totalReward / child.visits +
            Math.sqrt((2 * Math.log(node.visits)) / child.visits);
      const bestChildScore =
        bestChild.visits === 0
          ? Infinity
          : bestChild.totalReward / bestChild.visits +
            Math.sqrt((2 * Math.log(node.visits)) / bestChild.visits);
      const returnChild = childScore > bestChildScore ? child : bestChild;
      return returnChild;
    });
  }

  async expand(node: Node): Promise<void> {
    const possibleActions = await this.getPossibleWallActions(
      node.board,
      node.player
    );
    const nextPlayer: PlayerColor = this.utils.getOpponent(node.player);

    for (let i = 0; i < possibleActions.length; i++) {
      const action = possibleActions[i];
      const newBoard: Board = await this.applyWallAction(
        node.board,
        node.player,
        action
      );

      const newNode: Node = await Node.create(
        this.game,
        nextPlayer,
        node,
        action,
        newBoard,
        newBoard.countWalls(this.player)
      );

      node.children.push(newNode);
    }
  }

  async simulate(node: Node): Promise<number> {
    let boardCopy = node.board.copy();
    let currentPlayer = node.player;
    while (!this.gameOver(boardCopy)) {
      /* WALLS */
      const wallAction: Coord | null = await this.getRandomWallAction(
        boardCopy,
        currentPlayer,
        node.walls
      );
      if (wallAction === null || wallAction === undefined) {
        throw new Error("wall movement somehow bad");
      }

      let ogBoardCopy = boardCopy.copy();

      boardCopy = await this.applyWallAction(
        boardCopy,
        currentPlayer,
        wallAction
      );

      let playerLocation: Coord | null = await this.getPlayerLocation(
        currentPlayer,
        boardCopy
      );
      if (!playerLocation) throw new Error("could not get player locatioN?");

      let endLocation =
        currentPlayer === "red" ? this.redEndLocation : this.blueEndLocation;

      let shortestPath = PathfinderImpl.shortestPath(
        playerLocation,
        endLocation,
        boardCopy
      );
      if (!shortestPath || shortestPath.length < 2) {
        console.log(shortestPath, playerLocation, endLocation);
        console.log(boardCopy);
        boardCopy.dump(console.log);
        boardCopy = ogBoardCopy;
      }

      node.walls = boardCopy.countWalls(this.player);

      /* MOVEMENT */
      playerLocation = await this.getPlayerLocation(currentPlayer, boardCopy);
      if (!playerLocation) throw new Error("could not get player locatioN?");

      endLocation =
        currentPlayer === "red" ? this.redEndLocation : this.blueEndLocation;

      shortestPath = PathfinderImpl.shortestPath(
        playerLocation,
        endLocation,
        boardCopy
      );
      if (!shortestPath || shortestPath.length < 2) {
        console.log(shortestPath, playerLocation, endLocation);
        console.log(boardCopy);
        boardCopy.dump(console.log);
        throw new Error("shortest path not calculated correctly (MOVE)");
      }

      const moveAction: Coord = shortestPath[1];

      boardCopy = await this.applyMove(boardCopy, currentPlayer, moveAction);
      currentPlayer = this.utils.getOpponent(currentPlayer);
    }
    console.log("finished simulating game instance");

    return this.getReward(boardCopy);
  }

  backpropogate(node: Node, reward: number): void {
    let current: Node | null = node;
    while (current !== null) {
      current.visits++;
      current.totalReward += reward;
      current = current.parent;
    }
  }

  async calculate(iterations: number) {
    // this.textBoard.getBoardForTesting().dump(console.log);
    for (let i = 0; i < iterations; i++) {
      let node = this.root;

      while (node.children.length > 0) {
        node = this.select(node);
      }

      await this.expand(node);

      const reward = await this.simulate(node);
      this.backpropogate(node, reward);
    }

    // this.printScores(this.root);

    return this.select(this.root).action;
  }

  /* Helper methods */
  private async getPossibleWallActions(
    board: Board,
    player: PlayerColor
  ): Promise<Coord[]> {
    const validWallCoords: Coord[] = this.utils.allValidWallCoords(
      this.width,
      this.height,
      board,
      player
    );

    const walls = board.countWalls(player);

    if (validWallCoords.length === 0) {
      console.log(walls);
      board.dump(console.log);
      throw new Error("no valid wall coords");
    }

    const wallType = player === "red" ? "|" : "-";

    for (let i = 0; i < validWallCoords.length; i++) {
      const coord = validWallCoords[i];
      let boardCopy = board.copy();
      if (boardCopy.get(coord) === " ") {
        boardCopy.set(coord, wallType);
        const playerLocation: Coord | null = await this.getPlayerLocation(
          player,
          boardCopy
        );
        const opponentLocation = await this.getPlayerLocation(
          this.utils.getOpponent(player),
          boardCopy
        );

        if (!playerLocation || !opponentLocation) {
          throw new Error("could not find either players located");
        }

        const myPath = PathfinderImpl.shortestPath(
          playerLocation,
          this.player === "red" ? this.redEndLocation : this.blueEndLocation,
          boardCopy
        );
        const opponentPath = PathfinderImpl.shortestPath(
          opponentLocation,
          this.utils.getOpponent() === "red"
            ? this.redEndLocation
            : this.blueEndLocation,
          boardCopy
        );

        if (!myPath || !opponentPath || walls >= 6) {
          validWallCoords.splice(i, 1);
          i--;
        }
      }
    }
    return validWallCoords;
  }

  private async getRandomWallAction(
    board: Board,
    player: PlayerColor,
    walls: number
  ): Promise<Coord | null> {
    const validWallCoords = await this.getPossibleWallActions(board, player);

    if (validWallCoords.length === 0) {
      throw new Error("somehow no possible wall actions");
    }

    const randomIndex = Math.floor(Math.random() * validWallCoords.length);
    return validWallCoords[randomIndex];
  }

  private async applyWallAction(
    board: Board,
    player: PlayerColor,
    coord: Coord
  ): Promise<Board> {
    const boardCopy = board.copy();
    const allWalls: WallLocations = await this.game.getWallLocations();
    const myWalls: Coord[] = allWalls[player];
    if (this.utils.isCoordInArray(coord, myWalls)) {
      boardCopy.set(coord, " ");
    } else {
      const edgeType = player === "red" ? "|" : "-";
      boardCopy.set(coord, edgeType);
    }

    return boardCopy;
  }

  private async applyMove(
    board: Board,
    player: PlayerColor,
    coord: Coord
  ): Promise<Board> {
    const boardCopy = board.copy();
    const playerType = player === "red" ? "r" : "b";
    const oldCoord: Coord | null = this.getPlayerLocation(player, boardCopy);

    if (!oldCoord) {
      throw new Error("could not find old player location");
    }

    if (oldCoord == coord) {
      throw new Error("moving to same spot uh oh");
    }

    if (!isAdjacent(oldCoord, coord)) {
      board.dump(console.log);
      console.log(oldCoord, coord);
      throw new Error("coords not adjacent");
    }

    if (!isCell(oldCoord) || !isCell(coord)) {
      throw new Error("oldCoord or coord is not located on a cell");
    }

    boardCopy.addToCell(coord, playerType);
    if (oldCoord) {
      boardCopy.removeFromCell(oldCoord, playerType);
    }
    return boardCopy;
  }

  private getPlayerLocation = (
    player: PlayerColor,
    board: Board
  ): Coord | null => {
    const lookingFor = player === "red" ? "r" : "b";
    for (let i = 0; i < 2 * board.getHeight() + 1; i++) {
      for (let j = 0; j < 2 * board.getWidth() + 1; j++) {
        const element = board.get({ row: i, col: j });
        if (Array.isArray(element)) {
          if (element.includes(lookingFor)) {
            return { row: i, col: j };
          }
        }
      }
    }
    return null;
  };

  private getWinner = (board: Board): PlayerColor | null => {
    const redLocation = this.getPlayerLocation("red", board);
    const blueLocation = this.getPlayerLocation("blue", board);

    if (!redLocation || !blueLocation) {
      throw new Error("could not find red or blue locations");
    }

    const redWon = equalCoords(redLocation, this.redEndLocation);
    const blueWon = equalCoords(blueLocation, this.blueEndLocation);

    if (redWon && blueWon) {
      throw new Error("somehow both players won");
    } else if (redWon) {
      return "red";
    } else if (blueWon) {
      return "blue";
    } else {
      return null;
    }
  };

  private gameOver = (board: Board): boolean => {
    return this.getWinner(board) !== null;
  };

  private getReward = (board: Board): number => {
    const winner = this.getWinner(board);
    if (winner === this.player) {
      return 1;
    } else if (winner === null) {
      return 0;
    } else {
      return -1;
    }
  };

  private printScores(node: Node): void {
    node.children.forEach((child) => {
      const childScore =
        child.totalReward / child.visits +
        Math.sqrt((2 * Math.log(node.visits)) / child.visits);
      console.log(
        `Action: (${child.action?.row}, ${child.action?.col}), ` +
          `Score: ${childScore}, ` +
          `totalReward: ${child.totalReward}, ` +
          `childVisits: ${child.visits}, ` +
          `nodeVisits: ${node.visits}`
      );
    });
  }
}
