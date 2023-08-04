import { Client } from "../src/client";

describe("Test /newgame", () => {
  it("returns gameId and sessionId", async () => {
    const sut = new Client();

    const before = sut.getStateForTesting();
    expect(before.sessionId).toBeUndefined();
    expect(before.gameId).toBeUndefined();

    await sut.newgame("John");

    const after = sut.getStateForTesting();
    expect(after.sessionId).not.toBeUndefined();
    expect(after.gameId).not.toBeUndefined();

    console.log("sessionId:", after.sessionId, "gameId:", after.gameId);
  });
});

describe("Test /joingame", () => {
  let sut: Client;
  beforeEach(async () => {
    sut = new Client();
    await sut.newgame("John");
  });

  it("returns correct gameId and sessionId", async () => {
    const before = sut.getStateForTesting();
    const beforeSessionId = before.sessionId;
    const beforeGameId = before.gameId;

    await sut.joingame(beforeGameId, "Jane");

    const after = sut.getStateForTesting();
    expect(after.gameId).toEqual(beforeGameId);
    expect(after.sessionId).not.toEqual(beforeSessionId);
  });

  it("throws error when joining with invalid gameId", async () => {
    await expect(sut.joingame("invalid-game-id", "Jane")).rejects.toThrow();
  });
});

describe("Test /testValue", () => {
  let sut: Client;
  beforeEach(async () => {
    sut = new Client();
    await sut.newgame("John");
  });

  it("returns game value after creating game", async () => {
    const value = await sut.value();
    expect(value).toBeGreaterThanOrEqual(0);
    expect(value).toBeLessThanOrEqual(1);
  });
});
