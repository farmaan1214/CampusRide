const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  vehicle: {
    type: { type: String }, // e.g., 'bike' or 'scooter'
    plate: { type: String },
    license: { type: String }
  }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
