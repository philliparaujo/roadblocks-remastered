import { GameServer, SubscriberServer } from "@roadblocks/engine";
import {
  AddEdgeResult,
  Coord,
  DiceRollEvent,
  GetHeightResult,
  GetWidthResult,
  JoinGameResult,
  LockWallEvent,
  NewGameResult,
  NumWallChangesEvent,
  PlayerMovedEvent,
  RemoveEdgeResult,
  StartGameEvent,
  SwitchTurnEvent,
  TimedEvent,
  WallToggledEvent,
  WinGameEvent,
  diceRollRoute,
  lockWallRoute,
  numWallChangesRoute,
  playerMovedRoute,
  startGameRoute,
  switchTurnRoute,
  winGameRoute,
  wlalToggledRoute,
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

router.post("/newGame", (req, res) => {
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

router.post("/joinGame", (req, res) => {
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

router.post("/addEdge", (req, res) => {
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

router.post("/removeEdge", (req, res) => {
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
router.get("/getWidth", (req, res) => {
  const sessionId = req.query.sessionId as string;

  try {
    sessionManager
      .get(sessionId)
      .then((game) => {
        game
          .getWidth()
          .then((width) => {
            safeSend<GetWidthResult>({ width }, res);
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

router.get("/getHeight", (req, res) => {
  const sessionId = req.query.sessionId as string;

  try {
    sessionManager
      .get(sessionId)
      .then((game) => {
        game
          .getHeight()
          .then((height) => {
            safeSend<GetHeightResult>({ height }, res);
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
  diceRollRoute,
  (game: GameServer) => game.diceRollSubscriptions,
  router
);
registerPubSub<PlayerMovedEvent>(
  playerMovedRoute,
  (game: GameServer) => game.playerMovedSubscriptions,
  router
);
registerPubSub<SwitchTurnEvent>(
  switchTurnRoute,
  (game: GameServer) => game.switchTurnSubscriptions,
  router
);
registerPubSub<WallToggledEvent>(
  wlalToggledRoute,
  (game: GameServer) => game.wallToggledSubscriptions2(),
  router
);
registerPubSub<LockWallEvent>(
  lockWallRoute,
  (game: GameServer) => game.lockWallSubscriptions,
  router
);
registerPubSub<WinGameEvent>(
  winGameRoute,
  (game: GameServer) => game.winGameSubscriptions,
  router
);
registerPubSub<StartGameEvent>(
  startGameRoute,
  (game: GameServer) => game.startGameSubscriptions,
  router
);
registerPubSub<NumWallChangesEvent>(
  numWallChangesRoute,
  (game: GameServer) => game.numWallChangesSubscriptions,
  router
);

router.use("/", (req, res) => {
  console.log("Server endpoint does not exist. Sorry.", req.url);
  res.status(404).send("Not found");
});

export default router;
