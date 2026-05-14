"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_cron_1 = __importDefault(require("node-cron"));
// For now this will load all the plants in the system and check if any are due to be watered. If so, create a notification for the user.
const notificationCronJob = node_cron_1.default.schedule("0 8 * * *", async () => {
    console.log("Running notification cron job...");
});
