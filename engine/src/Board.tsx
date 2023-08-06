import {
  Coord,
  PlayerColor,
  black,
  blue,
  bold,
  dim,
  green,
  red,
  white,
} from "@roadblocks/types";
import { isCell, isCorner, isEdge } from "./Utils";

export type Printer = (message?: any, ...optionalParams: any[]) => void;

export type EdgeElement = " " | "|" | "-" | "#";
type Row = BoardElement[];
export type BoardElement = CornerElement | EdgeElement | CellElement;
export type CornerElement = "+";
export type CellElement = Array<RedPlayer | BluePlayer | RedEnd | BlueEnd>;

export type RedPlayer = "r";
export type BluePlayer = "b";
export type RedEnd = "R";
export type BlueEnd = "B";

export interface Board {
  width: number;
  height: number;

  get: (coord: Coord) => BoardElement;
  set: (coord: Coord, value: BoardElement) => void;
  addToCell: (
    coord: Coord,
    value: RedPlayer | BluePlayer | RedEnd | BlueEnd
  ) => void;
  removeFromCell: (
    coord: Coord,
    value: RedPlayer | BluePlayer | RedEnd | BlueEnd
  ) => void;

  copy: () => Board;

  countWalls: (player: PlayerColor) => number;
  compareEdges: (oldBoard: Board) => number;

  dump: (printer: Printer) => void;
}

export class BoardImpl implements Board {
  private items: Row[] = [];
  width: number;
  height: number;

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

  public get(coord: Coord) {
    return this.items[coord.row][coord.col];
  }

  public set(coord: Coord, value: BoardElement) {
    this.items[coord.row][coord.col] = value;
  }

  public addToCell(
    coord: Coord,
    value: RedPlayer | BluePlayer | RedEnd | BlueEnd
  ) {
    const cellElement = this.get(coord);

    if (!(cellElement instanceof Array)) {
      throw new Error(
        "The specified coordinate does not contain a CellElement"
      );
    }

    this.set(coord, [...cellElement, value]);
  }

  public removeFromCell(
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

  public copy(): Board {
    const newBoard: BoardImpl = new BoardImpl(this.width, this.height);
    newBoard.items = this.deepCopy(this.items);
    return newBoard;
  }

  private deepCopy(items: any[]): any[] {
    let copy: Row[] = [];
    for (let i = 0; i < items.length; i++) {
      if (Array.isArray(items[i])) {
        copy[i] = this.deepCopy(items[i]);
      } else {
        copy[i] = items[i];
      }
    }
    return copy;
  }

  public dump(printer: Printer) {
    let result: string[][] = [];

    // result.push("\u001b[90m┏";

    /* top row */
    result.push(
      this.createRow("┏━", "━━━", "━┳━", "━━━━┓", 2 * this.width - 1, 0)
    );

    for (let i = 1; i < this.height; i++) {
      result.push(
        this.createRow(
          "┃ ",
          "   ",
          " ┃ ",
          "    ┃",
          2 * this.width - 1,
          2 * i - 1
        )
      );
      result.push(
        this.createRow("┣", "━━━━━", "╋", "━━━━━┫", 2 * this.width - 1, 2 * i)
      );
    }

    result.push(
      this.createRow(
        "┃ ",
        "   ",
        " ┃ ",
        "    ┃",
        2 * this.width - 1,
        2 * this.height - 1
      )
    );

    /* bottom row */
    result.push(
      this.createRow(
        "┗",
        "━━━━━",
        "┻",
        "━━━━━┛",
        2 * this.width - 1,
        2 * this.height
      )
    );

    const resultString: string = result
      .map((row) => row.map((element) => element).join(""))
      .join("");

    printer(resultString);
  }

  private createRow(
    startChar: string,
    firstLoopChar: string,
    secondLoopChar: string,
    endChar: string,
    count: number,
    rowNumber: number
  ): string[] {
    let paddedRowNumber: string = rowNumber.toString().padStart(3, "0");

    let row: string[] = [];
    row.push(paddedRowNumber);
    row.push(white(dim(startChar)));
    // let row = chalk.white.dim(startChar);

    for (let colNumber = 1; colNumber < count; colNumber++) {
      const coord: Coord = { row: rowNumber, col: colNumber };

      if (colNumber % 2 === 1) {
        if (isEdge(coord)) {
          if (this.items[rowNumber][colNumber] === "#") {
            row.push(black(bold(firstLoopChar)));
          } else if (this.items[rowNumber][colNumber] === "-") {
            row.push(blue(bold(firstLoopChar)));
          } else {
            row.push(white(dim(firstLoopChar)));
          }
        } else if (isCell(coord)) {
          if (this.items[rowNumber][colNumber].length > 0) {
            let cell = "";
            for (let element of this.items[rowNumber][colNumber]) {
              cell += element;
            }
            row.push(green(bold(cell.padStart(3, " "))));
          } else {
            row.push(green(bold(firstLoopChar)));
          }
        } else if (isCorner(coord)) {
          row.push(white(dim(firstLoopChar)));
        }
        // row.push(chalk.white.dim(firstLoopChar);
      } else {
        if (isEdge(coord)) {
          if (this.items[rowNumber][colNumber] === "#") {
            row.push(black(bold(secondLoopChar)));
          } else if (this.items[rowNumber][colNumber] === "|") {
            row.push(red(bold(secondLoopChar)));
          } else {
            row.push(white(dim(secondLoopChar)));
          }
        } else if (isCell(coord)) {
          if (this.items[rowNumber][colNumber].length > 0) {
            let cell = "";
            for (let element of this.items[rowNumber][colNumber]) {
              cell += element;
            }
            row.push(green(bold(cell.padStart(3, " "))));
          } else {
            row.push(green(bold(firstLoopChar)));
          }
        } else if (isCorner(coord)) {
          row.push(white(dim(secondLoopChar)));
        }
        // row.push(chalk.white.dim(secondLoopChar);
      }
    }

    if (
      isCell({ row: rowNumber, col: count }) &&
      this.items[rowNumber][count].length > 0
    ) {
      let cell = "";
      for (let element of this.items[rowNumber][count]) {
        cell += element;
      }
      row.push(green(bold(cell.padStart(3, " "))));
      row.push(white(dim(" " + endChar.charAt(4))));
    } else {
      row.push(white(dim(endChar)));
    }

    row.push("\n");
    return row;
  }

  public countWalls(player: PlayerColor): number {
    let numWalls = 0;
    const wallType = player === "red" ? "|" : "-";
    for (let i = 0; i < 2 * this.width + 1; i++) {
      for (let j = 0; j < 2 * this.height + 1; j++) {
        const element = this.get({ row: i, col: j });
        if (!Array.isArray(element) && element === wallType) {
          numWalls++;
        }
      }
    }
    return numWalls;
  }

  public compareEdges(oldBoard: Board): number {
    let diffCount = 0;
    for (let i = 0; i < 2 * this.width + 1; i++) {
      for (let j = 0; j < 2 * this.height + 1; j++) {
        const coord: Coord = { row: i, col: j };
        const element = this.get(coord);
        const oldElement = oldBoard.get(coord);
        if (isEdge(coord) && element !== oldElement) {
          diffCount++;
        }
      }
    }
    return diffCount;
  }
}
