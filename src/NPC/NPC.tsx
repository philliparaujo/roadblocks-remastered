import { Coord } from "../Coord";
import {
  averageCoord,
  distanceBetween,
  equalCoords,
  isBorderEdge,
  isHorizontalEdge,
  isVerticalEdge,
} from "../Utils";
import Board, { BoardElement, EdgeElement } from "../GameEngine/Board";
import { Game, PlayerColor, WallLocations } from "../GameEngine/Game";
import { PathfinderImpl } from "../GameEngine/Pathfinder";
import { TextBoard } from "../GameEngine/TextBoard";
import { NPCUtils } from "./NPCUtils";

export type score = number;

interface NPCDurations {
  sleepTimeMs?: number;
  wallActionIntervalMs?: number;
  movementIntervalMs?: number;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class NPCImpl {
  game: Game;
  player: PlayerColor;
  textBoard: TextBoard;
  utils: NPCUtils;

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
    durations: NPCDurations,
    disabled: boolean = false
  ) {
    this.game = game;
    this.player = player;
    this.textBoard = textBoard;
    this.utils = new NPCUtils(this.player, this.textBoard, this.game);

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
  ): Promise<NPCImpl> {
    const textBoard: TextBoard = await TextBoard.create(game, console.log);
    return Promise.resolve(
      new NPCImpl(game, player, textBoard, durations, disabled)
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

    for (let i = 0; i < 3; i++) {
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
    // console.log("playing", this.player);

    await sleep(this.sleepTimeMs);

    this.game.rollDice().then(async (result) => {
      // console.time("__________FULL TURN");
      try {
        const numMovements = result.diceValue;
        const numWallChanges = 7 - result.diceValue;

        // console.time("moveWalls");
        for (let i = 0; i < numWallChanges; i++) {
          const bestMove: Coord | null = await this.bestSingleWallMove();
          if (bestMove === null) {
            break;
          }
          const allWalls: WallLocations = await this.game.getWallLocations();
          const myWalls: Coord[] = allWalls[this.player];
          if (this.utils.isCoordInArray(bestMove, myWalls)) {
            await this.game.removeEdge(bestMove);
          } else {
            await this.game.addEdge(bestMove);
          }

          await sleep(this.wallActionIntervalMs);
        }
        // console.timeEnd("moveWalls");

        try {
          await this.game.lockWalls();
        } catch (error) {
          console.error("Error in switching turns", error);
        }

        await sleep(this.sleepTimeMs);

        // console.time("movePlayer");
        try {
          const movements = await this.utils.bestXMovements(numMovements);
          if (movements) {
            for (let coord of movements) {
              await this.game.setPlayerLocation(coord);
              await sleep(this.movementIntervalMs);
            }
          }
        } catch (error) {
          if (!this.gameOver) console.error("Error in moving:", error);
        }
        // console.timeEnd("movePlayer");

        if (this.gameOver) {
          return;
        }

        await sleep(this.sleepTimeMs);
        try {
          // this.textBoard.getBoardForTesting().dump(console.log);
          await this.game.switchTurn();
        } catch (error) {
          console.error("Error in ending turns", error);
        }
      } finally {
        // console.timeEnd("__________FULL TURN");
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

  private bestSingleWallMove = async (): Promise<Coord | null> => {
    const board: Board = this.textBoard.getBoardForTesting();
    const allWalls = await this.game.getWallLocations();
    const myWalls: Coord[] = allWalls[this.player];

    // console.time("bestWallPlacement");
    const bestWallPlacement: Coord | null =
      await this.utils.bestSingleWallPlacement(board, this.calculateScore);
    let bestPlacementScore: number = -Infinity;
    if (bestWallPlacement) {
      const tempBoard = board.copy();
      let wallType = this.player === "red" ? "|" : "-";
      tempBoard.set(bestWallPlacement, wallType as EdgeElement);
      this.calculateScore(tempBoard).then(
        (result) => (bestPlacementScore = result)
      );
    }
    // console.timeEnd("bestWallPlacement");

    // console.time("bestWallRemoval");
    const bestWallRemoval = await this.utils.bestSingleWallRemoval(
      board,
      myWalls,
      this.calculateScore
    );
    let bestRemovalScore: number = -Infinity;
    if (bestWallRemoval) {
      const tempBoard = board.copy();
      tempBoard.set(bestWallRemoval, " ");
      this.calculateScore(tempBoard).then(
        (result) => (bestRemovalScore = result)
      );
    }
    // console.timeEnd("bestWallRemoval");

    if (bestPlacementScore >= bestRemovalScore && myWalls.length < 6) {
      if (!bestWallPlacement) {
        return Promise.resolve(null);
      }
      return Promise.resolve(bestWallPlacement);
    } else {
      if (!bestWallRemoval) {
        return Promise.resolve(null);
      }
      return Promise.resolve(bestWallRemoval);
    }
  };

  dispose() {
    this.unsubscribePlayer();
    this.unsubscribeWall();
  }
}
