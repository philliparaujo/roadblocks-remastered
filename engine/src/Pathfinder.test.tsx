import { BoardImpl } from "@roadblocks/types";
import { PathfinderImpl } from "./Pathfinder";

describe("pathfinder test", () => {
  it("returns no path for simple wrong example", async () => {
    const board = new BoardImpl(7, 7);
    board.addToCell({ row: 7, col: 1 }, "r");
    board.addToCell({ row: 7, col: 13 }, "R");

    board.set({ row: 7, col: 2 }, "#");
    board.set({ row: 6, col: 1 }, "-");
    board.set({ row: 8, col: 1 }, "-");

    board.dump(console.log);

    console.log(
      PathfinderImpl.shortestPath(
        { row: 7, col: 1 },
        { row: 7, col: 13 },
        board
      )
    );
  });
});
