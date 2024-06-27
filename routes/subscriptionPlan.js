const express = require('express');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const { plans } = require('../server');

const router = express.Router();

router.post('/create-plans', async (req, res) => {
  try {
    for (const key in plans) {
      const planData = plans[key];
      const existingPlan = await SubscriptionPlan.findOne({ planTitle: planData.title });

      if (existingPlan) {
        existingPlan.planFeatures = planData.features;
        existingPlan.planPrice = planData.price;
        existingPlan.planApiCounts = planData.apiCounts;
        await existingPlan.save();
      } else {
        const newPlan = new SubscriptionPlan({
          planTitle: planData.title,
          planFeatures: planData.features,
          planPrice: planData.price,
          planApiCounts: planData.apiCounts,
        });
        await newPlan.save();
      }
    }

    res.status(200).json({ message: 'Subscription plans created/updated successfully' });
  } catch (error) {
    console.error('Error creating/updating subscription plans:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/', async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find();
    res.status(200).json({ plans });
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
