import { GameImpl } from "../FakeGame";
import SessionManager, { GameNotFoundError } from "../SessionManager";
import { Game } from "@roadblocks/types";

describe("Test create", () => {
  it("returns sessionId and gameId", async () => {
    const sessionManager = new SessionManager();
    const { sessionId, gameId } = sessionManager.create("John");
    expect(sessionId).toBeDefined();
    expect(gameId).toBeDefined();
  });

  it("throws an error when no name is provided", () => {
    const sessionManager = new SessionManager();
    expect(() => {
      sessionManager.create("");
    }).toThrowError("Player name is required");
  });

  it("gameId and sessionId are not equal", () => {
    const sessionManager = new SessionManager();
    const { sessionId, gameId } = sessionManager.create("John");
    expect(gameId).not.toEqual(sessionId);
  });
});

describe("Test join", () => {
  const sessionManager = new SessionManager();

  const sessionId1: string = "iWillNeverWriteThis";
  const name: string = "Improbable Name";
  const gameId: string = "1111111111111234";
  const game: Game = new GameImpl();

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
    const { sessionId } = sessionManager.join(gameId, "Jane");
    expect(sessionId).toBeDefined();
    expect(sessionId).not.toEqual(sessionId1);
  });

  it("returns an error when no name is provided", async () => {
    expect(() => {
      sessionManager.join(gameId, "");
    }).toThrowError("Player name is required");
  });

  it("returns an error when no gameId is provided", async () => {
    expect(() => {
      sessionManager.join("", "Jane");
    }).toThrowError("Game ID is required");
  });

  it("returns an error when gameId doesn't already exist", async () => {
    expect(gameId).not.toEqual("foo");
    expect(() => {
      sessionManager.join("foo", "Jane");
    }).toThrowError(GameNotFoundError);
  });

  describe("Test delete", () => {
    const sessionId1: string = "iWillNeverWriteThis";
    const name: string = "Improbable Name";
    const gameId: string = "1111111111111234";
    const game: Game = new GameImpl();

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
    const game: Game = new GameImpl();

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
      const game2 = sessionManager.get(sessionId1);
      expect(game2).toEqual(game);
    });

    it("throws error if session does not exist", async () => {
      expect(() => {
        sessionManager.get("foo");
      }).toThrowError("Session with given ID doesn't exist");
    });
  });
});
