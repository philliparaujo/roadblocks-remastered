import { Coord } from "../components/UI/Board/Coord";
import { EdgeType, Orientation } from "../components/UI/Board/Edge";
import {
  isCell,
  isCorner,
  isHorizontalEdge,
  isVerticalEdge,
} from "../components/Utils";
import GameInstance, { Game } from "./Game";
import {
  WallToggledEvent,
  WallToggledEventCallback,
} from "./WallToggledSubscriber";

type Board = Row[];
type Row = BoardElement[];
type BoardElement = CornerElement | EdgeElement | CellElement;
type CornerElement = "+";
type EdgeElement = " " | "|" | "-" | "#";
type CellElement = " " | RedPlayer | BluePlayer | RedEnd | BlueEnd;

type RedPlayer = "r";
type BluePlayer = "b";
type RedEnd = "R";
type BlueEnd = "B";

export class TextBoard {
  private game: Game;
  private board: Board = [];
  private unsubscribe: (() => void) | undefined;

  private constructor(game: Game) {
    this.game = game;
    this.unsubscribe = () => {
      console.error("subscription not set up");
    };
  }

  public static async create(game: Game = GameInstance) {
    console.log("creating");
    const textBoard = new TextBoard(game);
    await textBoard.initializeBoard();
    await textBoard.setInitialLocations();
    const wallToggledCallback: WallToggledEventCallback = (
      event: WallToggledEvent
    ) => {
      console.log("wall placed at", event.wall);
      textBoard.updateBoard(event);
      console.log(textBoard.getBoard());
    };
    textBoard.subscribeToWallToggled(wallToggledCallback);
    return textBoard;
  }

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
          const cell: CellElement = " ";
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
    const bluePlayerCoord: Coord = await this.game.getInitialCellLocation(
      "blueplayer"
    );
    const redEndCoord: Coord = await this.game.getInitialCellLocation("redend");
    const blueEndCoord: Coord = await this.game.getInitialCellLocation(
      "blueend"
    );

    const redplayer: RedPlayer = "r";
    this.board[redPlayerCoord.row][redPlayerCoord.col] = redplayer;
    const blueplayer: BluePlayer = "b";
    this.board[bluePlayerCoord.row][bluePlayerCoord.col] = blueplayer;
    const redend: RedEnd = "R";
    this.board[redEndCoord.row][redEndCoord.col] = redend;
    const blueend: BlueEnd = "B";
    this.board[blueEndCoord.row][blueEndCoord.col] = blueend;

    const wallLocations = await this.game.getInitialWallLocations();
    for (const wall of wallLocations) {
      this.board[wall.row][wall.col] = "#";
    }
  }

  public async updateBoard(callback: WallToggledEvent): Promise<void> {
    const coord: Coord = callback.wall;
    const wallValue: EdgeElement = !callback.isToggled
      ? " "
      : isVerticalEdge(coord)
      ? "|"
      : "-";
    this.board[coord.row][coord.col] = wallValue;
  }

  public getBoard(): Board {
    return this.board;
  }

  private subscribeToWallToggled(callback: WallToggledEventCallback): void {
    this.unsubscribe = this.game
      .wallToggledEventSubscription()
      .subscribe(callback);
  }

  public dispose() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}
