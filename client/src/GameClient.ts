import {
  Coord,
  DiceRollEvent,
  EdgeResult,
  EndTurnResult,
  Game,
  JoinGameResult,
  LockWallResult,
  NewGameResult,
  PlayerColor,
  PlayerLocation,
  PlayerMovedResult,
  WallLocations,
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
import {
  WinGameEventSubscription,
  WinGameSubscriber,
} from "./subscribers/WinGameSubscriber";
import { WallToggledSubscriberClient } from "./PubSubClient";

export const serviceURL = "http://localhost:5000";

export interface GameControl {
  newGame: (playerName: string) => Promise<void>;
  joinGame: (gameId: string, playerName: string) => Promise<void>;
  addEdge: (coord: Coord) => Promise<EdgeResult>;
  removeEdge: (coord: Coord) => Promise<EdgeResult>;
}

export class GameClient implements Game, GameControl {
  playerMovedSubscriptions = new PlayerMovedSubscriber();
  switchTurnSubscriptions = new SwitchTurnSubscriber();
  wallToggledSubscriptions = new WallToggledSubscriberClient();
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
      this.startSubscribers(results.sessionId);
    });

  joinGame = (gameId: string, playerName: string): Promise<void> =>
    myPost<JoinGameResult>("joinGame", { gameId, playerName }).then(
      (results) => {
        this.gameId = gameId;
        this.sessionId = results.sessionId;
        this.startSubscribers(results.sessionId);
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

  // TODO: PROPERLY IMPLEMENT
  getWidth = (): Promise<number> => Promise.resolve(7);
  getHeight = (): Promise<number> => Promise.resolve(7);
  getInitialCellLocation = (player: PlayerLocation): Promise<Coord> =>
    Promise.resolve(
      player === "redplayer" ? { row: 1, col: 7 } : { row: 7, col: 1 }
    );
  getWallLocations = (): Promise<WallLocations> =>
    Promise.resolve({ red: [], blue: [], locked: [] });

  getDiceRolls = (player: PlayerColor): Promise<number[]> =>
    Promise.resolve([1, 2, 3, 4, 5, 6]);

  getTurn = (): Promise<PlayerColor> => Promise.resolve("red");
  canEndTurn = (): Promise<boolean> => Promise.resolve(false);
  pathExists = (player: PlayerColor): Promise<boolean> =>
    Promise.resolve(false);

  lockWalls = (): Promise<LockWallResult> => Promise.resolve({});

  switchTurn = (): Promise<EndTurnResult> => Promise.resolve({});

  setPlayerLocation = (coord: Coord): Promise<PlayerMovedResult> =>
    Promise.resolve({});

  getStateForTesting = (): {
    sessionId: string | undefined;
    gameId: string | undefined;
  } => {
    return {
      sessionId: this.sessionId,
      gameId: this.gameId,
    };
  };

  rollDice = (): Promise<DiceRollEvent> =>
    Promise.resolve(new DiceRollEvent(4));

  playerMovedEventSubscription = (): PlayerEventSubscription =>
    this.playerMovedSubscriptions;

  switchTurnEventSubscription = (): SwitchTurnSubscriber =>
    this.switchTurnSubscriptions;

  wallToggledEventSubscription = (): WallToggledSubscriberClient =>
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

  startSubscribers = (sessionId: string): void => {
    this.wallToggledSubscriptions.start(sessionId);
  };
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

export const GameInstance = new GameClient();
