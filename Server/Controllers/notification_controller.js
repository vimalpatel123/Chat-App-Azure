const Notification = require("../models/notification");

// Store notification
exports.storeNotification = async (req, res) => {
  try {
    const { title, message } = req.body;
    const notification = new Notification({ title, message });
    await notification.save();
    res.status(201).json(notification);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

//  Notification list with pagination
exports.getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    };
    const notifications = await Notification.paginate({}, options);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Read all notification
exports.readAllNotifications = async (req, res) => {
  try {
    await Notification.updateMany({}, { read: true });
    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//  Clear All notification
exports.clearAllNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({});
    res.json({ message: "All notifications cleared" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Unread count
exports.getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await Notification.countDocuments({ read: false });
    res.json({ unreadCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
