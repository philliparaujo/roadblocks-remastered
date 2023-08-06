import { GameServerImpl, GameServer as Game } from "@roadblocks/engine";
import SessionManager from "../SessionManager";

describe("Test create", () => {
  it("returns sessionId and gameId", async () => {
    const sessionManager = new SessionManager();
    const { sessionId, gameId } = await sessionManager.create("John");
    expect(sessionId).toBeDefined();
    expect(gameId).toBeDefined();
  });

  it("rejects promise when no name is provided", async () => {
    const sessionManager = new SessionManager();
    await expect(sessionManager.create("")).rejects.toMatch(
      "Player name is required"
    );
  });

  it("gameId and sessionId are not equal", async () => {
    const sessionManager = new SessionManager();
    const { sessionId, gameId } = await sessionManager.create("John");
    expect(gameId).not.toEqual(sessionId);
  });
});

describe("Test join", () => {
  const sessionManager = new SessionManager();

  const sessionId1: string = "iWillNeverWriteThis";
  const name: string = "Improbable Name";
  const gameId: string = "1111111111111234";
  const game: Game = new GameServerImpl(7, 7);

  beforeAll(async () => {
    const sessions = sessionManager.getSessionsForTesting();
    sessions.push({
      sessionId: sessionId1,
      name: name,
      gameId: gameId,
      game: game,
    });
  });

  it("returns sessionId", async () => {
    const { sessionId } = await sessionManager.join(gameId, "Jane");
    expect(sessionId).toBeDefined();
    expect(sessionId).not.toEqual(sessionId1);
  });

  it("rejects promise when no name is provided", async () => {
    await expect(sessionManager.join(gameId, "")).rejects.toMatch(
      "Player name is required"
    );
  });

  it("rejects promise when no gameId is provided", async () => {
    await expect(sessionManager.join("", "Jane")).rejects.toMatch(
      "Game ID is required"
    );
  });

  it("rejects promise when gameId doesn't already exist", async () => {
    expect(gameId).not.toEqual("foo");
    await expect(sessionManager.join("foo", "Jane")).rejects.toMatch(
      "Game not found"
    );
  });

  describe("Test delete", () => {
    const sessionId1: string = "iWillNeverWriteThis";
    const name: string = "Improbable Name";
    const gameId: string = "1111111111111234";
    const game: Game = new GameServerImpl(7, 7);

    beforeEach(async () => {
      const sessions = sessionManager.getSessionsForTesting();
      sessions.length = 0;
      sessions.push({
        sessionId: sessionId1,
        name: name,
        gameId: gameId,
        game: game,
      });
    });

    it("deletes a session that already exists", async () => {
      expect(sessionManager.getSessionsForTesting()).toHaveLength(1);
      sessionManager.delete(sessionId1);
      expect(sessionManager.getSessionsForTesting()).toHaveLength(0);
    });

    it("no error is thrown if session does not exist", async () => {
      expect(sessionManager.getSessionsForTesting()).toHaveLength(1);
      sessionManager.delete("foo");
      expect(sessionManager.getSessionsForTesting()).toHaveLength(1);
    });
  });

  describe("Test get", () => {
    const sessionId1: string = "iWillNeverWriteThis";
    const name: string = "Improbable Name";
    const gameId: string = "1111111111111234";
    const game: Game = new GameServerImpl(7, 7);

    beforeEach(async () => {
      const sessions = sessionManager.getSessionsForTesting();
      sessions.length = 0;
      sessions.push({
        sessionId: sessionId1,
        name: name,
        gameId: gameId,
        game: game,
      });
    });

    it("returns game", async () => {
      const game2 = await sessionManager.get(sessionId1);
      expect(game2).toEqual(game);
    });

    it("rejects promise if session does not exist", async () => {
      await expect(sessionManager.get("foo")).rejects.toMatch(
        "Session with given ID doesn't exist"
      );
    });
  });
});
