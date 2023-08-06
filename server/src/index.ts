import express from "express";
import gameRouter from "./routes/game";
import bodyParser from "body-parser";
import cors from "cors";

const app: express.Application = express();
const port: number = 5000;

app.use(bodyParser.json());
app.use(cors());
app.use("/", gameRouter);

app.listen(port, () => {
  console.log("Roadblocks server running on port", port);
});
