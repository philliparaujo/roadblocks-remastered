import {
  Game,
  JoinGameResult,
  NewGameResult,
  ValueResult,
} from "@roadblocks/types";
import { logResults } from "./logger";

const serviceURL = "http://localhost:5000";

interface GameControl {
  newgame: (playerName: string) => Promise<void>;
  joingame: (gameId: string, playerName: string) => Promise<void>;
  value: () => Promise<number>;
}

export class Client implements Game, GameControl {
  sessionId: string | undefined;
  gameId: string | undefined;

  constructor() {
    this.sessionId = undefined;
    this.gameId = undefined;
  }

  newgame = (playerName: string): Promise<void> =>
    myPost<NewGameResult>("newgame", { playerName }).then((results) => {
      this.gameId = results.gameId;
      this.sessionId = results.sessionId;
    });

  joingame = (gameId: string, playerName: string): Promise<void> =>
    myPost<JoinGameResult>("joingame", { gameId, playerName }).then(
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
