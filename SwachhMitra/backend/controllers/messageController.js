const Message = require('../models/Message');

exports.getMessagesByConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    // Find all messages belonging to this Event ID or Private Chat ID
    const messages = await Message.find({ conversationId }).sort({ createdAt: 1 });
    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ message: "Error fetching messages", error: err.message });
  }
};