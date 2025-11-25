import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { isInTrial, isTrialExpired, getTrialDaysRemaining } from '@/lib/trial';

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

    // Check trial status
    const inTrial = isInTrial(user.trialEndDate);
    const trialExpired = isTrialExpired(user.trialEndDate);
    const trialDaysRemaining = getTrialDaysRemaining(user.trialEndDate);

    // Determine effective subscription status
    let effectiveStatus = user.subscriptionStatus;
    if (user.subscriptionStatus === 'trial' && trialExpired) {
      effectiveStatus = 'expired';
    }

    return NextResponse.json({
      subscriptionStatus: effectiveStatus,
      currentPlan: user.currentPlan,
      trialStartDate: user.trialStartDate,
      trialEndDate: user.trialEndDate,
      inTrial,
      trialExpired,
      trialDaysRemaining,
      lemonSqueezyCustomerId: user.lemonSqueezyCustomerId,
      lemonSqueezySubscriptionId: user.lemonSqueezySubscriptionId,
      lemonSqueezyVariantId: user.lemonSqueezyVariantId,
    });
  } catch (error) {
    console.error('Subscription status error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription status' },
      { status: 500 }
    );
  }
}

