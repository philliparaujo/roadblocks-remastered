import { fail } from "assert";
import BoardImpl from "./Board";
import { GameImpl } from "./Game";

describe("board printout", () => {
  test("print to console", () => {
    const b = new BoardImpl(4, 6);
    b.dump(console.log);
  });

  test("print to console", async () => {
    const b = new BoardImpl(7, 7);
    await b.initFromGame(new GameImpl(7, 7));
    b.dump(console.log);
  });

  test("print to console", () => {
    const b = new BoardImpl(2, 2);
    b.dump(console.log);
  });
});
