import { Coord } from "../Coord";
import {
  averageCoord,
  equalCoords,
  isBorderEdge,
  isHorizontalEdge,
  isVerticalEdge,
} from "../Utils";
import Board, { BoardElement, EdgeElement } from "./Board";
import { Game, PlayerColor, WallLocations } from "./Game";
import { PathfinderImpl } from "./Pathfinder";
import { TextBoard } from "./TextBoard";

type score = number;

interface NPCDurations {
  sleepTimeMs?: number;
  wallActionIntervalMs?: number;
  movementIntervalMs?: number;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/* eventually remove */
interface NPC {
  // bestWall: () => Promise<Coord[]>;
  isMyTurn: () => Promise<boolean>;
  calculateScore: () => Promise<score>;
}

export class NPCImpl implements NPC {
  game: Game;
  player: PlayerColor;
  textBoard: TextBoard;
  pathfinder: PathfinderImpl;

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
    this.pathfinder = new PathfinderImpl();

    this.disabled = disabled;
    this.gameOver = false;

    this.weightFn = (i: number) => 1 / (i + 1);

    this.unsubscribeWall = game
      .wallToggledEventSubscription()
      .subscribe(async (e) => {
        if (await this.isMyTurn()) {
          this.printHelper();
        }
      });
    this.unsubscribePlayer = game
      .playerMovedEventSubscription()
      .subscribe(async (e) => {
        if (await this.isMyTurn()) {
          this.printHelper();
        }
      });
    this.unsubscribeSwitchTurn = game
      .switchTurnEventSubscription()
      .subscribe(async (e) => {
        if (e.turn === player && (await this.game.getTurn()) === player) {
          this.play();
        }
      });
    this.unsubscribeWinGame = game.winGameEventSubscription().subscribe((e) => {
      this.gameOver = true;
    });
    this.unsubscribeStartGame = game
      .startGameEventSubscription()
      .subscribe(async (e) => {
        if (
          e.startingPlayer == this.player &&
          (await this.game.getTurn()) === player
        ) {
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

  public isMyTurn = async (): Promise<boolean> => {
    const turn = await this.game.getTurn();
    return turn === this.player;
  };

  public calculateScore = async (
    board: Board = this.textBoard.getBoardForTesting()
  ): Promise<score> => {
    const opponentColor = this.getOpponent();
    const scoreVariations: score[] = [];

    for (let i = 0; i < 4; i++) {
      const myPath = await this.getShortestPathMinusXWalls(
        i,
        this.player,
        board
      );
      const opponentPath = await this.getShortestPathMinusXWalls(
        i,
        opponentColor,
        board
      );

      if (myPath && opponentPath) {
        const difference: score = opponentPath.length - myPath.length;
        scoreVariations.push(difference);
      } else if (myPath) {
        return Promise.reject(`opponent has no valid path, ${i}`);
      } else if (opponentPath) {
        this.printShortestPath();
        return Promise.reject(`i don't have a valid path, ${i}`);
      } else {
        return Promise.reject(`neither of us have valid paths, ${i}`);
      }
    }

    let finalScore: number = 0;
    for (let i = 0; i < scoreVariations.length; i++) {
      let weight: number = this.weightFn(i);
      finalScore += scoreVariations[i] * weight;
    }

    return Promise.resolve(finalScore);
  };

  /* Powerful private methods */
  private play = async (): Promise<void> => {
    if (
      this.disabled ||
      this.gameOver ||
      (await this.game.getTurn()) !== this.player
    ) {
      return;
    }
    // console.log("playing", this.player);

    // await sleep(this.sleepTimeMs);

    this.game.rollDice().then(async (result) => {
      console.time("__________FULL TURN");
      try {
        const numMovements = result.diceValue;
        const numWallChanges = 7 - result.diceValue;

        console.time("moveWalls");
        for (let i = 0; i < numWallChanges; i++) {
          console.time(`moveWalls ${i} bestMove`);
          const bestMove: Coord | null = await this.bestSingleWallMove();
          if (bestMove === null) {
            break;
          }
          console.timeEnd(`moveWalls ${i} bestMove`);
          const allWalls: WallLocations = await this.game.getWallLocations();
          const myWalls: Coord[] = allWalls[this.player];
          if (this.isCoordInArray(bestMove, myWalls)) {
            await this.game.removeEdge(bestMove);
          } else {
            await this.game.addEdge(bestMove);
          }

          // await sleep(this.wallActionIntervalMs);
        }
        console.timeEnd("moveWalls");
        // console.time("lockWalls");

        try {
          await this.game.lockWalls();
        } catch (error) {
          console.error("Error in switching turns", error);
        }
        // console.timeEnd("lockWalls");

        // await sleep(this.sleepTimeMs);

        console.time("movePlayer");
        try {
          const movements = await this.bestXMovements(numMovements);
          if (movements) {
            for (let coord of movements) {
              this.game.setPlayerLocation(coord);
              // await sleep(this.movementIntervalMs);
            }
          }
        } catch (error) {
          if (!this.gameOver) console.error("Error in moving:", error);
        }
        console.timeEnd("movePlayer");

        if (this.gameOver) {
          return;
        }

        // await sleep(this.sleepTimeMs);

        // console.time("switchTurn");
        try {
          // this.textBoard.getBoardForTesting().dump(console.log);
          await this.game.switchTurn();
        } catch (error) {
          console.error("Error in ending turns", error);
        }
        // console.timeEnd("switchTurn");
      } finally {
        console.timeEnd("__________FULL TURN");
      }
    });
  };

  private bestXMovements = async (x: number): Promise<Coord[] | null> => {
    const path = await this.getShortestPathOf(this.player);
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

  private bestSingleWallMove = async (): Promise<Coord | null> => {
    const board: Board = this.textBoard.getBoardForTesting();
    const allWalls = await this.game.getWallLocations();
    const myWalls: Coord[] = allWalls[this.player];

    console.time("bestWallPlacement");
    const bestWallPlacement: Coord | null = await this.bestSingleWallPlacement(
      board
    );
    let bestPlacementScore: number = -Infinity;
    if (bestWallPlacement) {
      const tempBoard = board.copy();
      let wallType = this.player === "red" ? "|" : "-";
      tempBoard.set(bestWallPlacement, wallType as EdgeElement);
      this.calculateScore(tempBoard).then(
        (result) => (bestPlacementScore = result)
      );
    }
    console.timeEnd("bestWallPlacement");

    console.time("bestWallRemoval");
    const bestWallRemoval = await this.bestSingleWallRemoval(board, myWalls);
    let bestRemovalScore: number = -Infinity;
    if (bestWallRemoval) {
      const tempBoard = board.copy();
      tempBoard.set(bestWallRemoval, " ");
      this.calculateScore(tempBoard).then(
        (result) => (bestRemovalScore = result)
      );
    }
    console.timeEnd("bestWallRemoval");

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

  /* Helper methods */

  private bestSingleWallPlacement = async (
    board: Board
  ): Promise<Coord | null> => {
    const allValidWalls: Coord[] = this.allValidWallCoords();

    const allWalls: WallLocations = await this.game.getWallLocations();
    const myWalls: Coord[] = allWalls[this.player];

    const emptyValidWalls: Coord[] = allValidWalls.filter((validWall) =>
      myWalls.every((myWall) => !equalCoords(validWall, myWall))
    );

    const opponentPath = await this.getShortestPathOf(
      this.getOpponent(),
      board
    );

    let bestScore = -Infinity;
    let bestWall: Coord | null = null;

    const checkWallPlacement = async (wallCoord: Coord) => {
      let tempBoard = board.copy();
      let wallType = this.player === "red" ? "|" : "-";

      if (tempBoard.get(wallCoord) == wallType) {
        console.error("Wall somehow already exists");
        return;
      }

      tempBoard.set(wallCoord, wallType as EdgeElement);

      const myPath = await this.getShortestPathOf(this.player, tempBoard);
      const newOpponentPath = await this.getShortestPathOf(
        this.getOpponent(),
        tempBoard
      );

      // If we've blocked the opponent completely, remove the wall and continue
      if (myPath === null || newOpponentPath === null) {
        tempBoard.set(wallCoord, " ");
        return;
      }

      try {
        console.time("addition Calc");
        const score = await this.calculateScore(tempBoard);
        console.timeEnd("addition Calc");
        if (score > bestScore) {
          bestScore = score;
          bestWall = wallCoord;
        }
      } catch (error) {
        console.error(error);
      }
    };

    // First, check walls on opponent's path
    if (opponentPath && opponentPath.length > 1) {
      for (let i = 0; i < opponentPath.length - 1; i++) {
        let wallCoord = averageCoord(opponentPath[i], opponentPath[i + 1]);

        if (this.isCoordInArray(wallCoord, emptyValidWalls)) {
          await checkWallPlacement(wallCoord);

          // If we've found a wall, break out of the loop
          // if (bestWall !== null) return bestWall;
        }
      }
    }

    // If we haven't found a wall yet, check all remaining walls
    for (let wallCoord of emptyValidWalls) {
      await checkWallPlacement(wallCoord);

      // If we've found a wall, break out of the loop
      if (bestWall !== null) return bestWall;
    }

    return bestWall;
  };

  // private bestSingleWallPlacement = async (
  //   board: Board
  // ): Promise<Coord | null> => {
  //   const opponentPath = await this.getShortestPathOf(
  //     this.getOpponent(),
  //     board
  //   );

  //   let bestWall = await this.highestScoreWallOnOpponentPath(
  //     board,
  //     opponentPath
  //   );
  //   if (bestWall == null) {
  //     bestWall = await this.highestScoreWall(board);
  //   }

  //   return bestWall;
  // };

  private bestSingleWallRemoval = async (
    board: Board,
    myWalls: Coord[]
  ): Promise<Coord | null> => {
    let bestScore = -Infinity;
    let bestWall: Coord | null = null;

    for (let wallCoord of myWalls) {
      const originalValue = board.get(wallCoord);
      board.set(wallCoord, " "); // Remove the wall

      try {
        console.time("removal Calc");
        const score = await this.calculateScore(board);
        console.timeEnd("removal Calc");
        if (score > bestScore) {
          bestScore = score;
          bestWall = wallCoord;
        }
      } catch (error) {
        console.error(error);
      } finally {
        board.set(wallCoord, originalValue); // Undo the removal
      }
    }

    return bestWall;
  };

  // private bestSingleWallRemoval = async (
  //   board: Board,
  //   myWalls: Coord[]
  // ): Promise<Coord | null> => {
  //   let bestScore = -Infinity;
  //   let bestWall: Coord | null = null;

  //   for (let wallCoord of myWalls) {
  //     let tempBoard = board.copy();
  //     tempBoard.set(wallCoord, " "); // Remove the wall

  //     try {
  //       const score = await this.calculateScore(tempBoard);
  //       if (score > bestScore) {
  //         bestScore = score;
  //         bestWall = wallCoord;
  //       }
  //     } catch (error) {
  //       console.error(error);
  //     }
  //   }

  //   return bestWall;
  // };

  private highestScoreWallOnOpponentPath = async (
    board: Board,
    opponentPath: Coord[] | null
  ) => {
    if (!opponentPath || opponentPath.length < 2) {
      return null;
    }

    const allValidWalls: Coord[] = this.allValidWallCoords();

    const allWalls: WallLocations = await this.game.getWallLocations();
    const myWalls: Coord[] = allWalls[this.player];

    const emptyValidWalls: Coord[] = allValidWalls.filter((validWall) =>
      myWalls.every((myWall) => !equalCoords(validWall, myWall))
    );

    let bestScore = -Infinity;
    let bestWall: Coord | null = null;

    for (let i = 0; i < opponentPath.length - 1; i++) {
      let wallCoord = averageCoord(opponentPath[i], opponentPath[i + 1]);

      if (this.isCoordInArray(wallCoord, emptyValidWalls)) {
        let tempBoard = board.copy();
        let wallType = this.player === "red" ? "|" : "-";

        if (tempBoard.get(wallCoord) == wallType) {
          console.error("Wall somehow already exists");
          break;
        }

        tempBoard.set(wallCoord, wallType as EdgeElement);

        const myPath = await this.getShortestPathOf(this.player, tempBoard);

        const newOpponentPath = await this.getShortestPathOf(
          this.getOpponent(),
          tempBoard
        );

        // If we've blocked the opponent completely, remove the wall and continue
        if (myPath === null || newOpponentPath === null) {
          tempBoard.set(wallCoord, " ");
          continue;
        }

        try {
          const score = await this.calculateScore(tempBoard);
          if (score > bestScore) {
            bestScore = score;
            bestWall = wallCoord;
          }
        } catch (error) {
          console.error(error);
        }
      }
    }

    return bestWall;
  };

  private highestScoreWall = async (board: Board) => {
    const allValidWalls: Coord[] = this.allValidWallCoords();

    let bestScore = -Infinity;
    let bestWalls: Coord[] = [];

    for (let coord of allValidWalls) {
      let tempBoard = board.copy();
      let wallType = this.player === "red" ? "|" : "-";
      if (tempBoard.get(coord) !== wallType) {
        tempBoard.set(coord, wallType as EdgeElement);

        const myPath = await this.getShortestPathOf(this.player, tempBoard);
        const newOpponentPath = await this.getShortestPathOf(
          this.getOpponent(),
          tempBoard
        );

        // If we've blocked the opponent completely, remove the wall and continue
        if (myPath === null || newOpponentPath === null) {
          tempBoard.set(coord, " ");
          continue;
        }

        try {
          const score = await this.calculateScore(tempBoard);
          if (score > bestScore) {
            bestScore = score;
            bestWalls = [coord];
          } else if (score === bestScore) {
            bestWalls.push(coord);
          }
        } catch (error) {
          console.error(error);
        }
      }
    }

    // If there are multiple walls with the same score, pick one randomly
    const bestWall =
      bestWalls.length > 0
        ? bestWalls[Math.floor(Math.random() * bestWalls.length)]
        : null;

    return bestWall;
  };

  private getShortestPathMinusXWalls = async (
    x: number,
    player: PlayerColor,
    board: Board
  ): Promise<Coord[] | null> => {
    if (x < 0) {
      return Promise.reject("x less than 0 somehow");
    }
    if (x == 0) {
      return this.getShortestPathOf(player, board);
    }

    const allWalls = await this.game.getWallLocations();
    const walls = allWalls[player];
    if (x > walls.length) {
      return this.getShortestPathMinusXWalls(x - 1, player, board);
    }

    let boardCopy: Board = board.copy();
    const wallCombinations: Coord[][] = this.generateWallCombinations(walls, x);

    let bestPathLength: number = Infinity;
    let bestPath: Coord[] | null = null;

    for (let combination of wallCombinations) {
      for (let wall of combination) {
        boardCopy.set(wall, " ");
      }

      const path: Coord[] | null = await this.getShortestPathOf(
        player,
        boardCopy
      );
      if (path && path.length < bestPathLength) {
        bestPathLength = path.length;
        bestPath = path;
      }

      boardCopy = board.copy();
    }
    return bestPath;
  };

  private getShortestPathOf = async (
    player: PlayerColor,
    board: Board = this.textBoard.getBoardForTesting()
  ): Promise<Coord[] | null> => {
    const playerLocation = await this.game.playerLocation(player);
    const endLocation = await this.game.endLocation(player);

    return this.pathfinder.shortestPath(playerLocation, endLocation, board);
  };

  private printShortestPath = async () => {
    this.getShortestPathOf(this.player).then((result) => console.log(result));
  };

  private generateWallCombinations = (walls: Coord[], x: number): Coord[][] => {
    if (x === 0) return [[]];
    if (x > walls.length) return [];

    const [first, ...rest] = walls;
    const withFirst: Coord[][] = this.generateWallCombinations(rest, x - 1).map(
      (walls) => [first, ...walls]
    );
    const withoutFirst: Coord[][] = this.generateWallCombinations(rest, x);

    let combinations: Coord[][] = [...withFirst, ...withoutFirst];
    return this.shuffle(combinations);
  };

  private shuffle<T>(array: T[]): T[] {
    let currentIndex: number = array.length;
    let randomIndex: number;

    while (currentIndex !== 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;

      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex],
        array[currentIndex],
      ];
    }
    return array;
  }

  private isCoordInArray = (coord: Coord, array: Coord[]): boolean => {
    return array.some(
      (item) => item.row === coord.row && item.col === coord.col
    );
  };

  private allValidWallCoords(): Coord[] {
    let validWalls: Coord[] = [];

    const width = this.textBoard.getWidth();
    const height = this.textBoard.getHeight();

    for (let row = 0; row < 2 * height + 1; row++) {
      for (let col = 0; col < 2 * width + 1; col++) {
        const coord: Coord = { row, col };

        if (
          !isBorderEdge(coord, width, height) &&
          this.textBoard.getBoardForTesting().get(coord) !== "#" &&
          (this.player === "red"
            ? isVerticalEdge(coord)
            : isHorizontalEdge(coord))
        ) {
          validWalls.push(coord);
        }
      }
    }

    return validWalls;
  }

  private getOpponent() {
    return this.player === "red" ? "blue" : "red";
  }

  private printHelper(): void {
    // this.printShortestPath();
    // this.calculateScore()
    //   .then((score) => console.log("score:", score))
    //   .catch((err) => console.error(err));
    // this.bestMovement()
    //   .then((move) => console.log("move:", move[0]))
    //   .catch((err) => console.error(err));
    // this.bestXWallPlacements(3)
    //   .then((walls) => console.log("wall additions", walls))
    //   .catch((err) => console.error(err, "!!!!"));
    // this.bestXWallRemovals(2)
    //   .then((walls) => console.log("wall removals", walls))
    //   .catch((err) => console.error(err));
    // this.printShortestPath();
  }

  dispose() {
    this.unsubscribePlayer();
    this.unsubscribeWall();
  }
}
