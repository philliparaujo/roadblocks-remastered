import { Coord } from "../Coord";
import { Game, PlayerColor } from "./Game";
import { TextBoard } from "./TextBoard";
import { PathfinderImpl } from "./Pathfinder";
import { isHorizontalEdge, isVerticalEdge } from "../Utils";

type score = number;

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

  private unsubscribeWall: () => void;
  private unsubscribePlayer: () => void;

  private constructor(game: Game, player: PlayerColor, textBoard: TextBoard) {
    this.game = game;
    this.player = player;
    this.textBoard = textBoard;
    this.pathfinder = new PathfinderImpl(this.textBoard);

    this.printShortestPath();

    this.unsubscribeWall = game
      .wallToggledEventSubscription()
      .subscribe(async (e) => {
        if (await this.isMyTurn()) {
          // this.printShortestPath();
          this.calculateScore()
            .then((score) => console.log(score))
            .catch((err) => console.error(err));
          this.updatePlayer()
            .then((move) => console.log(move[0]))
            .catch((err) => console.error(err));
          this.updateWalls()
            .then((wall) => console.log(wall[0]))
            .catch((err) => console.error(err));
        }
      });
    this.unsubscribePlayer = game
      .playerMovedEventSubscription()
      .subscribe(async (e) => {
        if (await this.isMyTurn()) {
          // this.printShortestPath();
          this.calculateScore()
            .then((score) => console.log(score))
            .catch((err) => console.error(err));
          this.updatePlayer()
            .then((move) => console.log(move[0]))
            .catch((err) => console.error(err));
          this.updateWalls()
            .then((wall) => console.log(wall[0]))
            .catch((err) => console.error(err));
        }
      });
  }

  static async create(game: Game, player: PlayerColor): Promise<NPCImpl> {
    const textBoard = await TextBoard.create(game, console.log);
    return new NPCImpl(game, player, textBoard);
  }

  /* Public methods */

  public updateWalls = async (): Promise<Coord[]> => {
    let validWallPositions: Coord[] = [];

    for (let row = 0; row < this.textBoard.getHeight(); row++) {
      for (let col = 0; col < this.textBoard.getWidth(); col++) {
        const coord: Coord = { row, col };

        if (
          this.player === "red"
            ? isVerticalEdge(coord)
            : isHorizontalEdge(coord)
        ) {
          if (!this.textBoard.isWall(coord)) {
            validWallPositions.push(coord);
          }
        }
      }
    }

    if (validWallPositions.length === 0) {
      return Promise.reject("No valid positions for a wall.");
    }
    const chosenWallPosition =
      validWallPositions[Math.floor(Math.random() * validWallPositions.length)];
    return Promise.resolve([chosenWallPosition]);
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

  public calculateScore = async (): Promise<score> => {
    const opponentColor = this.player === "red" ? "blue" : "red";

    const myPath = await this.getShortestPathOf(this.player);
    const opponentPath = await this.getShortestPathOf(opponentColor);

    if (myPath && opponentPath) {
      return Promise.resolve(opponentPath.length - myPath.length);
    } else {
      return Promise.reject("one of the two players has no valid path");
    }
  };

  /* Private methods */

  private getShortestPathOf = async (
    player: PlayerColor
  ): Promise<Coord[] | null> => {
    const playerLocation = await this.game.playerLocation(player);
    const endLocation = await this.game.endLocation(player);
    return this.pathfinder.shortestPath(
      playerLocation,
      endLocation,
      this.textBoard
    );
  };

  private printShortestPath = async () => {
    this.getShortestPathOf(this.player).then((result) => console.log(result));
  };

  dispose() {
    this.unsubscribePlayer();
    this.unsubscribeWall();
  }
}
