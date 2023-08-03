import express from "express";
import indexRouter from "./routes/index";
import gameRouter from "./routes/game";
import bodyParser from "body-parser";

const app: express.Application = express();
const port: number = 5000;

app.use(bodyParser.json());
app.use("/", gameRouter);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
