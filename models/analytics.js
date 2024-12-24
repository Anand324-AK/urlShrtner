const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  alias: { type: String, required: true }, // Short URL alias
  ipAddress: { type: String }, // User's IP address
  userAgent: { type: String }, // User agent string
  osName: { type: String }, // Operating system
  deviceName: { type: String }, // Device type (mobile/desktop)
  timestamp: { type: Date, default: Date.now }, // When the click occurred
});

module.exports = mongoose.model('Analytics', analyticsSchema);
