import { fail } from "assert";
import Board from "./Board";
import { GameImpl } from "./Game";

describe("board printout", () => {
  test("print to console", () => {
    const b = new Board(4, 6);
    b.dump(console.log);
  });

  test("print to console", async () => {
    const b = new Board(7, 7);
    await b.initFromGame(new GameImpl(7, 7));
    b.dump(console.log);
  });

  test("print to console", () => {
    const b = new Board(2, 2);
    b.dump(console.log);
  });
});
