import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/lemonsqueezy';
import connectDB from '@/lib/db';
import User from '@/models/User';

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get('x-signature') || '';
    const body = await req.text();

    console.log('=== WEBHOOK RECEIVED ===');
    console.log('Signature present:', !!signature);
    console.log('Body length:', body.length);

    // Verify webhook signature
    const isValid = verifyWebhookSignature(body, signature);

    if (!isValid) {
      console.error('Webhook signature verification failed');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    console.log('Webhook signature verified successfully');

    const event = JSON.parse(body);
    const { meta, data } = event;

    console.log('Webhook received:', {
      eventName: meta.event_name,
      eventId: meta.event_id,
    });

    await connectDB();

    // Handle different event types
    switch (meta.event_name) {
      case 'order_created': {
        // Order created event - get user_id from checkout custom data
        const order = data.attributes;
        const orderId = data.id;
        const customerEmail = order.customer_email;
        const customerId = data.relationships?.customer?.data?.id || order.customer_id?.toString();
        
        console.log('Order created:', {
          orderId,
          customerEmail,
          customerId,
          orderCustom: order.custom,
          // Log full order structure to see where custom data might be
          orderAttributes: Object.keys(order),
        });
        
        // Try multiple places for custom data
        let userId = null;
        
        // Method 1: Check order.custom (if it exists)
        if (order.custom) {
          if (typeof order.custom === 'object' && !Array.isArray(order.custom)) {
            userId = (order.custom as any).user_id;
          }
        }
        
        // Method 2: Try to find user by checkout email (even if different from account)
        if (!userId && customerEmail) {
          const userByEmail = await User.findOne({ email: customerEmail });
          if (userByEmail) {
            userId = userByEmail._id.toString();
            console.log('Found user by checkout email:', userId, userByEmail.email);
          }
        }

        // If we found a user, update with customer ID
        // This customer ID will be used in subscription_created to link the subscription
        if (userId && customerId) {
          const updated = await User.findByIdAndUpdate(
            userId,
            {
              lemonSqueezyCustomerId: customerId,
            },
            { new: true }
          );
          console.log('Updated user with customer ID:', updated?.email);
        } else {
          console.log('Could not update user in order_created - will try in subscription_created', { 
            userId, 
            customerId,
            customerEmail 
          });
        }
        break;
      }

      case 'subscription_created': {
        const subscription = data.attributes;
        const customerId = data.relationships?.customer?.data?.id || subscription.customer_id?.toString();
        const subscriptionId = data.id;
        const variantId = data.relationships?.variant?.data?.id || subscription.variant_id?.toString();
        const customerEmail = subscription.user_email || subscription.customer_email;
        
        console.log('Subscription created:', {
          subscriptionId,
          customerId,
          customerEmail,
          variantId,
          subscriptionCustom: subscription.custom,
          subscriptionAttributes: Object.keys(subscription),
        });
        
        // Try multiple methods to find the user
        let user = null;
        
        // Method 1: Check subscription custom data (custom data might be here instead of order)
        if (subscription.custom && typeof subscription.custom === 'object' && !Array.isArray(subscription.custom)) {
          const customUserId = (subscription.custom as any).user_id;
          if (customUserId) {
            user = await User.findById(customUserId);
            if (user) {
              console.log('Found user by custom user_id in subscription:', user.email);
            }
          }
        }
        
        // Method 2: Find by customer ID (set in order_created if we found the user there)
        if (!user && customerId) {
          user = await User.findOne({ lemonSqueezyCustomerId: customerId });
          if (user) {
            console.log('Found user by customer ID (from order_created):', user.email);
          }
        }
        
        // Method 3: Find by subscription email (even if different from account email)
        if (!user && customerEmail) {
          user = await User.findOne({ email: customerEmail });
          if (user) {
            console.log('Found user by subscription email:', user.email);
          }
        }
        
        // Method 4: If we still can't find the user, try to find by the email we sent in checkout
        // We can't directly do this, but we can check all users and see if any have this customerId
        // This is a fallback for edge cases
        if (!user && customerId) {
          // This shouldn't be necessary if order_created worked, but just in case
          console.log('Trying to find user by customer ID in all users...');
          const allUsers = await User.find({});
          for (const u of allUsers) {
            if (u.lemonSqueezyCustomerId === customerId) {
              user = u;
              console.log('Found user by customer ID in all users:', user.email);
              break;
            }
          }
        }

        if (user) {
          const monthlyVariantId = process.env.LEMONSQUEEZY_MONTHLY_VARIANT_ID;
          const yearlyVariantId = process.env.LEMONSQUEEZY_YEARLY_VARIANT_ID;
          const plan = variantId === monthlyVariantId ? 'monthly' : variantId === yearlyVariantId ? 'yearly' : 'monthly';
          
          const updated = await User.findByIdAndUpdate(
            user._id,
            {
              lemonSqueezyCustomerId: customerId,
              lemonSqueezySubscriptionId: subscriptionId,
              lemonSqueezyVariantId: variantId,
              subscriptionStatus: 'active',
              currentPlan: plan,
            },
            { new: true }
          );
          
          console.log('✅ Updated user subscription:', {
            email: updated?.email,
            subscriptionStatus: updated?.subscriptionStatus,
            currentPlan: updated?.currentPlan,
            lemonSqueezyCustomerId: updated?.lemonSqueezyCustomerId,
            lemonSqueezySubscriptionId: updated?.lemonSqueezySubscriptionId,
          });
        } else {
          console.error('❌ Could not find user for subscription:', {
            customerId,
            customerEmail,
            subscriptionId,
            triedCustomData: !!subscription.custom,
            triedCustomerId: !!customerId,
            triedEmail: !!customerEmail,
          });
          
          // Log the full subscription data for debugging
          console.error('Full subscription data:', JSON.stringify(data, null, 2));
        }
        break;
      }

      case 'subscription_updated': {
        const subscription = data.attributes;
        const subscriptionId = data.id;
        const variantId = data.relationships?.variant?.data?.id || subscription.variant_id?.toString();

        const user = await User.findOne({ lemonSqueezySubscriptionId: subscriptionId });

        if (user && variantId) {
          const monthlyVariantId = process.env.LEMONSQUEEZY_MONTHLY_VARIANT_ID;
          const yearlyVariantId = process.env.LEMONSQUEEZY_YEARLY_VARIANT_ID;
          const plan = variantId === monthlyVariantId ? 'monthly' : variantId === yearlyVariantId ? 'yearly' : user.currentPlan;
          
          await User.findByIdAndUpdate(user._id, {
            lemonSqueezyVariantId: variantId,
            subscriptionStatus: subscription.status === 'active' ? 'active' : 'cancelled',
            currentPlan: plan,
          });
        }
        break;
      }

      case 'subscription_cancelled': {
        const subscriptionId = data.id;

        const user = await User.findOne({ lemonSqueezySubscriptionId: subscriptionId });

        if (user) {
          await User.findByIdAndUpdate(user._id, {
            subscriptionStatus: 'cancelled',
          });
        }
        break;
      }

      case 'subscription_payment_success': {
        const subscriptionId = data.attributes.subscription_id.toString();

        const user = await User.findOne({ lemonSqueezySubscriptionId: subscriptionId });

        if (user) {
          await User.findByIdAndUpdate(user._id, {
            subscriptionStatus: 'active',
          });
        }
        break;
      }

      case 'subscription_payment_failed': {
        const subscriptionId = data.attributes.subscription_id.toString();

        const user = await User.findOne({ lemonSqueezySubscriptionId: subscriptionId });

        if (user) {
          // You might want to handle this differently - maybe set to 'expired' after multiple failures
          await User.findByIdAndUpdate(user._id, {
            subscriptionStatus: 'expired',
          });
        }
        break;
      }
    }

    console.log('=== WEBHOOK PROCESSED SUCCESSFULLY ===');
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('=== WEBHOOK ERROR ===');
    console.error('Error:', error);
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { 
        error: 'Webhook processing failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

