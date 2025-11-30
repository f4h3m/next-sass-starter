import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { isInTrial, isTrialExpired, getTrialDaysRemaining } from '@/lib/trial';
import { updateSubscriptionStatusIfExpired, getEffectiveSubscriptionStatus } from '@/lib/subscription';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email }).select('-password');

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Auto-update subscription status if expired
    await updateSubscriptionStatusIfExpired(user._id.toString());
    
    // Re-fetch user to get updated status
    const updatedUser = await User.findById(user._id).select('-password');

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check trial status
    const inTrial = isInTrial(updatedUser.trialEndDate);
    const trialExpired = isTrialExpired(updatedUser.trialEndDate);
    const trialDaysRemaining = getTrialDaysRemaining(updatedUser.trialEndDate);

    // Get effective subscription status
    const effectiveStatus = getEffectiveSubscriptionStatus(
      updatedUser.subscriptionStatus,
      updatedUser.subscriptionEndDate,
      updatedUser.trialEndDate,
      updatedUser.subscriptionRenewalDate
    );

    return NextResponse.json({
      subscriptionStatus: effectiveStatus,
      currentPlan: updatedUser.currentPlan,
      trialStartDate: updatedUser.trialStartDate,
      trialEndDate: updatedUser.trialEndDate,
      subscriptionRenewalDate: updatedUser.subscriptionRenewalDate,
      subscriptionEndDate: updatedUser.subscriptionEndDate,
      inTrial,
      trialExpired,
      trialDaysRemaining,
      lemonSqueezyCustomerId: updatedUser.lemonSqueezyCustomerId,
      lemonSqueezySubscriptionId: updatedUser.lemonSqueezySubscriptionId,
      lemonSqueezyVariantId: updatedUser.lemonSqueezyVariantId,
    });
  } catch (error) {
    console.error('Subscription status error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription status' },
      { status: 500 }
    );
  }
}

