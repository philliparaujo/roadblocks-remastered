import { GameServer, SubscriberServer } from "@roadblocks/engine";
import {
  AddEdgeResult,
  Coord,
  CoordResult,
  DiceResult,
  DiceRollEvent,
  HeightResult,
  WidthResult,
  JoinGameResult,
  LockWallEvent,
  NewGameResult,
  NumWallChangesEvent,
  PlayerColor,
  PlayerLocation,
  PlayerMovedEvent,
  RemoveEdgeResult,
  StartGameEvent,
  SwitchTurnEvent,
  TimedEvent,
  WallLocationsResult,
  WallToggledEvent,
  WinGameEvent,
  diceRollPubSubRoute,
  lockWallPubSubRoute,
  numWallChangesPubSubRoute,
  playerMovedPubSubRoute,
  startGamePubSubRoute,
  switchTurnPubSubRoute,
  winGamePubSubRoute,
  wlalToggledPubSubRoute,
  newGameRoute,
  joinGameRoute,
  addEdgeRoute,
  removeEdgeRoute,
  getWidthRoute,
  getHeightRoute,
  getCellLocationRoute,
  getWallLocationRoute,
  getDiceRoute,
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

// TODO: MAKE ALL ROUTES DEFINED AS CONSTANTS IN TYPES

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

router.post(addEdgeRoute, (req, res) => {
  let body = req.body;
  let coord: Coord = body.coord;
  let sessionId = body.sessionId as string;

  try {
    sessionManager.get(sessionId).then((game) => {
      // console.log(game);
      game
        .addEdge(coord)
        .then(() => {
          safeSend<AddEdgeResult>({ coord }, res);
        })
        .catch((err) => res.sendStatus(400));
    });
  } catch (e) {
    res.sendStatus(500);
  }
});

router.post(removeEdgeRoute, (req, res) => {
  let body = req.body;
  let coord: Coord = body.coord;
  let sessionId = body.sessionId as string;

  try {
    sessionManager.get(sessionId).then((game) => {
      // console.log(game);
      game
        .removeEdge(coord)
        .then(() => {
          safeSend<RemoveEdgeResult>({ coord }, res);
        })
        .catch((err) => res.sendStatus(400));
    });
  } catch (e) {
    res.sendStatus(500);
  }
});
router.get(getWidthRoute, (req, res) => {
  const sessionId = req.query.sessionId as string;

  try {
    sessionManager
      .get(sessionId)
      .then((game) => {
        game
          .getWidth()
          .then((result) => {
            safeSend<WidthResult>(result, res);
          })
          .catch((err) => {
            console.error(err);
            res.sendStatus(400);
          });
      })
      .catch((err) => {
        res.sendStatus(404);
      });
  } catch (e) {
    res.sendStatus(500);
  }
});

router.get(getHeightRoute, (req, res) => {
  const sessionId = req.query.sessionId as string;

  try {
    sessionManager
      .get(sessionId)
      .then((game) => {
        game
          .getHeight()
          .then((result) => {
            safeSend<HeightResult>(result, res);
          })
          .catch((err) => {
            console.error(err);
            res.sendStatus(400);
          });
      })
      .catch((err) => {
        res.sendStatus(404);
      });
  } catch (e) {
    res.sendStatus(500);
  }
});

router.get(getCellLocationRoute, (req, res) => {
  const sessionId = req.query.sessionId as string;
  const player = req.query.player as PlayerLocation;

  try {
    sessionManager
      .get(sessionId)
      .then((game) => {
        game
          .getCellLocation(player)
          .then((result) => {
            safeSend<CoordResult>(result, res);
          })
          .catch((err) => {
            console.error(err);
            res.sendStatus(400);
          });
      })
      .catch((err) => {
        res.sendStatus(404);
      });
  } catch (e) {
    res.sendStatus(500);
  }
});

router.get(getWallLocationRoute, (req, res) => {
  const sessionId = req.query.sessionId as string;

  try {
    sessionManager
      .get(sessionId)
      .then((game) => {
        game
          .getWallLocations()
          .then((result) => {
            safeSend<WallLocationsResult>(result, res);
          })
          .catch((err) => {
            console.error(err);
            res.sendStatus(400);
          });
      })
      .catch((err) => {
        res.sendStatus(404);
      });
  } catch (e) {
    res.sendStatus(500);
  }
});

router.get(getDiceRoute, (req, res) => {
  const sessionId = req.query.sessionId as string;
  const player = req.query.player as PlayerColor;

  try {
    sessionManager
      .get(sessionId)
      .then((game) => {
        game
          .getDice(player)
          .then((result) => {
            safeSend<DiceResult>(result, res);
          })
          .catch((err) => {
            console.error(err);
            res.sendStatus(400);
          });
      })
      .catch((err) => {
        res.sendStatus(404);
      });
  } catch (e) {
    res.sendStatus(500);
  }
});

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

router.use("/", (req, res) => {
  console.log("Server endpoint does not exist. Sorry.", req.url);
  res.status(404).send("Not found");
});

export default router;
