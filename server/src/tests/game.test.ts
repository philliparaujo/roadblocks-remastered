import request from "supertest";
import express from "express";
import router from "../routes/game";
import bodyParser from "body-parser";

const app = express();
app.use(bodyParser.json());
app.use("/", router);

describe("Test /newgame", () => {
  it("returns gameId and sessionId", async () => {
    const response = await request(app)
      .post("/newgame")
      .send({ playerName: "John" })
      .expect("Content-Type", /json/)
      .expect(200);

    expect(response.body.gameId).toBeDefined();
    expect(response.body.sessionId).toBeDefined();
  });

  it("returns an error when no name is provided", async () => {
    const response = await request(app).post("/newgame").send({}).expect(400);
  });

  it("returns an error when name is not a string", async () => {
    const response = await request(app)
      .post("/newgame")
      .send({ playerName: 123 })
      .expect(400);
  });

  it("gameId and sessionId are not equal", async () => {
    const response = await request(app)
      .post("/newgame")
      .send({ playerName: "John" })
      .expect("Content-Type", /json/)
      .expect(200);
    expect(response.body.gameId).not.toEqual(response.body.sessionId);
  });
});

describe("Test /joingame", () => {
  let gameId: string;
  let sessionId1: string;

  // create a new game before running these tests
  beforeEach(async () => {
    const response = await request(app)
      .post("/newgame")
      .send({ playerName: "John" })
      .expect("Content-Type", /json/)
      .expect(200);

    gameId = response.body.gameId;
    sessionId1 = response.body.sessionId;
  });

  it("returns sessionId", async () => {
    const response = await request(app)
      .post("/joingame")
      .send({ playerName: "Jane", gameId: gameId })
      .expect("Content-Type", /json/)
      .expect(200);

    expect(response.body.sessionId).toBeDefined();
    expect(response.body.sessionId).not.toEqual(sessionId1);
  });

  it("returns an error when no name is provided", async () => {
    const response = await request(app)
      .post("/joingame")
      .send({ gameId: gameId })
      .expect(400);
  });

  it("returns an error when name is not a string", async () => {
    const response = await request(app)
      .post("/joingame")
      .send({ playerName: 123, gameId: gameId })
      .expect(400);
  });

  it("returns an error when no gameId is provided", async () => {
    const response = await request(app)
      .post("/joingame")
      .send({ playerName: "Jane" })
      .expect(400);
  });

  it("returns an error when gameId is not a string", async () => {
    const response = await request(app)
      .post("/joingame")
      .send({ playerName: "Jane", gameId: 123 })
      .expect(400);
  });

  it("returns an error when gameId doesn't already exist", async () => {
    expect(gameId).not.toEqual("foo");
    const response = await request(app)
      .post("/joingame")
      .send({ playerName: "Jane", gameId: "foo" })
      .expect(404);
  });
});
