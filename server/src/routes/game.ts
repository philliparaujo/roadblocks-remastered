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
  ResetTurnResult,
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
  resetTurnRoute,
  rollDiceRoute,
  setPlayerLocationRoute,
  startGamePubSubRoute,
  switchTurnPubSubRoute,
  switchTurnRoute,
  winGamePubSubRoute,
  wallToggledPubSubRoute,
  errorRoute,
  ErrorEvent,
  errorPubSubRoute,
  listGamesRoute,
  ListGamesResult,
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

router.get(listGamesRoute, (req, res) => {
  try {
    sessionManager
      .listGames()
      .then((games) => {
        safeSend<ListGamesResult>({ games }, res);
      })
      .catch((err) => {
        console.error(err);
        res.sendStatus(400);
      });
  } catch (e) {
    console.error(e);
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

    try {
      sessionManager
        .get(sessionId)
        .then((game) => callback(game, body))
        .then((result: T) => safeSend<T>(result, res))
        .catch((err) => {
          console.error("ERROR: " + err);
          res.sendStatus(401);
        });
    } catch (e) {
      console.error(e);
      res.sendStatus(500);
    }
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
            .then((events: T[]) => {
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
  (game, body) => game.addEdge(body.coord as Coord),
  router
);

myPost<RemoveEdgeResult>(
  removeEdgeRoute,
  (game, body) => game.removeEdge(body.coord as Coord),
  router
);

myPost<LockWallResult>(
  lockWallsRoute,
  (game, body) => game.lockWalls(),
  router
);

myPost<EndTurnResult>(
  switchTurnRoute,
  (game, body) => game.switchTurn(),
  router
);

myPost<PlayerMovedResult>(
  setPlayerLocationRoute,
  (game, body) => game.setPlayerLocation(body.coord as Coord),
  router
);

myPost<DiceRollResult>(rollDiceRoute, (game, body) => game.rollDice(), router);

myPost<ResetTurnResult>(
  resetTurnRoute,
  (game, body) => game.resetTurn().then(() => ({})),
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
  wallToggledPubSubRoute,
  (game: GameServer) => game.wallToggledSubscriptions,
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
registerPubSub<ErrorEvent>(
  errorPubSubRoute,
  (game: GameServer) => game.errorSubscriptions,
  router
);

/* Has to be last route */
router.use("/", (req, res) => {
  console.log("Server endpoint does not exist. Sorry.", req.url);
  res.status(404).send("Not found");
});

export default router;
