import { Coord } from "../Coord";
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
} from "../Utils";
import Board, { BoardElement, EdgeElement } from "../GameEngine/Board";
import {
  Game,
  PlayerColor,
  TurnPhase,
  WallLocations,
} from "../GameEngine/Game";
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

interface NPC {
  calculateScore: (board: Board) => Promise<score>;
  play: () => Promise<void>;
}

export class NPC2Impl implements NPC {
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
  public calculateScore = async (
    board: Board = this.textBoard.getBoardForTesting()
  ): Promise<score> => {
    const opponentColor = this.utils.getOpponent();
    const scoreVariations: score[] = [];

    const allWalls = await this.game.getWallLocations();
    const myWalls = allWalls[this.player];
    const opponentWalls = allWalls[this.utils.getOpponent()];

    const center: Coord = {
      row: await this.game.getHeight(),
      col: await this.game.getWidth(),
    };

    const diffFromCenter = this.calculateCenterDiff(
      myWalls,
      opponentWalls,
      center
    );

    for (let i = 0; i < 1; i++) {
      const myPath = await this.utils.getShortestPathMinusXWalls(
        i,
        this.player,
        board,
        myWalls
      );
      const opponentPath = await this.utils.getShortestPathMinusXWalls(
        i,
        opponentColor,
        board,
        myWalls
      );

      if (myPath && opponentPath) {
        const difference: score = opponentPath.length - myPath.length;
        scoreVariations.push(difference);
      } else if (myPath) {
        return Promise.reject(`opponent has no valid path, ${i}`);
      } else if (opponentPath) {
        this.utils.printShortestPath();
        return Promise.reject(`i don't have a valid path, ${i}`);
      } else {
        return Promise.reject(`neither of us have valid paths, ${i}`);
      }
    }

    let finalScore: number = diffFromCenter;
    for (let i = 0; i < scoreVariations.length; i++) {
      let weight: number = this.weightFn(i);
      finalScore += scoreVariations[i] * weight;
    }

    return Promise.resolve(finalScore);
  };

  public play = async (): Promise<void> => {
    if (this.disabled || this.gameOver || (await !this.utils.isMyTurn())) {
      return;
    }

    await sleep(this.sleepTimeMs);

    this.game.rollDice().then(async (result) => {
      // const numMovements = result.diceValue;
      // const numWallChanges = 7 - result.diceValue;

      const bestMove: Coord | null = await this.mcts.calculate(50);
      // this.textBoard.getBoardForTesting().dump(console.log);

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

      // for (let i = 0; i < 1; i++) {
      //   console.log(bestMove);
      //   if (bestMove === null) {
      //     break;
      //   }
      //   const allWalls: WallLocations = await this.game.getWallLocations();
      //   const myWalls: Coord[] = allWalls[this.player];
      //   if (this.utils.isCoordInArray(bestMove, myWalls)) {
      //     await this.game.removeEdge(bestMove);
      //   } else {
      //     await this.game.addEdge(bestMove);
      //   }

      //   await sleep(this.wallActionIntervalMs);
      // }

      try {
        await this.game.lockWalls();
      } catch (error) {
        console.error("Error in switching turns", error);
      }

      await sleep(this.sleepTimeMs);

      try {
        if (bestMove && isCell(bestMove)) {
          await this.game.setPlayerLocation(bestMove);
        }
        // const movements = await this.bestXMovements(1);
        // if (movements) {
        //   for (let coord of movements) {
        //     this.game.setPlayerLocation(coord);
        //     await sleep(this.movementIntervalMs);
        //   }
        // }
      } catch (error) {
        if (!this.gameOver) console.error("Error in moving:", error);
      }

      if (this.gameOver) {
        return;
      }

      await sleep(this.sleepTimeMs);
      try {
        this.mcts = await MCTS.create(this.game, this.player);
        this.textBoard.getBoardForTesting().dump(console.log);
        await this.game.switchTurn();
        console.log("finished turn :)");
        await sleep(1000);
      } catch (error) {
        console.error("Error in ending turns", error);
      }
    });
  };

