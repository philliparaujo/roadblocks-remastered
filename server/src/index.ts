import express from "express";
import mainRouter from "./routes/index";
import bodyParser from "body-parser";

const app: express.Application = express();
const port: number = 3000;

app.use(bodyParser.json());
app.use("/", mainRouter);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
