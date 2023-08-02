import { v4 as uuidv4 } from "uuid";
import { Game, GameImpl } from "./FakeGame";

type Session = { sessionId: string; name: string; gameId: string; game: Game };

export class GameNotFoundError extends Error {
  constructor(gameId: string) {
    super(gameId);
    this.name = "GameNotFoundError";
  }
}

export interface SessionManager {
  create: (name: string) => { sessionId: string; gameId: string };
  join: (gameId: string, name: string) => { sessionId: string };
  delete: (sessionId: string) => void;
  get: (sessionId: string) => Game;
}

class SessionManagerImpl implements SessionManager {
  private sessions: Session[];

  constructor() {
    this.sessions = [];
  }

  create(name: string): { sessionId: string; gameId: string } {
    if (!name) throw new Error("Player name is required");
    if (typeof name !== "string")
      throw new Error("Player name must be a string");

    const sessionId: string = uuidv4();
    const gameId: string = uuidv4();

    const session: Session = {
      sessionId: sessionId,
      name: name,
      gameId: gameId,
      game: new GameImpl(),
    };

    this.sessions.push(session);
    // console.log("Created session", sessionId, ".");
    return { sessionId, gameId };
  }

  join(gameId: string, name: string): { sessionId: string } {
    if (!name) throw new Error("Player name is required");
    if (typeof name !== "string")
      throw new Error("Player name must be a string");

    if (!gameId) throw new Error("Game ID is required");
    if (typeof gameId !== "string") throw new Error("Game ID must be a string");

    const sessionToJoin = this.sessions.find(
      (session) => session.gameId === gameId
    );

    // var g: GameNotFound = {gameId: gameId};
    if (!sessionToJoin) throw new GameNotFoundError(gameId);

    const sessionId: string = uuidv4();
    const session: Session = {
      sessionId: sessionId,
      name: name,
      gameId: gameId,
      game: sessionToJoin.game,
    };

    this.sessions.push(session);
    return { sessionId };
  }

  delete(sessionId: string): void {
    this.sessions = this.sessions.filter(
      (session) => session.sessionId != sessionId
    );
  }

  get(sessionId: string): Game {
    const session: Session | undefined = this.sessions.find(
      (session) => session.sessionId == sessionId
    );
    if (!session) throw new Error("Session with given ID doesn't exist");
    return session.game;
  }

  getSessionsForTesting(): Session[] {
    return this.sessions;
  }
}

export default SessionManagerImpl;
