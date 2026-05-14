import cron from "node-cron";
import * as plantService from "../services/plantService";
import * as notificationService from "../services/notificationService";
import { getDateDifferenceInDays } from "../helpers/dateHelper";
import { CreateNotificationRequest } from "../requests/NotificationRequests";
import { userService } from "../services";

// For now this will load all the plants in the system and check if any are due to be watered. If so, create a notification for the user.
// Runs daily at 08:00:00 am.
// Testing time for every minute: "* * * * *"
export const notificationCronJob = cron.schedule("* * * * *", async () => {
  console.log("Running notification cron job...");

  // Load in the plants.
  const plants = await plantService.getAllPlants();

  const now = new Date();

  for (const plant of plants) {
    if (!plant.date_last_watered) {

      // Compare the date created to the date now and see if it is larger than the watering interval.
      const dateDiff = getDateDifferenceInDays(plant.date_created, now);
      const shouldNotifyForWater = dateDiff > plant.watering_frequency_days;

      if(shouldNotifyForWater) {

        // Make a request for the user id with the plant id.
        const user = await userService.getUserByPlantId(plant.id);
        if (!user) {
          throw new Error(`No user found for plant id ${plant.id}`);
        }
        const request: CreateNotificationRequest = {
          title: `Time to water your plant, ${plant.name}!`,
          message: `Your ${plant.species} needs to be watered. It has been ${dateDiff} days since you got started tracking it with Planty!`,
          users_user_id: user?.id,
          plant_id: plant.id,
          notification_type_id: 2, // Requirement reminder notification type.
        };
        await notificationService.createNotification(request);

        console.log(`Created notification for plant ${plant.name} and user ${user.name}`);
      }
    }
    else {
      // Check if the plant is due to be watered.
      const nextScheduledWateringDate = new Date(
        plant.date_last_watered.getTime() + plant.watering_frequency_days * 24 * 60 * 60 * 1000,
      );

      if (now >= nextScheduledWateringDate) {

        // Make a request for the user id with the plant id.
        const user = await userService.getUserByPlantId(plant.id);
        if (!user) {
          throw new Error(`No user found for plant id ${plant.id}`);
        }

        const dateDiff = getDateDifferenceInDays(plant.date_last_watered, now);

        const request: CreateNotificationRequest = {
          title: `Time to water your plant, ${plant.name}!`,
          message: `Your ${plant.species} needs to be watered. It has been ${dateDiff} days since you last watered it!`,
          users_user_id: user?.id,
          plant_id: plant.id,
          notification_type_id: 2,
        };
        await notificationService.createNotification(request);

        console.log(`Created notification for plant ${plant.name} and user ${user.name}`);
      }
    }
  }
});