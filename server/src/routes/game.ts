import { GameServer, SubscriberServer } from "@roadblocks/engine";
import {
  AddEdgeResult,
  CanEndTurnResult,
  Coord,
  CoordResult,
  DiceResult,
  DiceRollEvent,
  DiceRollResult,
  EndTurnResult,
  HeightResult,
  JoinGameResult,
  LockWallEvent,
  LockWallResult,
  NewGameResult,
  NumWallChangesEvent,
  PathExistsResult,
  PlayerColor,
  PlayerLocation,
  PlayerMovedEvent,
  PlayerMovedResult,
  RemoveEdgeResult,
  StartGameEvent,
  SwitchTurnEvent,
  TimedEvent,
  TurnResult,
  WallLocationsResult,
  WallToggledEvent,
  WidthResult,
  WinGameEvent,
  addEdgeRoute,
  canEndTurnRoute,
  diceRollPubSubRoute,
  getCellLocationRoute,
  getDiceRoute,
  getHeightRoute,
  getTurnRoute,
  getWallLocationRoute,
  getWidthRoute,
  joinGameRoute,
  lockWallPubSubRoute,
  lockWallsRoute,
  newGameRoute,
  numWallChangesPubSubRoute,
  pathExistsRoute,
  playerMovedPubSubRoute,
  removeEdgeRoute,
  rollDiceRoute,
  setPlayerLocationRoute,
  startGamePubSubRoute,
  switchTurnPubSubRoute,
  switchTurnRoute,
  winGamePubSubRoute,
  wlalToggledPubSubRoute,
} from "@roadblocks/types";
import express from "express";
import SessionManager from "../SessionManager";

const router: express.Router = express.Router();
const sessionManager = new SessionManager();

function safeSend<T>(
  value: T,
  sender: {
    send: (v: any) => void;
  }
): void {
  sender.send(value);
}

router.post(newGameRoute, (req, res) => {
  let body = req.body;
  let playerName: string = body.playerName;

  console.log("Creating game for player", playerName);
  try {
    sessionManager
      .create(playerName)
      .then(({ sessionId, gameId }) => {
        safeSend<NewGameResult>(
          {
            sessionId,
            gameId,
          },
          res
        );
      })
      .catch((err) => {
        res.sendStatus(400);
      });
  } catch (e) {
    res.sendStatus(500);
  }
});

router.post(joinGameRoute, (req, res) => {
  let body = req.body;
  let playerName = body.playerName;
  let gameId = body.gameId;

  try {
    sessionManager
      .join(gameId, playerName)
      .then(({ sessionId }) => {
        safeSend<JoinGameResult>({ sessionId }, res);
      })
      .catch((err) => {
        if (err.includes("Game not found")) {
          res.sendStatus(404);
        } else {
          res.sendStatus(400);
        }
      });
  } catch (e) {
    res.sendStatus(500);
  }
});

function myPost<T>(
  name: string,
  callback: (game: GameServer, body: any) => Promise<T>,
  router: express.Router
) {
  router.post(name, (req, res) => {
    let body = req.body;
    let sessionId = body.sessionId as string;

    sessionManager
      .get(sessionId)
      .then((game) => callback(game, body))
      .then((result) => safeSend<T>(result, res))
      .catch((err) => {
        console.error(err);
        res.sendStatus(500);
      });
  });
}

function myGet<T>(
  route: string,
  callback: (game: GameServer, query: any) => Promise<T>,
  router: express.Router
) {
  router.get(route, (req, res) => {
    const sessionId = req.query.sessionId as string;

    try {
      sessionManager
        .get(sessionId)
        .then((game) => callback(game, req.query))
        .then((result) => safeSend<T>(result, res))
        .catch((err) => {
          console.error(err);
          res.sendStatus(400);
        });
    } catch (e) {
      console.error(e);
      res.sendStatus(500);
    }
  });
}

