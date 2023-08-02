import express from "express";
import { v4 as uuidv4 } from "uuid";
import SessionManager, { GameNotFoundError } from "../SessionManager";

const router: express.Router = express.Router();
const sessionManager = new SessionManager();

type Player = { name: string; id: string };
type Game = Player[];
let games: Record<string, Game> = {};

router.post("/newgame", (req, res) => {
  let body = req.body;
  let playerName: string = body.playerName;

  try {
    const { sessionId, gameId } = sessionManager.create(playerName);
    res.send({ sessionId, gameId });
  } catch (e) {
    res.sendStatus(400);
  }
});

router.post("/joingame", (req, res) => {
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
  let body = req.body;
  let sessionId = req.query.sessionId as string;

  try {
    let game = sessionManager.get(sessionId);
    res.send({ value: game.value });
  } catch (e) {
    res.sendStatus(404);
  }
});

export default router;
