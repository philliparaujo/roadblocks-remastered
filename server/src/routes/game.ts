import express from "express";
import { v4 as uuidv4 } from "uuid";

const router: express.Router = express.Router();

type Player = { name: string; id: string };
type Game = Player[];
let games: Record<string, Game> = {};

router.post("/newgame", (req, res) => {
  let body = req.body;
  let playerName: string = body.playerName;

  if (!playerName) {
    return res.status(400).json({
      error: "Player name is required",
    });
  }

  if (typeof playerName !== "string") {
    return res.status(400).json({
      error: "Player name must be a string",
    });
  }

  // generate a unique gameId and sessionId
  let gameId: string = uuidv4();
  let sessionId: string = uuidv4();

  // store game
  games[gameId] = [{ name: playerName, id: sessionId }];

  res.send({ gameId: gameId, sessionId: sessionId });
});

router.post("/joingame", (req, res) => {
  let body = req.body;
  let playerName = body.playerName;
  let gameId = body.gameId;

  if (!playerName) {
    return res.status(400).json({
      error: "Player name is required",
    });
  }

  if (typeof playerName !== "string") {
    return res.status(400).json({
      error: "Player name must be a string",
    });
  }

  if (!gameId) {
    return res.status(400).json({
      error: "Game ID is required",
    });
  }

  if (typeof gameId !== "string") {
    return res.status(400).json({
      error: "Game ID must be a string",
    });
  }

  // join player to game
  let game = games[gameId];
  if (!game) {
    return res.status(404).json({
      error: "Game not found",
    });
  }

  // check that playerName is unique in game
  let playerNames = game.map((p) => p.name);
  if (playerNames.includes(playerName)) {
    return res.status(400).json({
      error: "Player name already exists in game",
    });
  }

  let sessionId: string = uuidv4();
  game.push({ name: playerName, id: sessionId });

  res.send({ sessionId: sessionId });
});

export default router;
