import {
  Coord,
  EdgeResult,
  Game,
  JoinGameResult,
  NewGameResult,
} from "@roadblocks/types";
import { logResults } from "./logger";

import {
  DiceRollEventSubscription,
  DiceRollSubscriber,
} from "./subscribers/DiceRollSubscriber";
import {
  LockWallEventSubscription,
  LockWallSubscriber,
} from "./subscribers/LockWallSubscriber";
import {
  NumWallChangesEventSubscription,
  NumWallChangesSubscriber,
} from "./subscribers/NumWallChangesSubscriber";
import {
  PlayerEventSubscription,
  PlayerMovedSubscriber,
} from "./subscribers/PlayerMovedSubscriber";
import {
  StartGameEventSubscription,
  StartGameSubscriber,
} from "./subscribers/StartGameSubscriber";
import { SwitchTurnSubscriber } from "./subscribers/SwitchTurnSubscriber";
import { WallToggledSubscriber } from "./subscribers/WallToggledSubscriber";
import {
  WinGameEventSubscription,
  WinGameSubscriber,
} from "./subscribers/WinGameSubscriber";

export const serviceURL = "http://localhost:5000";

interface GameControl {
  newGame: (playerName: string) => Promise<void>;
  joinGame: (gameId: string, playerName: string) => Promise<void>;
  addEdge: (coord: Coord) => Promise<EdgeResult>;
  removeEdge: (coord: Coord) => Promise<EdgeResult>;
}

export class Client implements Game, GameControl {
  playerMovedSubscriptions = new PlayerMovedSubscriber();
  switchTurnSubscriptions = new SwitchTurnSubscriber();
  wallToggledSubscriptions = new WallToggledSubscriber();
  lockWallSubscriptions = new LockWallSubscriber();
  diceRollSubscriptions = new DiceRollSubscriber();
  winGameSubscriptions = new WinGameSubscriber();
  startGameSubscriptions = new StartGameSubscriber();
  numWallChangesSubscriptions = new NumWallChangesSubscriber();

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

  addEdge = (coord: Coord): Promise<EdgeResult> =>
    myPost<EdgeResult>("addEdge", { coord, sessionId: this.sessionId }).then(
      () => {
        return Promise.resolve({});
      }
    );

  removeEdge = (coord: Coord): Promise<EdgeResult> =>
    myPost<EdgeResult>("removeEdge", { coord, sessionId: this.sessionId }).then(
      () => {
        return Promise.resolve({});
      }
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

  playerMovedEventSubscription = (): PlayerEventSubscription =>
    this.playerMovedSubscriptions;

  switchTurnEventSubscription = (): SwitchTurnSubscriber =>
    this.switchTurnSubscriptions;

  wallToggledEventSubscription = (): WallToggledSubscriber =>
    this.wallToggledSubscriptions;

  lockWallEventSubscription = (): LockWallEventSubscription =>
    this.lockWallSubscriptions;

  diceRollEventSubscription = (): DiceRollEventSubscription =>
    this.diceRollSubscriptions;

  winGameEventSubscription = (): WinGameEventSubscription =>
    this.winGameSubscriptions;

  startGameEventSubscription = (): StartGameEventSubscription =>
    this.startGameSubscriptions;

  numWallChangesEventSubscription = (): NumWallChangesEventSubscription =>
    this.numWallChangesSubscriptions;
}

function myPost<T>(action: string, body: any): Promise<T> {
  console.log("trying", action);
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

export function myGet<T>(urlExtension: string | URL): Promise<T> {
  const url: URL = new URL(urlExtension, serviceURL);

  return fetch(url.toString())
    .then((res) => {
      if (!res.ok) {
        throw new Error(`Failed ${res.status}: ${res.statusText}`);
      }
      return res;
    })
    .then((results) => results.json())
    .then(logResults(urlExtension.toString()));
}
