import { Coord } from "../Coord";
import { equalCoords } from "../Utils";
import { CellElement } from "../components/Board/Cell";
import { Game, GameImpl, GameState, PlayerColor } from "./Game";
import { NPCImpl } from "./NPC";
import {
  PlayerEventSubscription,
  PlayerMovedSubscriber,
} from "./PlayerMovedSubscriber";
import { SwitchTurnEventSubscription } from "./SwitchTurnSubscriber";
import { WallToggledEventSubscription } from "./WallToggledSubscriber";

interface TestGame extends Game {
  state: Partial<GameState>;
  winGame: jest.Mock<any, any>;
}

describe("NPC", () => {
  let game: Partial<TestGame>;
  let npc: NPCImpl;

  beforeEach(async () => {
    let subPlayer = jest.fn();
    let subWalls = jest.fn();
    let subTurn = jest.fn();

    game = {
      state: {
        turn: "red",
        width: 7,
        height: 7,
        playerLocations: { red: { row: 7, col: 1 }, blue: { row: 1, col: 7 } },
        endLocations: { red: { row: 7, col: 13 }, blue: { row: 13, col: 7 } },
        playerMovedSubscriptions: new PlayerMovedSubscriber(),
      },

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
      switchTurnEventSubscription: (): SwitchTurnEventSubscription => {
        return {
          subscribe: subTurn,
        };
      },

      playerLocation: jest.fn((player: PlayerColor) => {
        if (game.state?.playerLocations) {
          return Promise.resolve(game.state.playerLocations[player]);
        } else {
          return Promise.reject("Game playerLocations is undefined");
        }
      }),

      endLocation: jest.fn((player: PlayerColor) => {
        if (game.state?.endLocations) {
          return Promise.resolve(game.state.endLocations[player]);
        } else {
          return Promise.reject("Game endLocations is undefined");
        }
      }),

      switchTurn: jest.fn(() => {
        if (game && game.state) {
          game.state.turn = game.state?.turn === "red" ? "blue" : "red";

          return Promise.resolve({});
        } else {
          return Promise.reject("Game state is undefined");
        }
      }),

      setPlayerLocation: jest.fn((coord: Coord) => {
        const player = game.state?.turn;
        if (!player) {
          return Promise.reject("game state turn is undefined");
        }
        const oldLocation = game.state?.playerLocations?.[player];
        const subscriptions = game.state?.playerMovedSubscriptions;
        const end = game.state?.endLocations?.[player];

        if (!oldLocation || !subscriptions || !end) {
          return Promise.reject(
            "Some necessary properties are undefined in game"
          );
        }

        game.state!.playerLocations![player] = coord;
        subscriptions.notify({ player: player!, from: oldLocation, to: coord });

        if (equalCoords(coord, end)) {
          game.winGame?.();
        }

        return Promise.resolve({});
      }),

      getTurn: jest.fn(() => {
        if (game.state && game.state.turn) {
          return Promise.resolve(game.state.turn);
        } else {
          return Promise.reject("Game state or turn is undefined");
        }
      }),

      winGame: jest.fn(),
    };

    npc = await NPCImpl.create(game as TestGame, "red");
  });

  test("Score starts at 0", async () => {
    expect(await npc.calculateScore()).toBe(0);
  });

  test("Score is positive when close to winning", async () => {
    if (game.setPlayerLocation) {
      await game.setPlayerLocation({ row: 7, col: 3 });
      await game.setPlayerLocation({ row: 7, col: 5 });
      await game.setPlayerLocation({ row: 7, col: 7 });
      await game.setPlayerLocation({ row: 7, col: 9 });
      await game.setPlayerLocation({ row: 7, col: 11 });
      expect(await npc.calculateScore()).toBeGreaterThan(0);
    }
  });

  test("Score is negative when far from winning", async () => {
    if (game.setPlayerLocation) {
      await game.setPlayerLocation({ row: 5, col: 1 });
      await game.setPlayerLocation({ row: 3, col: 1 });
      await game.setPlayerLocation({ row: 1, col: 1 });
      expect(await npc.calculateScore()).toBeLessThan(0);
    }
  });

  test("Score is negative when walls in the way", async () => {
    if (game.addEdge) {
      await game.addEdge({ row: 7, col: 2 });
      await game.addEdge({ row: 5, col: 2 });
      await game.addEdge({ row: 9, col: 2 });
      expect(await npc.calculateScore()).toBeLessThan(0);
    }
  });

  test("Score is negative when opponent close to winning", async () => {
    if (game.setPlayerLocation && game.switchTurn) {
      await game.switchTurn();
      await game.setPlayerLocation({ row: 3, col: 7 });
      await game.setPlayerLocation({ row: 5, col: 7 });
      await game.setPlayerLocation({ row: 7, col: 7 });
      await game.setPlayerLocation({ row: 9, col: 7 });
      await game.setPlayerLocation({ row: 11, col: 7 });
      expect(npc.calculateScore()).resolves.toBeLessThan(0);
    }
  });

  test("Score is increased when blocking direct opponent path", async () => {
    if (game.setPlayerLocation && game.switchTurn && game.addEdge) {
      await game.switchTurn();
      await game.setPlayerLocation({ row: 3, col: 7 });
      await game.setPlayerLocation({ row: 5, col: 7 });
      await game.setPlayerLocation({ row: 7, col: 7 });
      await game.setPlayerLocation({ row: 9, col: 7 });
      await game.setPlayerLocation({ row: 11, col: 7 });
      const directPathScore = await npc.calculateScore();

      await game.addEdge({ row: 12, col: 7 });
      const newPathScore = await npc.calculateScore();

      expect(newPathScore).tobeGreaterThan(directPathScore);
    }
  });
});
