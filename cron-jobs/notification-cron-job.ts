import cron from "node-cron";

// For now this will load all the plants in the system and check if any are due to be watered. If so, create a notification for the user.

const notificationCronJob = cron.schedule("0 8 * * *", async () => {
  console.log("Running notification cron job...");