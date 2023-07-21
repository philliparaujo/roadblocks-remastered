import { CellElement } from "../components/UI/Board/Cell";
import { Game } from "./Game";
import {
  PlayerEventSubscription,
  SubscribePlayerEvent,
} from "./PlayerMovedSubscriber";
import { Printer, TextBoard } from "./TextBoard";
import {
  SubscribeWallEvent,
  WallToggledEventSubscription,
} from "./WallToggledSubscriber";

jest.mock("./Game");

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
      getInitialWallLocations: jest.fn(() => {
        return Promise.resolve([]);
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

describe("TextBoard", () => {
  let game: Partial<Game>;
  let subPlayer: jest.Mock;
  let subWalls: jest.Mock;
  let printer: CapturePrinter;

  let sut: TextBoard;

  beforeEach(async () => {
    ({ game, subPlayer, subWalls } = factory());
    printer = new CapturePrinter();
    sut = await TextBoard.create(game as Game, printer.capture.bind(printer));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("Subscribers are called when the TextBoard is created", async () => {
    expect(subPlayer).toBeCalledTimes(1);
    expect(subWalls).toBeCalledTimes(1);
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

  test("Printer items are working", async () => {
    printer.items = []; // clear printer items

    subPlayer.mock.calls[0][0]({
      from: { row: 0, col: 0 },
      to: { row: 1, col: 1 },
      player: "red",
    });

    expect(printer.items.length).toBe(1); // check if printer has printed
  });

  test("TextBoard updates its internal board based on player move", async () => {
    // player moves
    subPlayer.mock.calls[0][0]({
      from: { row: 7, col: 1 },
      to: { row: 7, col: 3 },
      player: "red",
    });

    // check if player has moved on the internal board
    let board = sut.getBoard();
    expect(board[7][3]).toContain("r");
    expect(board[7][1]).not.toContain("r");
  });

  test("TextBoard updates its internal board based on wall ", async () => {
    // simulate a wall addition
    subWalls.mock.calls[0][0]({
      wall: { row: 7, col: 2 },
      isToggled: true,
    });

    // check if wall is added on the internal board
    let board = sut.getBoard();
    expect(board[7][2]).toBe("|");
  });
});
