const mongoose = require('mongoose');

const RideSchema = new mongoose.Schema({
  rider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  source: { type: String, required: true },
  destination: { type: String, required: true },
  sourceCoord: { type: [Number], required: true }, // [lat, lng]
  destCoord: { type: [Number], required: true }, // [lat, lng]
  distance: { type: Number, required: true },
  fare: { type: Number, required: true },
  time: { type: Number, required: true },
  seats: { type: Number, default: 1 },
  status: { type: String, enum: ['available', 'booked', 'completed', 'cancelled'], default: 'available' },
  passenger: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // Set when booked
}, { timestamps: true });

module.exports = mongoose.model('Ride', RideSchema);
