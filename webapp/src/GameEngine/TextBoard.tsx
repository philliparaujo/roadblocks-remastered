import { Coord, isVerticalEdge } from "@roadblocks/engine";
import BoardImpl, { CellElement, EdgeElement } from "./Board";
import GameInstance, { Game } from "./Game";
import {
  PlayerMovedEvent,
  PlayerMovedEventCallback,
} from "./PlayerMovedSubscriber";
import {
  WallToggledEvent,
  WallToggledEventCallback,
} from "./WallToggledSubscriber";

export type Printer = (message?: any, ...optionalParams: any[]) => void;

export class TextBoard {
  private printer: Printer;
  private game: Game;
  private board: BoardImpl;
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
    this.board = new BoardImpl(width, height);
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

  public getBoardForTesting(): BoardImpl {
    const board: BoardImpl = this.board.copy();
    // console.log(board);
    return board;
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
    this.board.set(coord, wallValue);
  }

  private async updatePlayer(e: PlayerMovedEvent): Promise<void> {
    const prevCoord: Coord = e.from;
    const prevElement: CellElement = this.board.get(prevCoord) as CellElement;

    if (Array.isArray(prevElement)) {
      const index = prevElement.indexOf(e.player === "red" ? "r" : "b");
      if (index > -1) {
        prevElement.splice(index, 1);
      }
    } else {
      this.board.set(prevCoord, " ");
    }

    const newCoord: Coord = e.to;
    const newCell: CellElement = this.board.get(newCoord) as CellElement;
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
