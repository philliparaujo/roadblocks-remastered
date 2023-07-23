import { Coord } from "../Coord";
import { EdgeType, Orientation } from "../components/Board/Edge";
import { isCell, isCorner, isHorizontalEdge, isVerticalEdge } from "../Utils";
import GameInstance, { Game } from "./Game";
import {
  PlayerMovedEvent,
  PlayerMovedEventCallback,
} from "./PlayerMovedSubscriber";
import {
  WallToggledEvent,
  WallToggledEventCallback,
} from "./WallToggledSubscriber";
import Board, {
  BlueEnd,
  BluePlayer,
  BoardElement,
  CellElement,
  EdgeElement,
  RedEnd,
  RedPlayer,
} from "./Board";

export type Printer = (message?: any, ...optionalParams: any[]) => void;

export class TextBoard {
  private printer: Printer;
  private game: Game;
  private board: Board;
  private width: number;
  private height: number;
  private unsubscribeToWallToggled: (() => void) | undefined;
  private unsubscribeToPlayerMoved: (() => void) | undefined;

  private constructor(
    game: Game,
    printer: Printer,
    width: number,
    height: number
  ) {
    this.game = game;
    this.width = width;
    this.height = height;
    this.printer = printer;
    this.board = new Board(width, height);
    this.updatePlayer = this.updatePlayer.bind(this);
    this.updateWalls = this.updateWalls.bind(this);
  }

  public static async create(
    game: Game = GameInstance,
    printer: Printer
  ): Promise<TextBoard> {
    const height = await game.getHeight();
    const width = await game.getWidth();

    const textBoard = new TextBoard(game, printer, width, height);

    await textBoard.board.initFromGame(game);

    textBoard.subscribeToPlayerMoved(textBoard.updatePlayer);
    textBoard.subscribeToWallToggled(textBoard.updateWalls);

    return textBoard;
  }

  public getBoardForTesting(): Board {
    return this.board;
  }

  public getWidth(): number {
    return this.width;
  }

  public getHeight(): number {
    return this.height;
  }

  public print() {
    this.printer(this.getBoardForTesting());
  }

  /* Private methods */
  private async updateWalls(e: WallToggledEvent): Promise<void> {
    const coord: Coord = e.wall;
    const wallValue: EdgeElement = !e.isToggled
      ? " "
      : isVerticalEdge(coord)
      ? "|"
      : "-";
    this.board.setByCoord(coord, wallValue);
  }

  private async updatePlayer(e: PlayerMovedEvent): Promise<void> {
    const prevCoord: Coord = e.from;
    const prevElement: CellElement = this.board.getByCoord(
      prevCoord
    ) as CellElement;

    if (Array.isArray(prevElement)) {
      console.log("IN HERE 1");
      const index = prevElement.indexOf(e.player === "red" ? "r" : "b");
      if (index > -1) {
        console.log("IN HERE 2");
        prevElement.splice(index, 1);
      }
    } else {
      this.board.setByCoord(prevCoord, " ");
    }

    const newCoord: Coord = e.to;
    const newCell: CellElement = this.board.getByCoord(newCoord) as CellElement;
    if (Array.isArray(newCell)) {
      newCell.push(e.player === "red" ? "r" : "b");
    }
  }

  /* Subscription handling */

  private subscribeToWallToggled(callback: WallToggledEventCallback): void {
    this.unsubscribeToWallToggled = this.game
      .wallToggledEventSubscription()
      .subscribe(callback);
  }

  private subscribeToPlayerMoved(callback: PlayerMovedEventCallback): void {
    this.unsubscribeToPlayerMoved = this.game
      .playerMovedEventSubscription()
      .subscribe(callback);
  }

  public dispose() {
    if (this.unsubscribeToWallToggled) {
      this.unsubscribeToWallToggled();
    }
    if (this.unsubscribeToPlayerMoved) {
      this.unsubscribeToPlayerMoved();
    }
  }
}
