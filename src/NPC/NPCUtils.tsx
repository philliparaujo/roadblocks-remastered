import { Coord } from "../Coord";
import Board, { EdgeElement } from "../GameEngine/Board";
import { Game, PlayerColor, WallLocations } from "../GameEngine/Game";
import { PathfinderImpl } from "../GameEngine/Pathfinder";
import { TextBoard } from "../GameEngine/TextBoard";
import {
  averageCoord,
  equalCoords,
  isBorderEdge,
  isHorizontalEdge,
  isVerticalEdge,
} from "../Utils";
import { score } from "./NPC";

export class NPCUtils {
  private player: PlayerColor;
  private textBoard: TextBoard;
  private game: Game;

  constructor(player: PlayerColor, textBoard: TextBoard, game: Game) {
    this.player = player;
    this.textBoard = textBoard;
    this.game = game;
  }

  /* Simple Utils */
  isMyTurn = async (): Promise<boolean> => {
    const turn = await this.game.getTurn();
    return turn === this.player;
  };

  getOpponent = (): PlayerColor => (this.player === "red" ? "blue" : "red");

  getShortestPathOf = async (
    player: PlayerColor,
    board: Board = this.textBoard.getBoardForTesting()
  ): Promise<Coord[] | null> => {
    const playerLocation = await this.game.playerLocation(player);
    const endLocation = await this.game.endLocation(player);

    return PathfinderImpl.shortestPath(playerLocation, endLocation, board);
  };

  getShortestPathMinusXWalls = async (
    x: number,
    player: PlayerColor,
    board: Board,
    myWalls: Coord[]
  ): Promise<Coord[] | null> => {
    if (x < 0) {
      return Promise.reject("x less than 0 somehow");
    }
    if (x == 0) {
      return this.getShortestPathOf(player, board);
    }
    if (x > myWalls.length) {
      return this.getShortestPathMinusXWalls(x - 1, player, board, myWalls);
    }

    let boardCopy: Board = board.copy();
    const wallCombinations: Coord[][] = this.generateWallCombinations(
      myWalls,
      x
    );

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

  printShortestPath = async () => {
    this.getShortestPathOf(this.player).then((result) => console.log(result));
  };

  isCoordInArray = (coord: Coord, array: Coord[]): boolean => {
    return array.some(
      (item) => item.row === coord.row && item.col === coord.col
    );
  };

  shuffle<T>(array: T[]): T[] {
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

  generateWallCombinations = (walls: Coord[], x: number): Coord[][] => {
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

  allValidWallCoords = (): Coord[] => {
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
  };

  /* Score-related Utils */
  bestSingleWallPlacement = async (
    board: Board,
    calculateScore: (board: Board) => Promise<score>
  ): Promise<Coord | null> => {
    const opponentPath = await this.getShortestPathOf(
      this.getOpponent(),
      board
    );

    let bestWall = await this.highestScoreWallOnOpponentPath(
      board,
      opponentPath,
      calculateScore
    );
    if (bestWall == null) {
      bestWall = await this.highestScoreWall(board, calculateScore);
    }

    return bestWall;
  };

  bestSingleWallRemoval = async (
    board: Board,
    myWalls: Coord[],

    calculateScore: (board: Board) => Promise<score>
  ): Promise<Coord | null> => {
    let bestScore = -Infinity;
    let bestWall: Coord | null = null;

    for (let wallCoord of myWalls) {
      const originalValue = board.get(wallCoord);
      board.set(wallCoord, " "); // Remove the wall

      try {
        const score = await calculateScore(board);
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

  highestScoreWallOnOpponentPath = async (
    board: Board,
    opponentPath: Coord[] | null,

    calculateScore: (board: Board) => Promise<score>
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
          const score = await calculateScore(tempBoard);
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

  highestScoreWall = async (
    board: Board,

    calculateScore: (board: Board) => Promise<score>
  ) => {
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
          const score = await calculateScore(tempBoard);
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
}
