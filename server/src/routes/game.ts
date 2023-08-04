import { Coord, NewGameResult } from "@roadblocks/types";
import express from "express";
import SessionManager, { GameNotFoundError } from "../SessionManager";

const router: express.Router = express.Router();
const sessionManager = new SessionManager();

type Player = { name: string; id: string };
type Game = Player[];
let games: Record<string, Game> = {};

router.post("/newGame", (req, res) => {
  let body = req.body;
  let playerName: string = body.playerName;

  console.log("Creating game for player", playerName);
  try {
    const { sessionId, gameId } = sessionManager.create(playerName);
    const result: NewGameResult = {
      sessionId,
      gameId,
    };
    res.send(result);
  } catch (e) {
    res.sendStatus(400);
  }
});

router.post("/joinGame", (req, res) => {
  let body = req.body;
  let playerName = body.playerName;
  let gameId = body.gameId;

  try {
    const { sessionId } = sessionManager.join(gameId, playerName);
    res.send({ sessionId });
  } catch (e) {
    if (e instanceof GameNotFoundError) {
      res.sendStatus(404);
    } else {
      res.sendStatus(400);
    }
  }
});

router.get("/testValue", (req, res) => {
  let sessionId = req.query.sessionId as string;

  try {
    let game = sessionManager.get(sessionId);
    game.value().then((value) => {
      res.send({ value: value });
    });
  } catch (e) {
    res.sendStatus(404);
  }
});

router.get("/addEdge", (req, res) => {
  let body = req.body;
  let coord: Coord = body.coord;
});

router.use("/", (req, res) => {
  console.log("Bad call", req.url);
  res.status(404).send("Not found");
});

export default router;
