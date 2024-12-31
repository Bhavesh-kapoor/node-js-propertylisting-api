import cron from "node-cron";
import { User } from "../model/user.model.js";
import { SubscribedPlan } from "../model/subscribedPlan.model.js";
import { logger } from "../config/logger.js";

const updateSubscriptionStatuses = async () => {
  try {
    const currentDate = new Date();

    // Find all expired subscriptions
    const expiredSubscriptions = await SubscribedPlan.find({
      endDate: { $lt: currentDate },
      isActive: true,
      status: "active",
    }).select("userId");

    if (expiredSubscriptions.length > 0) {
      const userIds = expiredSubscriptions.map((sub) => sub.userId);
      await User.updateMany(
        { _id: { $in: userIds } },
        {
          $set: {
            isVerified: false,
          },
        }
      );
      await SubscribedPlan.updateMany(
        {
          userId: { $in: userIds },
          endDate: { $lt: currentDate },
          isActive: true,
          status: "active",
        },
        {
          $set: {
            isActive: false,
            status: "expired",
          },
        }
      );

      logger.info(
        `Successfully updated status for ${expiredSubscriptions.length} expired subscriptions`
      );
    }
  } catch (error) {
    logger.error("Error in subscription status cron job:", error);
  }
};
const scheduleCronJobs = () => {
  cron.schedule("0 0 * * *", async () => {
    logger.info("Running subscription status update cron job");
    await updateSubscriptionStatuses();
  });
};

export default scheduleCronJobs;
