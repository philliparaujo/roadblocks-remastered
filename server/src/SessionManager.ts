import { v4 as uuidv4 } from "uuid";
import {
  GameServerImpl as GameServer,
  GameServer as Game,
} from "@roadblocks/engine";
import { GameInfo } from "@roadblocks/types";

type Session = { sessionId: string; name: string; gameId: string; game: Game };

export var SessionManagerGameFactory = {
  create: (): Game => new GameServer(7, 7),
};

export interface SessionManager {
  create: (name: string) => Promise<{ sessionId: string; gameId: string }>;
  join: (gameId: string, name: string) => Promise<{ sessionId: string }>;
  delete: (sessionId: string) => Promise<void>;
  get: (sessionId: string) => Promise<Game>;
  listGames: () => Promise<GameInfo[]>;
}

class SessionManagerImpl implements SessionManager {
  private sessions: Session[];

  constructor() {
    this.sessions = [];
  }

  create(name: string): Promise<{ sessionId: string; gameId: string }> {
    if (!name) return Promise.reject("Player name is required");
    if (typeof name !== "string")
      return Promise.reject("Player name must be a string");

    const sessionId: string = uuidv4();
    const gameId: string = uuidv4();

    const session: Session = {
      sessionId: sessionId,
      name: name,
      gameId: gameId,
      game: SessionManagerGameFactory.create(), // TODO: receive width/height during new game
    };

    this.sessions.push(session);
    // console.log("Created session", sessionId, ".");
    return Promise.resolve({ sessionId, gameId });
  }

  join(gameId: string, name: string): Promise<{ sessionId: string }> {
    if (!name) return Promise.reject("Player name is required");
    if (typeof name !== "string")
      return Promise.reject("Player name must be a string");

    if (!gameId) return Promise.reject("Game ID is required");
    if (typeof gameId !== "string")
      return Promise.reject("Game ID must be a string");

    const sessionToJoin = this.sessions.find(
      (session) => session.gameId === gameId
    );

    // var g: GameNotFound = {gameId: gameId};
    if (!sessionToJoin) return Promise.reject(`Game not found ${gameId}`);

    const sessionId: string = uuidv4();
    const session: Session = {
      sessionId: sessionId,
      name: name,
      gameId: gameId,
      game: sessionToJoin.game,
    };

    this.sessions.push(session);
    return Promise.resolve({ sessionId });
  }

  delete(sessionId: string): Promise<void> {
    this.sessions = this.sessions.filter(
      (session) => session.sessionId != sessionId
    );
    return Promise.resolve();
  }

  get(sessionId: string): Promise<Game> {
    const session: Session | undefined = this.sessions.find(
      (session) => session.sessionId == sessionId
    );
    if (!session) return Promise.reject("Session with given ID doesn't exist");
    return Promise.resolve(session.game);
  }

  listGames = (): Promise<GameInfo[]> =>
    Promise.resolve(
      this.sessions
        .reduce((result: string[], current: Session) => {
          if (!result.includes(current.gameId)) {
            result.push(current.gameId);
          }
          return result;
        }, [])
        .map((gameId: string) => ({
          gameId,
          users: this.sessions
            .filter((session) => session.gameId === gameId)
            .map((session, index) => ({
              playerName: session.name,
              role: index === 0 ? "red" : index === 1 ? "blue" : "watcher",
            })),
        }))
    );

  getSessionsForTesting(): Session[] {
    return this.sessions;
  }
}

export default SessionManagerImpl;
