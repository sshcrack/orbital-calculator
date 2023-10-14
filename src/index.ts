import * as Koa from "koa";
import * as Router from "koa-router";
import * as bodyParser from "koa-bodyparser";
//@ts-ignore
const logger = require("koa-logger")
import { AppRoutes } from "./routes";

// create koa app
const app = new Koa();
const router = new Router();

// register all application routes
AppRoutes.forEach(route => router[route.method](route.path, route.action));

// run app
app.use(bodyParser());
app.use(router.routes());
app.use(logger())
app.use(router.allowedMethods());
app.listen(5000);

console.log("Koa application is up and running on port 5000");