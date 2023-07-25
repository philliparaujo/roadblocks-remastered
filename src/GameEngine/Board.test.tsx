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
    const g = new GameImpl(7, 7);
    await g.lockWalls();

    await g.setPlayerLocation({ row: 5, col: 1 });
    await g.setPlayerLocation({ row: 7, col: 1 });
    await g.setPlayerLocation({ row: 7, col: 3 });
    await g.setPlayerLocation({ row: 7, col: 5 });
    await g.setPlayerLocation({ row: 5, col: 5 });
    await g.setPlayerLocation({ row: 5, col: 7 });
    await g.setPlayerLocation({ row: 5, col: 9 });
    await g.setPlayerLocation({ row: 5, col: 11 });
    await g.setPlayerLocation({ row: 5, col: 13 });
    await g.setPlayerLocation({ row: 7, col: 13 });
    await b.initFromGame(g);

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
