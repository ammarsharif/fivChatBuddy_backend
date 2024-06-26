const express = require('express');
const Profile = require('../models/Profile');
const fetch = require('node-fetch');
const Subscription = require('../models/Subscription');
const SubscriptionPlan = require('../models/SubscriptionPlan');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const profile = await Profile.findOne({ emailAddress: req.query.email });
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    res.status(200).json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/', async (req, res) => {
  const { token, status } = req.body;

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

    let subscriptionPlan = await SubscriptionPlan.findOne({
      planTitle: 'free',
    });
    if (existingProfile) {
      if (status !== undefined) {
        existingProfile.status = status;
      }

      await existingProfile.save();

      let subscription = await Subscription.findOne({
        userId: existingProfile._id,
      });
      if (!subscription) {
        subscription = new Subscription({
          userId: existingProfile._id,
          plan: 'free',
          planId: subscriptionPlan._id,
          apiCalls: 0,
          startDate: new Date(),
          endDate: new Date().setMonth(new Date().getMonth() + 1),
        });
        await subscription.save();
      }
      return res.status(200).json({
        message: 'Profile status updated',
        authenticated: true,
        profileImage: photoUrl,
        userApiUsage: existingProfile.userApiUsage,
        subscription,
        id: existingProfile._id,
        emailAddress,
      });
    } else {
      const newProfile = new Profile({
        name,
        emailAddress,
        photoUrl,
        status: status !== undefined ? status : true,
        userApiUsage: 0,
      });

      await newProfile.save();
      const newSubscription = new Subscription({
        userId: newProfile._id,
        plan: 'free',
        planId: subscriptionPlan._id,
        apiCalls: 0,
        startDate: new Date(),
        endDate: new Date().setMonth(new Date().getMonth() + 1),
      });
      await newSubscription.save();

      return res.status(200).json({
        message: 'Profile saved successfully',
        authenticated: true,
        profileImage: photoUrl,
        userApiUsage: newProfile.userApiUsage,
        subscription: newSubscription,
        id: newProfile._id,
        emailAddress,
      });
    }
  } catch (error) {
    console.error('Error handling profile:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/updateApiCount', async (req, res) => {
  const { userId, increment } = req.body;
  if (!userId || increment === undefined) {
    return res.status(400).json({ error: 'increment is required' });
  }
  try {
    let userProfile = await Profile.findOne({ _id: userId });

    if (!userProfile) {
      return res.status(400).json({ error: 'userProfile not found' });
    }
    userProfile.userApiUsage += increment;
    await userProfile.save();

    res.status(200).json({
      message: 'userProfile api count updated successfully',
      userProfile,
      ok: true,
    });
  } catch (error) {
    console.error('Error updating api count:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.delete('/', async (req, res) => {
  try {
    const { emailAddress } = req.body;
    if (!emailAddress) {
      return res.status(400).send('Email address is required');
    }

    const updatedProfile = await Profile.findOneAndUpdate(
      { emailAddress },
      { status: false },
      { new: true }
    );
    console.log(updatedProfile, 'UPDATED PROFILE');
    if (!updatedProfile) {
      console.log('No Profile found');
      return res.status(404).send('No profile found with that email address');
    }

    console.log('Profile status updated to false');
    res.status(200).send('Profile status updated to false');
  } catch (error) {
    console.error('Error updating profile status:', error);
    res.status(500).send('Error updating profile status');
  }
});

module.exports = router;
