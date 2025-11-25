import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    maxlength: [60, 'Name cannot be more than 60 characters'],
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
  },
  // Trial and subscription fields
  trialStartDate: {
    type: Date,
  },
  trialEndDate: {
    type: Date,
  },
  subscriptionStatus: {
    type: String,
    enum: ['trial', 'active', 'cancelled', 'expired'],
    default: 'trial',
  },
  lemonSqueezyCustomerId: {
    type: String,
  },
  lemonSqueezySubscriptionId: {
    type: String,
  },
  lemonSqueezyVariantId: {
    type: String,
  },
  currentPlan: {
    type: String,
    enum: ['trial', 'monthly', 'yearly'],
    default: 'trial',
  },
});

export default mongoose.models.User || mongoose.model('User', UserSchema);
