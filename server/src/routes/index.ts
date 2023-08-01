import bodyParser from "body-parser";
import express from "express";

const router: express.Router = express.Router();

router.use("/hello", (req, res) => {
  res.send("Hello world!");
});

router.post("/hello2", (req, res) => {
  let body = req.body;

  if (!body.name) {
    return res.status(400).json({ error: "No name provided" });
  }

  if (typeof body.name !== "string") {
    return res.status(400).json({ error: "Name must be a string" });
  }

  let NAME: String = body.name.toUpperCase();
  res.send({ user: NAME });
});

export default router;
