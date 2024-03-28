const Notification = require("../Models/notification.schema");
const sendToUserId = require("./send_to_userId_controller");

storeNotificationUsingFrontEnd = async (
  title = "default title",
  message = "default message",
  user_id = "default_uuid"
) => {
  try {
    const notification = new Notification({ title, message, user_id });
    await notification.save();
    return notification;
  } catch (error) {
    next({ statusCode: 500, message: error.message });
  }
};

// Store notification
storeNotification = async (req, res, next) => {
  try {
    const { title, message, user_id } = req.body;

    if (!title || !message) {
      return next({
        statusCode: 400,
        message: "Provide the all notification data correctly",
      });
    }

    const notification = new Notification({ title, message, user_id });
    await notification.save();

    //send notification

    let notificationSendResponse = await sendToUserId(user_id, notification);
    if (!notificationSendResponse.success) {
      return next({ statusCode: 500, message: notificationSendResponse.error });
    }

    return res.status(201).json({
      statusCode: 200,
      message: "Notification stored successfully",
      data: [],
    });
  } catch (error) {
    next({ statusCode: 500, message: error.message });
  }
};

//  Notification list with pagination
getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, userId } = req.query;
    if (!userId) {
      return next({ statusCode: 400, message: "Provide the user ID" });
    }
    const skipCount = (page - 1) * limit;

    const notifications = await Notification.find({
      deleted: false,
      user_id: userId,
    })
      .sort({ datetime: -1 })
      .skip(skipCount)
      .limit(parseInt(limit))
      .select("-__v");

    const totalRecords = await Notification.countDocuments({
      deleted: false,
      user_id: userId,
    });
    const totalUnreadCounts = await totalUnreadCount(userId);
    return res.json({
      statusCode: 200,
      message: "Notifications retrieved successfully",
      data: notifications,
      pagination: {
        current_page: parseInt(page),
        total_records: totalRecords,
        total_unread_counts: totalUnreadCounts,
      },
    });
  } catch (error) {
    next({ statusCode: 500, message: error.message });
  }
};

// Get single notification detail
getNotificationDetail = async (req, res, next) => {
  try {
    const { notificationId } = req.params;

    if (!notificationId) {
      return next({ statusCode: 400, message: "Provide the notification ID" });
    }

    // Retrieve the notification details based on ID and user ID
    const notification = await Notification.findOne({
      _id: notificationId,
    }).select("-__v");

    if (!notification) {
      return res.status(404).json({
        statusCode: 404,
        message: "Notification not found",
        data: null,
      });
    }

    // Mark the notification as read if it's unread
    if (!notification.read) {
      await Notification.updateOne(
        { _id: notificationId },
        { read: true, read_datetime: new Date() }
      );
    }

    return res.json({
      statusCode: 200,
      message: "Notification retrieved successfully",
      data: notification,
    });
  } catch (error) {
    next({ statusCode: 500, message: error.message });
  }
};

// Read all notification
readAllNotifications = async (req, res, next) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return next({ statusCode: 400, message: "Provide the user ID" });
    }

    await Notification.updateMany(
      { deleted: false, read: false, user_id: userId },
      { read: true, read_datetime: new Date() }
    );
    return res.json({
      statusCode: 200,
      message: "All notifications marked as read",
      data: [],
    });
  } catch (error) {
    next({ statusCode: 500, message: error.message });
  }
};

//  Clear All notification
clearAllNotifications = async (req, res, next) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return next({ statusCode: 400, message: "Provide the user ID" });
    }
    await Notification.updateMany(
      { deleted: false, user_id: userId },
      { deleted: true, deleted_time: new Date() }
    );
    return res.json({
      statusCode: 200,
      message: "All notifications soft deleted",
      data: [],
    });
  } catch (error) {
    next({ statusCode: 500, message: error.message });
  }
};

// Clear single notification
clearSingleNotification = async (req, res, next) => {
  try {
    const { notificationId } = req.params;

    if (!notificationId) {
      return next({ statusCode: 400, message: "Provide the notification ID" });
    }

    // Soft delete the notification
    const deletedNotification = await Notification.findOneAndUpdate(
      { _id: notificationId, deleted: false },
      { deleted: true, deleted_time: new Date() }
    );

    if (!deletedNotification) {
      return res.status(404).json({
        statusCode: 404,
        message: "Notification not found or already deleted",
        data: null,
      });
    }

    return res.json({
      statusCode: 200,
      message: "Notification soft deleted",
      data: [],
    });
  } catch (error) {
    next({ statusCode: 500, message: error.message });
  }
};

// Unread count
getUnreadCount = async (req, res, next) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return next({ statusCode: 400, message: "Provide the user ID" });
    }

    const unreadCount = await totalUnreadCount(userId);
    return res.json({
      statusCode: 200,
      message: "Unread count retrieved successfully",
      data: unreadCount,
    });
  } catch (error) {
    next({ statusCode: 500, message: error.message });
  }
};

const totalUnreadCount = async (userId) => {
  try {
    const unreadCount = await Notification.countDocuments({
      read: false,
      deleted: false,
      user_id: userId,
    });
    return unreadCount;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  storeNotificationUsingFrontEnd,
  storeNotification,
  getNotifications,
  readAllNotifications,
  clearAllNotifications,
  clearSingleNotification,
  getUnreadCount,
  getNotificationDetail,
};
