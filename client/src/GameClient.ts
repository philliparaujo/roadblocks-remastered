import {
  Coord,
  CoordResult,
  DiceResult,
  DiceRollEvent,
  EdgeResult,
  EndTurnResult,
  Game,
  HeightResult,
  WidthResult,
  JoinGameResult,
  LockWallResult,
  NewGameResult,
  PlayerColor,
  PlayerLocation,
  PlayerMovedResult,
  WallLocations,
  WallLocationsResult,
  newGameRoute,
  joinGameRoute,
  addEdgeRoute,
  removeEdgeRoute,
  getWidthRoute,
  getHeightRoute,
  getCellLocationRoute,
  getWallLocationRoute,
  getDiceRoute,
  TurnResult,
  getTurnRoute,
  CanEndTurnResult,
  canEndTurnRoute,
  PathExistsResult,
  pathExistsRoute,
  lockWallsRoute,
  switchTurnRoute,
  setPlayerLocationRoute,
  DiceRollResult,
  rollDiceRoute,
  ResetTurnResult,
  resetTurnRoute,
  ListGamesResult,
  listGamesRoute,
} from "@roadblocks/types";
import { logResults } from "./logger";
import {
  DiceRollSubscriberClient,
  ErrorSubscriberClient,
  LockWallSubscriberClient,
  NumWallChangesSubscriberClient,
  PlayerMovedSubscriberClient,
  StartGameSubscriberClient,
  SwitchTurnSubscriberClient,
  WallToggledSubscriberClient,
  WinGameSubscriberClient,
} from "./PubSubClient";

export const serviceURL = process.env.SERVER_URL;

export interface GameControl {
  newGame: (playerName: string) => Promise<void>;
  joinGame: (gameId: string, playerName: string) => Promise<void>;
  addEdge: (coord: Coord) => Promise<EdgeResult>;
  removeEdge: (coord: Coord) => Promise<EdgeResult>;
  listGames: () => Promise<ListGamesResult>;
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
  errorSubscriptions = new ErrorSubscriberClient();

  sessionId: string | undefined;
  gameId: string | undefined;

  id: number = Math.floor(Math.random() * 100000000);

  constructor() {
    this.sessionId = undefined;
    this.gameId = undefined;

    console.log("created game instance", this.id);
  }

  gameInProgress = (): Promise<boolean> =>
    Promise.resolve(this.sessionId !== undefined);

  newGame = (playerName: string): Promise<void> =>
    myPost<NewGameResult>(newGameRoute, { playerName }).then((results) => {
      this.gameId = results.gameId;
      this.sessionId = results.sessionId;
      this.startSubscribers(results.sessionId);
    });

  joinGame = (gameId: string, playerName: string): Promise<void> =>
    myPost<JoinGameResult>(joinGameRoute, { gameId, playerName }).then(
      (results) => {
        this.gameId = gameId;
        this.sessionId = results.sessionId;
        this.startSubscribers(results.sessionId);
      }
    );

  listGames = (): Promise<ListGamesResult> =>
    myGet<ListGamesResult>(listGamesRoute, {});

  addEdge = (coord: Coord): Promise<EdgeResult> =>
    this.sessionPost<EdgeResult>(addEdgeRoute, { coord }).then(() => {
      return Promise.resolve({});
    });

  removeEdge = (coord: Coord): Promise<EdgeResult> =>
    this.sessionPost<EdgeResult>(removeEdgeRoute, { coord }).then(() => {
      return Promise.resolve({});
    });

  getWidth = (): Promise<number> =>
    this.sessionGet<WidthResult>(getWidthRoute).then((result) => {
      return result.width;
    });

  getHeight = (): Promise<number> =>
    this.sessionGet<HeightResult>(getHeightRoute).then((result) => {
      return result.height;
    });

  getCellLocation = (player: PlayerLocation): Promise<Coord> =>
    this.sessionGet<CoordResult>(getCellLocationRoute, { player }).then(
      (result) => {
        return result.coord;
      }
    );

  getWallLocations = (): Promise<WallLocations> =>
    this.sessionGet<WallLocationsResult>(getWallLocationRoute).then(
      (result) => {
        return result.locations;
      }
    );

  getDice = (player: PlayerColor): Promise<number[]> =>
    this.sessionGet<DiceResult>(getDiceRoute, { player }).then((result) => {
      return result.faces;
    });

