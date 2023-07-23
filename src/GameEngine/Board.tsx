import { Coord } from "../Coord";
import { isCell, isCorner } from "../Utils";
import { Game, WallLocations } from "./Game";

export type EdgeElement = " " | "|" | "-" | "#";
type Row = BoardElement[];
export type BoardElement = CornerElement | EdgeElement | CellElement;
export type CornerElement = "+";
export type CellElement = Array<RedPlayer | BluePlayer | RedEnd | BlueEnd>;

export type RedPlayer = "r";
export type BluePlayer = "b";
export type RedEnd = "R";
export type BlueEnd = "B";

export default class Board {
  private items: Row[] = [];
  private width: number;
  private height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;

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
      this.items.push(row);
    }
  }

  get(coord: Coord) {
    return this.items[coord.row][coord.col];
  }

  set(coord: Coord, value: BoardElement) {
    this.items[coord.row][coord.col] = value;
  }

  addToCell(coord: Coord, value: RedPlayer | BluePlayer | RedEnd | BlueEnd) {
    const cellElement = this.get(coord);

    if (!(cellElement instanceof Array)) {
      throw new Error(
        "The specified coordinate does not contain a CellElement"
      );
    }

    this.set(coord, [...cellElement, value]);
  }

  removeFromCell(
    coord: Coord,
    value: RedPlayer | BluePlayer | RedEnd | BlueEnd
  ) {
    const cellElement = this.get(coord);

    if (!(cellElement instanceof Array)) {
      throw new Error(
        "The specified coordinate does not contain a CellElement"
      );
    }

    this.set(
      coord,
      cellElement.filter((element) => element !== value)
    );
  }

  getWidth() {
    return this.width;
  }

  getHeight() {
    return this.height;
  }

  copy(): Board {
    const newBoard: Board = new Board(this.getWidth(), this.getHeight());
    newBoard.items = JSON.parse(JSON.stringify(this.items));
    return newBoard;
  }

  async initFromGame(game: Game): Promise<void> {
    const redPlayerCoord: Coord = await game.getInitialCellLocation(
      "redplayer"
    );
    const redplayer: RedPlayer = "r";
    this.addToCell(redPlayerCoord, redplayer);

    const bluePlayerCoord: Coord = await game.getInitialCellLocation(
      "blueplayer"
    );
    const blueplayer: BluePlayer = "b";
    this.addToCell(bluePlayerCoord, blueplayer);

    const redEndCoord: Coord = await game.getInitialCellLocation("redend");
    const redend: RedEnd = "R";
    this.addToCell(redEndCoord, redend);

    const blueEndCoord: Coord = await game.getInitialCellLocation("blueend");
    const blueend: BlueEnd = "B";
    this.addToCell(blueEndCoord, blueend);

    const wallLocations = await game.getWallLocations();
    for (const wall of wallLocations.locked) {
      this.set(wall, "#");
    }
  }
}
