import * as functions from "firebase-functions";
import app from "./src/app.js";

export const api = functions.https.onRequest(app);