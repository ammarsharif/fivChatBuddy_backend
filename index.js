const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

mongoose
  .connect('mongodb+srv://myfiverr:fiv1234@cluster0.3ylrwdt.mongodb.net/')
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log(err));

const profileSchema = new mongoose.Schema({
  name: String,
  emailAddress: String,
  photoUrl: String,
});

const Profile = mongoose.model('Profile', profileSchema);

app.post('/api/profile', async (req, res) => {
  try {
    const { names, emailAddresses, photos } = req.body;
    const name = names?.[0]?.displayName || '';
    const emailAddress = emailAddresses?.[0]?.value || '';
    const photoUrl = photos?.[0]?.url || '';

    const existingProfile = await Profile.findOne({ emailAddress });
    if (existingProfile) {
      return res.status(400).send('Email address already exists');
    }
    const newProfile = new Profile({ name, emailAddress, photoUrl });
    await newProfile.save();
    res.status(200).send('Profile saved');
  } catch (error) {
    console.error('Error saving profile:', error);
    res.status(500).send('Error saving profile');
  }
});

app.delete('/api/profile', async (req, res) => {
  try {
    const { emailAddress } = req.body;
    if (!emailAddress) {
      return res.status(400).send('Email address is required');
    }

    const result = await Profile.deleteOne({ emailAddress });
    if (result.deletedCount === 0) {
      return res.status(404).send('No profile found with that email address');
    }

    res.status(200).send('Profile deleted');
  } catch (error) {
    console.error('Error deleting profile:', error);
    res.status(500).send('Error deleting profile');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});