  /* Private methods */
  private calculateCenterDiff = (
    myWalls: Coord[],
    opponentWalls: Coord[],
    center: Coord
  ): number => {
    const distance = (coord1: Coord, coord2: Coord): number =>
      Math.sqrt(
        Math.pow(coord1.row - coord2.row, 2) +
          Math.pow(coord1.col - coord2.col, 2)
      );

    // Calculate average distance of my walls from the center
    const myAverageDistance =
      myWalls.length > 0
        ? myWalls.reduce((sum, wall) => sum + distance(wall, center), 0) /
          myWalls.length
        : 0;

    // Calculate average distance of opponent's walls from the center
    const opponentAverageDistance =
      opponentWalls.length > 0
        ? opponentWalls.reduce((sum, wall) => sum + distance(wall, center), 0) /
          opponentWalls.length
        : 0;

    return myAverageDistance - opponentAverageDistance;
  };

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
  phase: TurnPhase;
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
    phase: TurnPhase,
    board: Board,
    parent: Node | null,
    action: Coord | null,
    walls: number
  ) {
    this.game = game;
    this.player = player;
    this.phase = phase;
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
    phase: TurnPhase,
    parent: Node | null = null,
    action: Coord | null = null,
    board?: Board,
    walls: number = 0
  ) {
    if (!board) {
      board = (await TextBoard.create(game, console.log)).getBoardForTesting();
    }

    if (walls === 0) {
      console.log("No walls");
    }

    return new Node(game, player, phase, board, parent, action, walls);
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
    const root = await Node.create(game, player, "placingWalls");

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
      // console.log(returnChild.action);
      return returnChild;
    });
  }

  async expand(node: Node): Promise<void> {
    const possibleActions = await this.getPossibleActions(
      node.board,
      node.phase,
      node.player,
      node.walls
    );
    const nextPlayer: PlayerColor = this.utils.getOpponent(node.player);

    for (let i = 0; i < possibleActions.length; i++) {
      const action = possibleActions[i];
      const newBoard: Board = await this.applyAction(
        node.board,
        node.phase,
        node.player,
        action
      );
      const newPhase: TurnPhase =
        node.phase === "placingWalls" ? "movingPlayer" : "placingWalls";

      const newNode: Node = await Node.create(
        this.game,
        nextPlayer,
        newPhase,
        node,
        action,
        newBoard,
        this.calculateNumWalls(newBoard, this.player)
      );

      node.children.push(newNode);
    }
  }

  async simulate(node: Node): Promise<number> {
    let boardCopy = node.board.copy();
    let phase = node.phase;
    let currentPlayer = node.player;
    while (!this.gameOver(boardCopy)) {
      const wallAction: Coord | null = await this.getRandomAction(
        boardCopy,
        phase,
        currentPlayer,
        node.walls
      );
      if (wallAction === null) {
        throw new Error("wall movement somehow null");
      }

      boardCopy = await this.applyAction(
        boardCopy,
        phase,
        currentPlayer,
        wallAction
      );
      node.walls = this.calculateNumWalls(boardCopy, this.player);
      phase = phase === "placingWalls" ? "movingPlayer" : "placingWalls";

      const moveAction: Coord | null = await this.getRandomAction(
        boardCopy,
        phase,
        currentPlayer,
        node.walls
      );
      if (moveAction == null) {
        throw new Error("movement somehow null");
      }
      boardCopy = await this.applyAction(
        boardCopy,
        phase,
        currentPlayer,
        moveAction
      );
      node.walls = this.calculateNumWalls(boardCopy, this.player);
      currentPlayer = this.utils.getOpponent(currentPlayer);
      phase = phase === "placingWalls" ? "movingPlayer" : "placingWalls";
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
    console.log("start of decisions");
    this.root.board.dump(console.log);
    this.textBoard.getBoardForTesting().dump(console.log);
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

  private async getPossibleActions(
    board: Board,
    phase: TurnPhase,
    player: PlayerColor,
    walls: number
  ): Promise<Coord[]> {
    switch (phase) {
      case "placingWalls":
        const validWallCoords: Coord[] = this.utils.allValidWallCoords(
          this.width,
          this.height,
          board,
          walls,
          player
        );

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
              this.player === "red"
                ? this.redEndLocation
                : this.blueEndLocation,
              boardCopy
            );
            const opponentPath = PathfinderImpl.shortestPath(
              opponentLocation,
              this.utils.getOpponent() === "red"
                ? this.redEndLocation
                : this.blueEndLocation,
              boardCopy
            );

            if (!myPath || !opponentPath) {
              validWallCoords.splice(i, 1);
              i--;
            }
          }
        }
        return validWallCoords;

      case "movingPlayer":
        const playerLocation: Coord | null = await this.getPlayerLocation(
          player,
          board
        );
        if (!playerLocation) throw new Error("could not get player locatioN?");

        const endLocation =
          player === "red" ? this.redEndLocation : this.blueEndLocation;

        // Calculate the shortest path based on the current state of the board.
        const shortestPath = PathfinderImpl.shortestPath(
          playerLocation,
          endLocation,
          board
        );

        // If the shortest path is only one move long, we've reached the destination.
        if (!shortestPath || shortestPath.length <= 1) {
          // Game is over, no more moves
          return [];
        }

        // Move the player to the next step in the path.
        await sleep(10);

        return [shortestPath[1]];
      default:
        throw new Error("Invalid phase");
    }
  }

  private async getRandomAction(
    board: Board,
    phase: TurnPhase,
    player: PlayerColor,
    walls: number
  ): Promise<Coord | null> {
    if (phase === "placingWalls") {
      const validWallCoords = await this.getPossibleActions(
        board,
        phase,
        player,
        walls
      );
      const randomIndex = Math.floor(Math.random() * validWallCoords.length);
      return validWallCoords[randomIndex];
    } else if (phase === "movingPlayer") {
      const validPlayerMoves = await this.getPossibleActions(
        board,
        phase,
        player,
        walls
      );
      if (validPlayerMoves.length === 0) {
        return null;
      }
      const randomIndex = Math.floor(Math.random() * validPlayerMoves.length);
      return validPlayerMoves[randomIndex];
    } else {
      throw new Error("Invalid phase");
    }
  }

  private async applyAction(
    board: Board,
    phase: TurnPhase,
    player: PlayerColor,
    coord: Coord
  ): Promise<Board> {
    const boardCopy = board.copy();
    switch (phase) {
      case "placingWalls":
        const allWalls: WallLocations = await this.game.getWallLocations();
        const myWalls: Coord[] = allWalls[player];
        if (this.utils.isCoordInArray(coord, myWalls)) {
          boardCopy.set(coord, " ");
        } else {
          const edgeType = player === "red" ? "|" : "-";
          boardCopy.set(coord, edgeType);
        }
        break;
      case "movingPlayer":
        const playerType = player === "red" ? "r" : "b";
        const oldCoord: Coord | null = this.getPlayerLocation(
          player,
          boardCopy
        );

        if (!oldCoord) {
          throw new Error("could not find old player location");
        }

        if (oldCoord == coord) {
          throw new Error("moving to same spot uh oh");
        }

        if (!isAdjacent(oldCoord, coord)) {
          throw new Error("coords not adjacent");
        }

        if (!isCell(oldCoord) || !isCell(coord)) {
          throw new Error("oldCoord or coord is not located on a cell");
        }

        boardCopy.addToCell(coord, playerType);
        if (oldCoord) {
          boardCopy.removeFromCell(oldCoord, playerType);
        }
        break;
      default:
        throw new Error("Invalid phase");
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

  private calculateNumWalls = (board: Board, player: PlayerColor) => {
    let numWalls = 0;
    const wallType = player === "red" ? "|" : "-";
    for (let i = 0; i < 2 * board.getHeight() + 1; i++) {
      for (let j = 0; j < 2 * board.getWidth() + 1; j++) {
        const element = board.get({ row: i, col: j });
        if (!Array.isArray(element) && element === wallType) {
          numWalls++;
        }
      }
    }
    return numWalls;
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
