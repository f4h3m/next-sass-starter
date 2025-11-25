/**
 * Trial management utilities
 */

export const TRIAL_DAYS = 7;

/**
 * Calculate trial end date from start date
 */
export function calculateTrialEndDate(startDate: Date): Date {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + TRIAL_DAYS);
  return endDate;
}

/**
 * Check if user is currently in trial period
 */
export function isInTrial(trialEndDate: Date | null | undefined): boolean {
  if (!trialEndDate) {
    return false;
  }
  
  const now = new Date();
  const endDate = new Date(trialEndDate);
  return now < endDate;
}

/**
 * Check if trial has expired
 */
export function isTrialExpired(trialEndDate: Date | null | undefined): boolean {
  if (!trialEndDate) {
    return true;
  }
  
  const now = new Date();
  const endDate = new Date(trialEndDate);
  return now >= endDate;
}

/**
 * Get days remaining in trial
 */
export function getTrialDaysRemaining(trialEndDate: Date | null | undefined): number {
  if (!trialEndDate) {
    return 0;
  }
  
  const now = new Date();
  const endDate = new Date(trialEndDate);
  const diffTime = endDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
}

/**
 * Initialize trial for a new user
 */
export function initializeTrial() {
  const startDate = new Date();
  const endDate = calculateTrialEndDate(startDate);
  
  return {
    trialStartDate: startDate,
    trialEndDate: endDate,
    subscriptionStatus: 'trial' as const,
    currentPlan: 'trial' as const,
  };
}

