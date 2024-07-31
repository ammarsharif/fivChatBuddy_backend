const mongoose = require('mongoose');
const SubscriptionPlan = require('./models/SubscriptionPlan');
const mongoURI = 'mongodb+srv://myfiverr:fiv1234@cluster0.3ylrwdt.mongodb.net/';

const plans = {
  free: {
    title: 'Free',
    features: [
      'Limited Response Calls',
      'Enjoy 10 API calls per month',
      'Access a limited set of tones',
    ],
    price: 0,
    apiCounts: 100,
  },
  monthly: {
    title: 'Monthly',
    features: [
      'Unlimited Response Calls',
      'Access a wider variety of tones',
      'Personalized, human-like responses',
    ],
    price: 15.99,
    apiCounts: 1000,
  },
  yearly: {
    title: 'Yearly',
    features: [
      'Tone Adjustment',
      'Full access to all tones',
      '12 months of unlimited API calls',
      'Personalized, human-like responses',
    ],
    price: 120,
    apiCounts: 12000,
  },
};
mongoose
  .connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB');
    async function savePlans() {
      try {
        for (const planKey of Object.keys(plans)) {
          const plan = plans[planKey];
          const newPlan = new SubscriptionPlan({
            planTitle: planKey,
            planFeatures: plan.features,
            planPrice: plan.price,
            planApiCounts: plan.apiCounts,
          });
          await newPlan.save();
          console.log(`Saved plan '${plan.title}'`);
        }
        console.log('All plans saved successfully');
      } catch (error) {
        console.error('Error saving plans:', error);
      } finally {
        mongoose.disconnect();
        console.log('Disconnected from MongoDB');
      }
    }
    savePlans();
  })
  .catch((err) => console.error('Error connecting to MongoDB:', err));