function registerPubSub<T extends TimedEvent>(
  name: string,
  subscribeGetter: (game: GameServer) => SubscriberServer<T>,
  router: express.Router
) {
  router.get(name, (req, res) => {
    let sessionId = req.query.sessionId as string;
    let lastTsString = req.query.lastEventTime as string;
    let lastTsNumber = Date.parse(lastTsString);

    console.log("Session", sessionId, "lastTS", lastTsNumber);

    try {
      sessionManager
        .get(sessionId)
        .then((game) => {
          subscribeGetter(game)
            .get(lastTsNumber)
            .then((events) => {
              safeSend<T[]>(events, res);
            });
        })
        .catch(() => {
          res.sendStatus(404); // game does not exist
        });
    } catch (e) {
      console.log("FATAL: ", e);
      res.sendStatus(500);
    }
  });
}

myPost<AddEdgeResult>(
  addEdgeRoute,
  (game, body) =>
    game.addEdge(body.coord as Coord).then(() => ({ coord: body.coord })),
  router
);

myPost<RemoveEdgeResult>(
  removeEdgeRoute,
  (game, body) =>
    game.removeEdge(body.coord as Coord).then(() => ({ coord: body.coord })),
  router
);

myPost<LockWallResult>(
  lockWallsRoute,
  (game, body) => game.lockWalls().then(() => ({})),
  router
);

myPost<EndTurnResult>(
  switchTurnRoute,
  (game, body) => game.switchTurn().then(() => ({})),
  router
);

myPost<PlayerMovedResult>(
  setPlayerLocationRoute,
  (game, body) =>
    game
      .setPlayerLocation(body.coord as Coord)
      .then(() => ({ coord: body.coord })),
  router
);

myPost<DiceRollResult>(
  rollDiceRoute,
  (game, body) =>
    game.rollDice().then((result) => ({ diceValue: result.diceValue })),
  router
);

myGet<WidthResult>(getWidthRoute, (game, query) => game.getWidth(), router);

myGet<HeightResult>(getHeightRoute, (game, query) => game.getHeight(), router);

myGet<CoordResult>(
  getCellLocationRoute,
  (game, query) => game.getCellLocation(query.player as PlayerLocation),
  router
);

myGet<WallLocationsResult>(
  getWallLocationRoute,
  (game, query) => game.getWallLocations(),
  router
);

myGet<DiceResult>(
  getDiceRoute,
  (game, query) => game.getDice(query.player as PlayerColor),
  router
);

myGet<TurnResult>(getTurnRoute, (game, query) => game.getTurn(), router);

myGet<CanEndTurnResult>(
  canEndTurnRoute,
  (game, query) => game.canEndTurn(),
  router
);

myGet<PathExistsResult>(
  pathExistsRoute,
  (game, query) => game.pathExists(query.player as PlayerColor),
  router
);

registerPubSub<DiceRollEvent>(
  diceRollPubSubRoute,
  (game: GameServer) => game.diceRollSubscriptions,
  router
);
registerPubSub<PlayerMovedEvent>(
  playerMovedPubSubRoute,
  (game: GameServer) => game.playerMovedSubscriptions,
  router
);
registerPubSub<SwitchTurnEvent>(
  switchTurnPubSubRoute,
  (game: GameServer) => game.switchTurnSubscriptions,
  router
);
registerPubSub<WallToggledEvent>(
  wlalToggledPubSubRoute,
  (game: GameServer) => game.wallToggledSubscriptions2(),
  router
);
registerPubSub<LockWallEvent>(
  lockWallPubSubRoute,
  (game: GameServer) => game.lockWallSubscriptions,
  router
);
registerPubSub<WinGameEvent>(
  winGamePubSubRoute,
  (game: GameServer) => game.winGameSubscriptions,
  router
);
registerPubSub<StartGameEvent>(
  startGamePubSubRoute,
  (game: GameServer) => game.startGameSubscriptions,
  router
);
registerPubSub<NumWallChangesEvent>(
  numWallChangesPubSubRoute,
  (game: GameServer) => game.numWallChangesSubscriptions,
  router
);

/* Has to be last route */
router.use("/", (req, res) => {
  console.log("Server endpoint does not exist. Sorry.", req.url);
  res.status(404).send("Not found");
});

export default router;
