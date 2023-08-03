import { Game } from "@roadblocks/types";
import { logResults } from "./logger";

const serviceURL = "http://localhost:5000";

export class Client implements Game {
  sessionId: string | undefined;
  gameId: string | undefined;

  constructor() {
    this.sessionId = undefined;
    this.gameId = undefined;
  }

  newgame = (playerName: string): Promise<void> =>
    fetch(`${serviceURL}/newgame`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        playerName: playerName,
      }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed ${res.status}: ${res.statusText}`);
        }
        return res;
      })
      .then((results) => results.json())
      .then(logResults("new game"))
      .then((results) => {
        this.gameId = results.gameId;
        this.sessionId = results.sessionId;
      });

  value = (): Promise<number> =>
    fetch(`${serviceURL}/testValue?sessionId=${this.sessionId}`)
      .then((response) => response.json())
      .then(logResults("value"))
      .then((json) => json.value);

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
