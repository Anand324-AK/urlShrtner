const mongoose = require('mongoose');

const ShortUrlSchema = new mongoose.Schema({
  longUrl: { type: String, required: true },
  customAlias: { type: String, unique: true },
  shortUrl: { type: String, required: true },
  topic: { type: String },
  createdAt: { type: Date, default: Date.now },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

module.exports = mongoose.model('ShortUrl', ShortUrlSchema);
