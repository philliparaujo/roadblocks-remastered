import { GameClient } from "../GameClient";

describe("Test /newGame", () => {
  it("returns gameId and sessionId", async () => {
    const sut = new GameClient();

    const before = sut.getStateForTesting();
    expect(before.sessionId).toBeUndefined();
    expect(before.gameId).toBeUndefined();

    await sut.newGame("John");

    const after = sut.getStateForTesting();
    expect(after.sessionId).not.toBeUndefined();
    expect(after.gameId).not.toBeUndefined();

    console.log("sessionId:", after.sessionId, "gameId:", after.gameId);
  });

  it("throws error when creating with no name", async () => {
    const sut = new GameClient();

    const before = sut.getStateForTesting();
    expect(before.sessionId).toBeUndefined();
    expect(before.gameId).toBeUndefined();

    await expect(sut.newGame("")).rejects.toThrow();
  });
});

describe("Test /joinGame", () => {
  let sut: GameClient;
  beforeEach(async () => {
    sut = new GameClient();
    await sut.newGame("John");
  });

  it("returns correct gameId and sessionId", async () => {
    const before = sut.getStateForTesting();
    const beforeSessionId = before.sessionId;
    const beforeGameId = before.gameId;

    if (!beforeGameId) throw new Error("gameId started undefined?");

    await sut.joinGame(beforeGameId, "Jane");

    const after = sut.getStateForTesting();
    expect(after.gameId).toEqual(beforeGameId);
    expect(after.sessionId).not.toEqual(beforeSessionId);
  });

  it("throws error when joining with invalid gameId", async () => {
    await expect(sut.joinGame("invalid-game-id", "Jane")).rejects.toThrow();
  });

  it("throws error when joining with proper game id and no name", async () => {
    const before = sut.getStateForTesting();
    const beforeGameId = before.gameId;

    if (!beforeGameId) throw new Error("gameId started undefined?");

    await expect(sut.joinGame(beforeGameId, "")).rejects.toThrow();
  });
});

// describe("Test /addEdge", () => {
//   let sut: Client;
//   beforeEach(async () => {
//     sut = new Client();
//     await sut.newGame("John");
//   });

//   it("returns success when adding proper red edge", async () => {
//     const result = await sut.addEdge({ row: 1, col: 4 });
//     expect(result).toBeDefined();
//     expect(result).toEqual({});
//   });
// });
