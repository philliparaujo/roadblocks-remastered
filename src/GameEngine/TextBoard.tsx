import { Coord } from "../Coord";
import { EdgeType, Orientation } from "../components/UI/Board/Edge";
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

type Board = Row[];
type Row = BoardElement[];
type BoardElement = CornerElement | EdgeElement | CellElement;
type CornerElement = "+";
type EdgeElement = " " | "|" | "-" | "#";
type CellElement = Array<RedPlayer | BluePlayer | RedEnd | BlueEnd>;

type RedPlayer = "r";
type BluePlayer = "b";
type RedEnd = "R";
type BlueEnd = "B";

export type Printer = (message?: any, ...optionalParams: any[]) => void;

export class TextBoard {
  private printer: Printer;
  private game: Game;
  private board: Board = [];
  private unsubscribeToWallToggled: (() => void) | undefined;
  private unsubscribeToPlayerMoved: (() => void) | undefined;

  private constructor(game: Game, printer: Printer) {
    this.game = game;
    this.printer = printer;
    this.updatePlayer = this.updatePlayer.bind(this);
    this.updateWalls = this.updateWalls.bind(this);
  }

  public static async create(
    game: Game = GameInstance,
    printer: Printer
  ): Promise<TextBoard> {
    const textBoard = new TextBoard(game, printer);
    await textBoard.initializeBoard();
    await textBoard.setInitialLocations();

    textBoard.subscribeToPlayerMoved(textBoard.updatePlayer);
    textBoard.subscribeToWallToggled(textBoard.updateWalls);

    return textBoard;
  }

  public getBoard(): Board {
    return this.board;
  }

  /* Private methods */

  private async initializeBoard(): Promise<void> {
    const height = await this.game.getHeight();
    const width = await this.game.getWidth();

    for (let i = 0; i < 2 * height + 1; i++) {
      const row: Row = [];
      for (let j = 0; j < 2 * width + 1; j++) {
        const coord: Coord = { row: i, col: j };
        if (isCorner(coord)) {
          const corner: CornerElement = "+";
          row.push(corner);
        } else if (isCell(coord)) {
          const cell: CellElement = [];
          row.push(cell);
        } else {
          const edge: EdgeElement = " ";
          row.push(edge);
        }
      }
      this.board.push(row);
    }
  }

  private async setInitialLocations(): Promise<void> {
    const redPlayerCoord: Coord = await this.game.getInitialCellLocation(
      "redplayer"
    );
    const redplayer: RedPlayer = "r";
    this.modifyCell(redPlayerCoord, (cell) => cell.push(redplayer));

    const bluePlayerCoord: Coord = await this.game.getInitialCellLocation(
      "blueplayer"
    );
    const blueplayer: BluePlayer = "b";
    this.modifyCell(bluePlayerCoord, (cell) => cell.push(blueplayer));

    const redEndCoord: Coord = await this.game.getInitialCellLocation("redend");
    const redend: RedEnd = "R";
    this.modifyCell(redEndCoord, (cell) => cell.push(redend));

    const blueEndCoord: Coord = await this.game.getInitialCellLocation(
      "blueend"
    );
    const blueend: BlueEnd = "B";
    this.modifyCell(blueEndCoord, (cell) => cell.push(blueend));

    const wallLocations = await this.game.getInitialWallLocations();
    for (const wall of wallLocations) {
      this.board[wall.row][wall.col] = "#";
    }
  }

  private async updateWalls(e: WallToggledEvent): Promise<void> {
    const coord: Coord = e.wall;
    const wallValue: EdgeElement = !e.isToggled
      ? " "
      : isVerticalEdge(coord)
      ? "|"
      : "-";
    this.board[coord.row][coord.col] = wallValue;

    this.print();
  }

  private async updatePlayer(e: PlayerMovedEvent): Promise<void> {
    const prevCoord: Coord = e.from;
    const cell: CellElement = this.board[prevCoord.row][
      prevCoord.col
    ] as CellElement;

    if (Array.isArray(cell)) {
      const index = cell.indexOf(e.player === "red" ? "r" : "b");
      if (index > -1) {
        cell.splice(index, 1);
      }
    }

    const newCoord: Coord = e.to;
    const newCell: CellElement = this.board[newCoord.row][
      newCoord.col
    ] as CellElement;
    if (Array.isArray(newCell)) {
      newCell.push(e.player === "red" ? "r" : "b");
    }

    this.print();
  }

  private modifyCell(
    coord: Coord,
    modifier: (cell: CellElement) => void
  ): void {
    const cell: CellElement = this.board[coord.row][coord.col] as CellElement;
    if (Array.isArray(cell)) {
      modifier(cell);
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

  private print() {
    this.printer(this.getBoard());
  }
}
