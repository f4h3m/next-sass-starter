import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';

/**
 * Test endpoint to manually update subscription data
 * This is for debugging purposes - remove in production
 */
export async function POST(req: NextRequest) {
  try {
    const { email, subscriptionId, customerId, variantId, plan } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const updateData: any = {
      subscriptionStatus: 'active',
    };

    if (subscriptionId) updateData.lemonSqueezySubscriptionId = subscriptionId;
    if (customerId) updateData.lemonSqueezyCustomerId = customerId;
    if (variantId) updateData.lemonSqueezyVariantId = variantId;
    if (plan) updateData.currentPlan = plan;

    const updated = await User.findByIdAndUpdate(
      user._id,
      updateData,
      { new: true }
    );

    return NextResponse.json({
      success: true,
      user: {
        email: updated?.email,
        subscriptionStatus: updated?.subscriptionStatus,
        currentPlan: updated?.currentPlan,
        lemonSqueezyCustomerId: updated?.lemonSqueezyCustomerId,
        lemonSqueezySubscriptionId: updated?.lemonSqueezySubscriptionId,
        lemonSqueezyVariantId: updated?.lemonSqueezyVariantId,
      },
    });
  } catch (error) {
    console.error('Test webhook error:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