  getTurn = (): Promise<PlayerColor> =>
    this.sessionGet<TurnResult>(getTurnRoute).then((result) => {
      return result.turn;
    });

  canEndTurn = (): Promise<boolean> =>
    this.sessionGet<CanEndTurnResult>(canEndTurnRoute).then((result) => {
      return result.canEndTurn;
    });

  pathExists = (player: PlayerColor): Promise<boolean> =>
    this.sessionGet<PathExistsResult>(pathExistsRoute, { player }).then(
      (result) => {
        return result.pathExists;
      }
    );

  lockWalls = (): Promise<LockWallResult> =>
    this.sessionPost(lockWallsRoute, {}).then(() => {
      return Promise.resolve({ locked: true });
    });

  switchTurn = (): Promise<EndTurnResult> =>
    this.sessionPost(switchTurnRoute, {}).then(() => {
      return Promise.resolve({});
    });

  setPlayerLocation = (coord: Coord): Promise<PlayerMovedResult> =>
    this.sessionPost<PlayerMovedResult>(setPlayerLocationRoute, { coord }).then(
      () => {
        return Promise.resolve({});
      }
    );

  rollDice = (): Promise<DiceRollResult> =>
    this.sessionPost<DiceRollResult>(rollDiceRoute, {}).then((result) => {
      return Promise.resolve({ diceValue: result.diceValue });
    });

  resetTurn = (): Promise<ResetTurnResult> =>
    this.sessionPost<ResetTurnResult>(resetTurnRoute, {}).then((result) => {
      return Promise.resolve({});
    });

  // TODO: PROPERLY IMPLEMENT

  getStateForTesting = (): {
    sessionId: string | undefined;
    gameId: string | undefined;
  } => {
    return {
      sessionId: this.sessionId,
      gameId: this.gameId,
    };
  };

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

  errorEventSubscription = (): ErrorSubscriberClient => this.errorSubscriptions;

  startSubscribers = (sessionId: string): void => {
    this.wallToggledSubscriptions.start(sessionId);
    this.playerMovedSubscriptions.start(sessionId);
    this.diceRollSubscriptions.start(sessionId);
    this.numWallChangesSubscriptions.start(sessionId);
    this.lockWallSubscriptions.start(sessionId);
    this.switchTurnSubscriptions.start(sessionId);
    this.winGameSubscriptions.start(sessionId);
    this.startGameSubscriptions.start(sessionId);
    this.errorSubscriptions.start(sessionId);
  };

  stopSubscribers = (): void => {
    this.wallToggledSubscriptions.stop();
    this.playerMovedSubscriptions.stop();
    this.diceRollSubscriptions.stop();
    this.numWallChangesSubscriptions.stop();
    this.lockWallSubscriptions.stop();
    this.switchTurnSubscriptions.stop();
    this.winGameSubscriptions.stop();
    this.startGameSubscriptions.stop();
    this.errorSubscriptions.stop();
  };

  // TODO: implement stop subscribers and call it sometime when game ends

  // Perform a post to a specific session on the server side
  sessionPost<T>(action: string, body: any): Promise<T> {
    return myPost<T>(action, { ...body, sessionId: this.sessionId });
  }
  // Perform a get to a specific session on the server side
  sessionGet<T>(
    endPoint: string,
    params: { [key: string]: string } = {}
  ): Promise<T> {
    if (!this.sessionId) {
      return Promise.reject("sessionId is missing");
    }
    params.sessionId = this.sessionId;
    return myGet<T>(endPoint, params);
  }
}

function myPost<T>(action: string, body: any): Promise<T> {
  const url: URL = new URL(action, serviceURL);

  console.log("trying", action);
  return fetch(url, {
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
  params: { [key: string]: string } = {}
): Promise<T> {
  const url: URL = new URL(urlExtension, serviceURL);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  return fetch(url)
    .then((res) => {
      if (!res.ok) {
        throw new Error(`Failed ${res.status}: ${res.statusText}`);
      }
      return res;
    })
    .then((results) => results.json());
  // .then(logResults(url.toString()));
}

export var GameInstance = new GameClient();

export function reset() {
  console.log("resetting instance");
  GameInstance.stopSubscribers();
  GameInstance = new GameClient();
}
