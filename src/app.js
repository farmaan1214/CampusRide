require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const User = require('../models/User');
const Ride = require('../models/Ride');

const app = express();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campusride';
const dbState = { connected: false, error: null };

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Database Connection
mongoose.connect(MONGODB_URI)
  .then(() => {
    dbState.connected = true;
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    dbState.error = err;
    console.error('MongoDB connection error:', err);
  });

// Friendly API response when the database is not available
app.use('/api', (req, res, next) => {
  if (!dbState.connected) {
    return res.status(503).json({
      success: false,
      message: 'Database unavailable. Please check MONGODB_URI and restart the app.'
    });
  }
  next();
});

app.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'CampusRide',
    mongo: dbState.connected ? 'connected' : 'disconnected',
    usingEnvMongoUri: Boolean(process.env.MONGODB_URI)
  });
});

// API Routes
app.post('/api/users/register', async (req, res) => {
  try {
    const { name, phone, email, address, city, state, pincode } = req.body;
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ name, phone, email, address, city, state, pincode });
      await user.save();
    } else {
      user.name = name;
      user.phone = phone;
      user.address = address;
      user.city = city;
      user.state = state;
      user.pincode = pincode;
      await user.save();
    }
    res.status(200).json({ success: true, user });
  } catch (err) {
    console.error('Registration Error:', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

app.post('/api/users/:userId/vehicle', async (req, res) => {
  try {
    const { vehicle } = req.body;
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.vehicle = vehicle;
    await user.save();
    res.status(200).json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

app.post('/api/rides', async (req, res) => {
  try {
    const { riderId, source, destination, sourceCoord, destCoord, distance, fare, time, seats } = req.body;
    const newRide = new Ride({
      rider: riderId,
      source,
      destination,
      sourceCoord,
      destCoord,
      distance,
      fare,
      time,
      seats: seats || 1
    });
    await newRide.save();
    const populatedRide = await Ride.findById(newRide._id).populate('rider');
    res.status(201).json({ success: true, ride: populatedRide });
  } catch (err) {
    console.error('Post Ride Error:', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

app.get('/api/rides', async (req, res) => {
  try {
    const rides = await Ride.find({ status: 'available' })
      .populate('rider', 'name vehicle')
      .sort({ createdAt: -1 })
      .limit(20);
    res.status(200).json({ success: true, rides });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

app.post('/api/rides/:rideId/book', async (req, res) => {
  try {
    const { passengerId } = req.body;
    const ride = await Ride.findById(req.params.rideId);
    if (!ride) return res.status(404).json({ success: false, message: 'Ride not found' });
    if (ride.status !== 'available') return res.status(400).json({ success: false, message: 'Ride no longer available' });
    ride.status = 'booked';
    ride.passenger = passengerId;
    await ride.save();
    res.status(200).json({ success: true, ride });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

module.exports = app;
