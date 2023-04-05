'use strict';
import Serverless from "serverless-http";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import express from 'express';
import cors from 'cors';
import 'dotenv/config'
import apiRoute from "./router.js"

const app = express();
export const verify = Serverless(app)

app.use(cors({ origin: true, credentials: true }));

app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));
app.use(express.urlencoded({ limit: "30mb", extended: true }));
app.use(cookieParser("SECRET"));

app.use("/api", apiRoute);


app.listen({ port: 4000 }, () =>
    console.log("Server running")
)



