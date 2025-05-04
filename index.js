import path from "node:path";
import express from "express";
import * as dotenve from "dotenv";
import { bootstrap } from "./src/app.controller.js";
import { Server } from "socket.io";
import { runIo } from "./src/modules/socket/chat.socket.controller.js";

dotenve.config({ path: path.resolve("./src/config/.env.dev") });

const app = express();
const port = process.env.PORT_NUMBER || 5000;

bootstrap(app, express);

const httpServer = app.listen(port, (err) => {
  console.log("The server is running on port: ", port);
});

runIo(httpServer);
