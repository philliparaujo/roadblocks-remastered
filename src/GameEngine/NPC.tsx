import { Coord } from "../Coord";
import { Game, PlayerColor } from "./Game";
import { PathfinderImpl } from "./Pathfinder";
import { isHorizontalEdge, isVerticalEdge } from "../Utils";
import Board, { EdgeElement } from "./Board";
import { TextBoard } from "./TextBoard";

type score = number;

/* eventually remove */
interface NPC {
  updateWalls: () => Promise<Coord[]>;
  updatePlayer: () => Promise<Coord[]>;
  isMyTurn: () => Promise<boolean>;
  calculateScore: () => Promise<score>;
}

export class NPCImpl implements NPC {
  game: Game;
  player: PlayerColor;
  textBoard: TextBoard;
  pathfinder: PathfinderImpl;
  weightFn: (i: number) => number;

  private unsubscribeWall: () => void;
  private unsubscribePlayer: () => void;
  private unsubscribeSwitchTurn: () => void;

  private constructor(game: Game, player: PlayerColor, textBoard: TextBoard) {
    this.game = game;
    this.player = player;
    this.textBoard = textBoard;
    this.pathfinder = new PathfinderImpl();
    this.weightFn = (i: number) => 1 / (i + 1);

    // this.printShortestPath();

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
      .subscribe((e) => {
        if (e.turn === player) {
          this.play();
        }
      });

    // this.game.getTurn().then((result) => {
    //   if (result == this.player) {
    //     this.play();
    //   }
    // });
  }

  private printHelper(): void {
    // this.printShortestPath();
    this.calculateScore()
      .then((score) => console.log("score:", score))
      .catch((err) => console.error(err));
    this.updatePlayer()
      .then((move) => console.log("move:", move[0]))
      .catch((err) => console.error(err));
    this.updateWalls()
      .then((wall) => console.log("wall addition", wall[0]))
      .catch((err) => console.error(err));
  }

  static async create(game: Game, player: PlayerColor): Promise<NPCImpl> {
    const textBoard: TextBoard = await TextBoard.create(game, console.log);
    return Promise.resolve(new NPCImpl(game, player, textBoard));
  }

  /* Public methods */

  private play = (): void => {
    console.log("playing");
  };

  public updateWalls = async (): Promise<Coord[]> => {
    let wallPositions: Coord[] = [];
    let bestScore: number = -Infinity;

    for (let row = 0; row < this.textBoard.getHeight(); row++) {
      for (let col = 0; col < this.textBoard.getWidth(); col++) {
        const coord: Coord = { row, col };

        if (
          this.player === "red"
            ? isVerticalEdge(coord)
            : isHorizontalEdge(coord)
        ) {
          const board: Board = this.textBoard.getBoardForTesting();

          if (board.get({ row: row, col: col }) !== "#") {
            let wallType = this.player === "red" ? "|" : "-";
            let tempBoard: Board = board.copy();

            board.get(coord) === "#" || board.get(coord) === wallType
              ? tempBoard.set(coord, " ")
              : tempBoard.set(coord, wallType as EdgeElement);

            let score: score = await this.calculateScore(tempBoard);
            if (score > bestScore) {
              bestScore = score;
              wallPositions = [coord];
            } else if (score === bestScore) {
              wallPositions.push(coord);
            }
          }
        }
      }
    }

    if (wallPositions.length === 0) {
      return Promise.reject("No valid positions for a wall.");
    }
    return Promise.resolve(this.shuffle(wallPositions));
  };

  public updatePlayer = async (): Promise<Coord[]> => {
    const path = await this.getShortestPathOf(this.player);
    if (path) {
      return path.length <= 1
        ? Promise.reject("Already won?")
        : Promise.resolve([path[1]]);
    } else {
      return Promise.reject("No path?");
    }
  };

  public isMyTurn = async (): Promise<boolean> => {
    const turn = await this.game.getTurn();
    return turn === this.player;
  };

  public calculateScore = async (
    board: Board = this.textBoard.getBoardForTesting()
  ): Promise<score> => {
    const opponentColor = this.player === "red" ? "blue" : "red";
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
      } else {
        return Promise.reject("one of the two players has no valid path");
      }
    }

    let finalScore: number = 0;
    for (let i = 0; i < scoreVariations.length; i++) {
      let weight: number = this.weightFn(i);
      finalScore += scoreVariations[i] * weight;
    }

    return Promise.resolve(finalScore);
  };

  /* Private methods */
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

  dispose() {
    this.unsubscribePlayer();
    this.unsubscribeWall();
  }
}
