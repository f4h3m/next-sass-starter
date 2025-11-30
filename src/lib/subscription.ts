/**
 * Subscription management utilities
 */

import connectDB from "@/lib/db";
import User from "@/models/User";
import { isTrialExpired } from "@/lib/trial";

/**
 * Check if subscription is still active (hasn't expired)
 */
export function isSubscriptionActive(subscriptionEndDate: Date | null | undefined): boolean {
  if (!subscriptionEndDate) {
    // If no end date, assume active (for active subscriptions without end date)
    return true;
  }
  
  const now = new Date();
  const endDate = new Date(subscriptionEndDate);
  return now < endDate;
}

/**
 * Check if subscription has expired
 */
export function isSubscriptionExpired(subscriptionEndDate: Date | null | undefined): boolean {
  if (!subscriptionEndDate) {
    // If no end date, assume not expired (for active subscriptions)
    return false;
  }
  
  const now = new Date();
  const endDate = new Date(subscriptionEndDate);
  return now >= endDate;
}

/**
 * Get days until next renewal
 */
export function getDaysUntilRenewal(renewalDate: Date | null | undefined): number {
  if (!renewalDate) {
    return 0;
  }
  
  const now = new Date();
  const renewal = new Date(renewalDate);
  const diffTime = renewal.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
}

/**
 * Get days until subscription expiration
 */
export function getDaysUntilExpiration(endDate: Date | null | undefined): number {
  if (!endDate) {
    return 0;
  }
  
  const now = new Date();
  const expiration = new Date(endDate);
  const diffTime = expiration.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
}

/**
 * Update subscription status to expired if end date has passed
 * This function checks and updates the database if needed
 */
export async function updateSubscriptionStatusIfExpired(userId: string): Promise<boolean> {
  try {
    await connectDB();
    const user = await User.findById(userId);
    
    if (!user) {
      return false;
    }
    
    let needsUpdate = false;
    let newStatus = user.subscriptionStatus;
    
    // Check if trial expired
    const trialExpired = isTrialExpired(user.trialEndDate);
    if (user.subscriptionStatus === 'trial' && trialExpired) {
      newStatus = 'expired';
      needsUpdate = true;
    }
    
    // Check if subscription expired (for cancelled or active subscriptions with end date)
    const subscriptionExpired = isSubscriptionExpired(user.subscriptionEndDate);
    if (
      (user.subscriptionStatus === 'active' || user.subscriptionStatus === 'cancelled') &&
      subscriptionExpired &&
      user.subscriptionEndDate
    ) {
      newStatus = 'expired';
      needsUpdate = true;
    }
    
    // Check if renewal date has passed for active subscriptions (subscription should have renewed)
    // If renewal date passed and subscription is still active, it likely failed to renew
    if (user.subscriptionStatus === 'active' && user.subscriptionRenewalDate) {
      const now = new Date();
      const renewalDate = new Date(user.subscriptionRenewalDate);
      // If renewal date has passed, the subscription period has ended
      // If it's still active but renewal date passed, it means payment likely failed
      if (now > renewalDate) {
        newStatus = 'expired';
        needsUpdate = true;
      }
    }
    
    // Update database if status changed
    if (needsUpdate && newStatus !== user.subscriptionStatus) {
      await User.findByIdAndUpdate(userId, {
        subscriptionStatus: newStatus,
      });
      console.log(`✅ Updated subscription status for user ${userId} from ${user.subscriptionStatus} to ${newStatus}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error updating subscription status:', error);
    return false;
  }
}

/**
 * Get effective subscription status (checks expiration without updating DB)
 */
export function getEffectiveSubscriptionStatus(
  subscriptionStatus: string,
  subscriptionEndDate: Date | null | undefined,
  trialEndDate: Date | null | undefined,
  subscriptionRenewalDate?: Date | null | undefined
): string {
  const trialExpired = isTrialExpired(trialEndDate);
  const subscriptionExpired = isSubscriptionExpired(subscriptionEndDate);
  
  if (subscriptionStatus === 'trial' && trialExpired) {
    return 'expired';
  }
  
  if (
    (subscriptionStatus === 'active' || subscriptionStatus === 'cancelled') &&
    subscriptionExpired &&
    subscriptionEndDate
  ) {
    return 'expired';
  }
  
  // Check if renewal date has passed for active subscriptions
  if (subscriptionStatus === 'active' && subscriptionRenewalDate) {
    const now = new Date();
    const renewalDate = new Date(subscriptionRenewalDate);
    // If renewal date has passed, subscription should have renewed or expired
    if (now > renewalDate) {
      return 'expired';
    }
  }
  
  return subscriptionStatus;
}

