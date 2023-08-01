import request from "supertest";
import express from "express";
import router from "../routes/index";
import bodyParser from "body-parser";

const app = express();
app.use(bodyParser.json());
app.use("/", router);

describe("Test POST /hello2", () => {
  it("returns uppercase name", async () => {
    const response = await request(app)
      .post("/hello2")
      .send({ name: "pHiLLiP" })
      .expect("Content-Type", /json/)
      .expect(200);

    expect(response.body).toEqual({
      user: "PHILLIP",
    });
  });

  it("returns an error when no name is provided", async () => {
    const response = await request(app)
      .post("/hello2")
      .send({})
      .expect("Content-Type", /json/)
      .expect(400);

    expect(response.body).toEqual({ error: "No name provided" });
  });

  it("returns an error when name is not a string", async () => {
    const response = await request(app)
      .post("/hello2")
      .send({ name: 123 })
      .expect("Content-Type", /json/)
      .expect(400);

    expect(response.body).toEqual({ error: "Name must be a string" });
  });
});
