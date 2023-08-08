import {
  Coord,
  CoordResult,
  DiceRollEvent,
  EdgeResult,
  EndTurnResult,
  Game,
  GetHeightResult,
  GetWidthResult,
  JoinGameResult,
  LockWallResult,
  NewGameResult,
  PlayerColor,
  PlayerLocation,
  PlayerMovedResult,
  WallLocations,
  WallLocationsResult,
} from "@roadblocks/types";
import { logResults } from "./logger";
import {
  DiceRollSubscriberClient,
  LockWallSubscriberClient,
  NumWallChangesSubscriberClient,
  PlayerMovedSubscriberClient,
  StartGameSubscriberClient,
  SwitchTurnSubscriberClient,
  WallToggledSubscriberClient,
  WinGameSubscriberClient,
} from "./PubSubClient";

export const serviceURL = "http://localhost:5000";

export interface GameControl {
  newGame: (playerName: string) => Promise<void>;
  joinGame: (gameId: string, playerName: string) => Promise<void>;
  addEdge: (coord: Coord) => Promise<EdgeResult>;
  removeEdge: (coord: Coord) => Promise<EdgeResult>;
}

export class GameClient implements Game, GameControl {
  playerMovedSubscriptions = new PlayerMovedSubscriberClient();
  switchTurnSubscriptions = new SwitchTurnSubscriberClient();
  wallToggledSubscriptions = new WallToggledSubscriberClient();
  lockWallSubscriptions = new LockWallSubscriberClient();
  diceRollSubscriptions = new DiceRollSubscriberClient();
  winGameSubscriptions = new WinGameSubscriberClient();
  startGameSubscriptions = new StartGameSubscriberClient();
  numWallChangesSubscriptions = new NumWallChangesSubscriberClient();

  sessionId: string | undefined;
  gameId: string | undefined;

  constructor() {
    this.sessionId = undefined;
    this.gameId = undefined;
  }

  gameInProgress = (): Promise<boolean> =>
    Promise.resolve(this.sessionId !== undefined);

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
    this.sessionPost<EdgeResult>("addEdge", { coord }).then(() => {
      return Promise.resolve({});
    });

  removeEdge = (coord: Coord): Promise<EdgeResult> =>
    this.sessionPost<EdgeResult>("removeEdge", { coord }).then(() => {
      return Promise.resolve({});
    });

  getWidth = (): Promise<number> =>
    this.sessionGet<GetWidthResult>("getWidth").then((result) => {
      return result.width;
    });

  getHeight = (): Promise<number> =>
    this.sessionGet<GetHeightResult>("getHeight").then((result) => {
      return result.height;
    });

  getCellLocation = (player: PlayerLocation): Promise<Coord> =>
    this.sessionGet<CoordResult>(`getCellLocation?player=${player}`).then(
      (result) => {
        return result.coord;
      }
    );

  getWallLocations = (): Promise<WallLocations> =>
    this.sessionGet<WallLocationsResult>("getWallLocations").then((result) => {
      return result.locations;
    });

  // TODO: PROPERLY IMPLEMENT

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

  playerMovedEventSubscription = (): PlayerMovedSubscriberClient =>
    this.playerMovedSubscriptions;

  switchTurnEventSubscription = (): SwitchTurnSubscriberClient =>
    this.switchTurnSubscriptions;

  wallToggledEventSubscription = (): WallToggledSubscriberClient =>
    this.wallToggledSubscriptions;

  lockWallEventSubscription = (): LockWallSubscriberClient =>
    this.lockWallSubscriptions;

  diceRollEventSubscription = (): DiceRollSubscriberClient =>
    this.diceRollSubscriptions;

  winGameEventSubscription = (): WinGameSubscriberClient =>
    this.winGameSubscriptions;

  startGameEventSubscription = (): StartGameSubscriberClient =>
    this.startGameSubscriptions;

  numWallChangesEventSubscription = (): NumWallChangesSubscriberClient =>
    this.numWallChangesSubscriptions;

  startSubscribers = (sessionId: string): void => {
    this.wallToggledSubscriptions.start(sessionId);
  };

  // Perform a post to a specific session on the server side
  sessionPost<T>(action: string, body: any): Promise<T> {
    return myPost<T>(action, { ...body, sessionId: this.sessionId });
  }
  // Perform a get to a specific session on the server side
  sessionGet<T>(endPoint: string): Promise<T> {
    return myGet<T>(endPoint, this.sessionId);
  }
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

export function myGet<T>(
  urlExtension: string | URL,
  sessionId?: string
): Promise<T> {
  if (!sessionId) {
    return Promise.reject("sessionId is missing");
  }

  const url: URL = new URL(urlExtension, serviceURL);
  url.searchParams.set("sessionId", sessionId);

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
