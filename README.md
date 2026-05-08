# CampusRide 🏍️🎒

CampusRide is a full-stack web application designed for college students to share rides and split the cost of their daily commute. Built by students, for students.

## 🌟 Features
- **Smart Route Matching**: Connects riders (with bikes/scooters) and passengers traveling on the same route to the same college.
- **Auto Fare Calculation**: Transparent and fair pricing calculated automatically at ₹5/km.
- **Dynamic UI**: Beautiful, fully responsive user interface featuring glassmorphism elements and animated parallax backgrounds.
- **Interactive Maps**: Powered by Leaflet.js and OpenStreetMap to visually draw out the pickup and drop-off routes.
- **Full-Stack Architecture**: Powered by Node.js, Express, and MongoDB for robust data persistence.

## 🛠️ Tech Stack
- **Frontend**: HTML5, Vanilla CSS, Vanilla JavaScript, Leaflet.js
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Mongoose)

## 🚀 Running Locally

### Prerequisites
- [Node.js](https://nodejs.org/) installed on your machine.
- A MongoDB Atlas cluster or a local MongoDB server.

### Installation & Setup

1. **Install dependencies:**
   Open your terminal in the project folder and run:
   ```bash
   npm install
   ```

2. **Configure Environment Variables:**
   Create a `.env` file in the root directory of the project and add your MongoDB connection string:
   ```env
   MONGODB_URI="mongodb://your_username:your_password@your_cluster_address/campusride"
   ```

3. **Start the server:**
   ```bash
   npm start
   ```

4. **View the App:**
   Open your browser and navigate to `http://localhost:3000`.

## 🌐 Deployment
This application is configured and ready to be hosted on modern cloud platforms like **Render**, **Koyeb**, or **Railway**. 
Simply connect your GitHub repository, ensure the build command is `npm install` and the start command is `npm start`, and add your `MONGODB_URI` to the platform's Environment Variables settings.

> If you deploy to Render, do not rely on the default local MongoDB URI. Set `MONGODB_URI` in Render dashboard environment variables and use a MongoDB Atlas cluster or another hosted MongoDB service.

## 📄 License
© 2025 CampusRide. All rights reserved.
