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
  tokenStatus: Boolean,
  apiCalls: Number,
});

const Profile = mongoose.model('Profile', profileSchema);

app.post('/api/profile', async (req, res) => {
  const { token, tokenStatus, increment } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }

  try {
    const googleResponse = await fetch(
      'https://people.googleapis.com/v1/people/me?personFields=names,emailAddresses,photos',
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!googleResponse.ok) {
      throw new Error('Failed to fetch profile info from Google');
    }

    const profileInfo = await googleResponse.json();
    const { names, emailAddresses, photos } = profileInfo;

    const name = names?.[0]?.displayName || '';
    const emailAddress = emailAddresses?.[0]?.value || '';
    const photoUrl = photos?.[0]?.url || '';

    let existingProfile = await Profile.findOne({ emailAddress });

    if (existingProfile) {
      if (increment) {
        existingProfile.apiCalls += increment;
      }

      if (tokenStatus !== undefined) {
        existingProfile.tokenStatus = tokenStatus;
      }

      await existingProfile.save();

      return res.status(200).json({
        message: increment
          ? 'Profile API calls incremented'
          : 'Profile updated',
        authenticated: true,
        profileImage: photoUrl,
        apiCalls: existingProfile.apiCalls,
      });
    } else {
      const newProfile = new Profile({
        name,
        emailAddress,
        photoUrl,
        tokenStatus: tokenStatus !== undefined ? tokenStatus : true,
        apiCalls: increment || 0,
      });

      await newProfile.save();

      return res.status(200).json({
        message: 'Profile saved successfully',
        authenticated: true,
        profileImage: photoUrl,
        apiCalls: newProfile.apiCalls,
      });
    }
  } catch (error) {
    console.error('Error handling profile:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.delete('/api/profile', async (req, res) => {
  try {
    const { emailAddress } = req.body;
    if (!emailAddress) {
      return res.status(400).send('Email address is required');
    }
    const updatedProfile = await Profile.findOneAndUpdate(
      { emailAddress },
      { tokenStatus: false },
      { new: true }
    );
    if (!updatedProfile) {
      return res.status(404).send('No profile found with that email address');
    }

    console.log('Profile status updated to false');
    res.status(200).send('Profile status updated to false');
  } catch (error) {
    console.error('Error updating profile status:', error);
    res.status(500).send('Error updating profile status');
  }
});

app.get('api/health', (req, res) => {
  res.status(200).send('Server is running successfully');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
