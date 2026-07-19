// config/cloudinary.js
const dotenv = require('dotenv');
dotenv.config();
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary with your account credentials.
// These used to be hardcoded here and committed to the repo — a live,
// working API secret in source control is a real leak (anyone with repo
// access, or anyone who finds this file in a public fork, gets your
// Cloudinary account). Moved to env vars; see .env.example.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = cloudinary;