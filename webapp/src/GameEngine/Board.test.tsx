import {
  PlayerEventSubscription,
  WallToggledEventSubscription,
} from "@roadblocks/engine";
import { CellElement } from "../components/Board/Cell";
import { Board, createFromGame, createStandalone } from "./Board";
import { Game, GameImpl } from "./Game";

describe("board printout", () => {
  test("print to console", () => {
    const b = createStandalone(4, 6);
    b.dump(console.log);
  });

  test("print to console", async () => {
    const b = await createFromGame(new GameImpl(7, 7));
    b.dump(console.log);
    b.dispose();
  });

  test("print to console", () => {
    const b = createStandalone(2, 2);
    b.dump(console.log);
  });
});

class CapturePrinter {
  items: any[] = [];

  capture(...args: any[]) {
    this.items.push(args);
  }
}

const factory = (): {
  game: Partial<Game>;
  subPlayer: jest.Mock;
  subWalls: jest.Mock;
} => {
  let subPlayer = jest.fn();
  let subWalls = jest.fn();

  return {
    game: {
      getHeight: jest.fn().mockResolvedValue(Promise.resolve(7)),
      getWidth: jest.fn().mockResolvedValue(Promise.resolve(7)),
      getInitialCellLocation: jest.fn((cellElement: CellElement) => {
        switch (cellElement) {
          case "redplayer":
            return Promise.resolve({ row: 7, col: 1 });
          case "blueplayer":
            return Promise.resolve({ row: 1, col: 7 });
          case "redend":
            return Promise.resolve({ row: 7, col: 13 });
          case "blueend":
            return Promise.resolve({ row: 13, col: 7 });
        }
      }),
      getWallLocations: jest.fn(() => {
        return Promise.resolve({ red: [], blue: [], locked: [] });
      }),
      playerMovedEventSubscription: (): PlayerEventSubscription => {
        return {
          subscribe: subPlayer,
        };
      },
      wallToggledEventSubscription: (): WallToggledEventSubscription => {
        return {
          subscribe: subWalls,
        };
      },
    },
    subPlayer: subPlayer,
    subWalls: subWalls,
  };
};

describe("board sync", () => {
  let game: Partial<Game>;
  let subPlayer: jest.Mock;
  let subWalls: jest.Mock;
  let printer: CapturePrinter;

  let sut: Board;

  beforeEach(async () => {
    ({ game, subPlayer, subWalls } = factory());
    printer = new CapturePrinter();
    if (game) {
      sut = await createFromGame(game as Game);
    }
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("Subscriber callbacks are called when the events are notified", async () => {
    // Simulate the event notifications
    subPlayer.mock.calls[0][0]({
      from: { row: 0, col: 0 },
      to: { row: 1, col: 1 },
      player: "red",
    });

    subWalls.mock.calls[0][0]({
      wall: { row: 0, col: 0 },
      isToggled: true,
    });

    expect(subPlayer).toBeCalledTimes(1);
    expect(subWalls).toBeCalledTimes(1);
  });

  test("Board updates its internal board based on player move", async () => {
    // player moves
    subPlayer.mock.calls[0][0]({
      from: { row: 7, col: 1 },
      to: { row: 7, col: 3 },
      player: "red",
    });

    // check if player has moved on the internal board
    expect(sut.get({ row: 7, col: 3 })).toContain("r");
    expect(sut.get({ row: 7, col: 1 })).not.toContain("r");
  });

  test("Board updates its internal board based on wall ", async () => {
    // simulate a wall addition
    subWalls.mock.calls[0][0]({
      wall: { row: 7, col: 2 },
      isToggled: true,
    });

    // check if wall is added on the internal board
    expect(sut.get({ row: 7, col: 2 })).toBe("|");
  });
});
