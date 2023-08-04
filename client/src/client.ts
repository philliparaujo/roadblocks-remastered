import {
  Game,
  JoinGameResult,
  NewGameResult,
  ValueResult,
} from "@roadblocks/types";
import { logResults } from "./logger";

const serviceURL = "http://localhost:5000";

interface GameControl {
  newGame: (playerName: string) => Promise<void>;
  joinGame: (gameId: string, playerName: string) => Promise<void>;
  value: () => Promise<number>;
}

export class Client implements Game, GameControl {
  sessionId: string | undefined;
  gameId: string | undefined;

  constructor() {
    this.sessionId = undefined;
    this.gameId = undefined;
  }

  newGame = (playerName: string): Promise<void> =>
    myPost<NewGameResult>("newGame", { playerName }).then((results) => {
      this.gameId = results.gameId;
      this.sessionId = results.sessionId;
    });

  joinGame = (gameId: string, playerName: string): Promise<void> =>
    myPost<JoinGameResult>("joinGame", { gameId, playerName }).then(
      (results) => {
        this.gameId = gameId;
        this.sessionId = results.sessionId;
      }
    );

  value = (): Promise<number> =>
    myFetch<ValueResult>(`testValue?sessionId=${this.sessionId}`).then(
      (results) => results.value
    );

  getStateForTesting = (): {
    sessionId: string | undefined;
    gameId: string | undefined;
  } => {
    return {
      sessionId: this.sessionId,
      gameId: this.gameId,
    };
  };
}

function myPost<T>(action: string, body: any): Promise<T> {
  return fetch(`${serviceURL}/${action}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })
    .then((res) => {
      if (!res.ok) {
        throw new Error(`Failed ${res.status}: ${res.statusText}`);
      }
      return res;
    })
    .then((results) => results.json())
    .then(logResults(action));
}

function myFetch<T>(urlExtension: string): Promise<T> {
  return fetch(`${serviceURL}/${urlExtension}`)
    .then((res) => {
      if (!res.ok) {
        throw new Error(`Failed ${res.status}: ${res.statusText}`);
      }
      return res;
    })
    .then((results) => results.json())
    .then(logResults(urlExtension));
}
