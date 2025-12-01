import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature, getSubscriptionDetails } from '@/lib/lemonsqueezy';
import connectDB from '@/lib/db';
import User from '@/models/User';

/**
 * Helper function to safely parse date from LemonSqueezy webhook payload
 * Returns null if date is null, undefined, or invalid
 */
function parseWebhookDate(dateValue: string | null | undefined): Date | null {
  if (!dateValue) {
    return null;
  }
  try {
    const date = new Date(dateValue);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

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
          renews_at: subscription.renews_at,
          ends_at: subscription.ends_at,
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
          
          // Extract subscription dates from webhook payload
          let renewalDate = parseWebhookDate(subscription.renews_at);
          let endDate = parseWebhookDate(subscription.ends_at);
          
          console.log('Dates from webhook payload:', {
            renews_at: subscription.renews_at,
            ends_at: subscription.ends_at,
            parsedRenewalDate: renewalDate,
            parsedEndDate: endDate,
          });
          
          // Always fetch from API to ensure we have the latest subscription data
          // This is more reliable than relying on webhook payload
          try {
            console.log('Fetching subscription details from LemonSqueezy API for subscription:', subscriptionId);
            // TypeScript: treat subscription details as any since the SDK types are broad
            const subscriptionDetails: any = await getSubscriptionDetails(subscriptionId);
            
            // Log the full structure to understand the response format
            console.log('API response structure:', {
              hasData: !!subscriptionDetails,
              type: typeof subscriptionDetails,
              isArray: Array.isArray(subscriptionDetails),
              keys: subscriptionDetails ? Object.keys(subscriptionDetails) : [],
            });
            
            // Try different possible response structures
            let subscriptionData = null;
            
            // Structure 1: subscriptionDetails.data.attributes (most common)
            if (subscriptionDetails?.data?.attributes) {
              subscriptionData = subscriptionDetails.data.attributes;
              console.log('Found data in subscriptionDetails.data.attributes');
            }
            // Structure 2: subscriptionDetails.attributes (if getSubscriptionDetails already unwraps)
            else if (subscriptionDetails?.attributes) {
              subscriptionData = subscriptionDetails.attributes;
              console.log('Found data in subscriptionDetails.attributes');
            }
            // Structure 3: subscriptionDetails is the data object itself
            else if (subscriptionDetails && typeof subscriptionDetails === 'object' && 'renews_at' in subscriptionDetails) {
              subscriptionData = subscriptionDetails;
              console.log('Found data directly in subscriptionDetails');
            }
            
            if (subscriptionData) {
              console.log('Subscription data from API:', {
                renews_at: subscriptionData.renews_at,
                ends_at: subscriptionData.ends_at,
                ends_at_type: typeof subscriptionData.ends_at,
                ends_at_is_null: subscriptionData.ends_at === null,
                allKeys: Object.keys(subscriptionData).slice(0, 20), // First 20 keys
              });
              
              // Always use API data if available (more reliable)
              if (subscriptionData.renews_at) {
                renewalDate = parseWebhookDate(subscriptionData.renews_at);
              }
              // ends_at is null for active subscriptions (expected behavior)
              // Only parse if it's a valid date string
              if (subscriptionData.ends_at !== undefined && subscriptionData.ends_at !== null) {
                endDate = parseWebhookDate(subscriptionData.ends_at);
              } else if (subscriptionData.ends_at === null) {
                // Explicitly set to null for active subscriptions
                endDate = null;
                console.log('ends_at is null (active subscription - expected)');
              }
              
              console.log('Final parsed dates:', {
                renewalDate,
                endDate,
                renewalDateString: renewalDate?.toISOString(),
                endDateString: endDate?.toISOString(),
                endDateIsNull: endDate === null,
              });
            } else {
              console.warn('No subscription data found in API response. Full response:', JSON.stringify(subscriptionDetails, null, 2).substring(0, 1000));
            }
          } catch (error) {
            console.error('Failed to fetch subscription details from API:', error);
            if (error instanceof Error) {
              console.error('Error message:', error.message);
              console.error('Error stack:', error.stack);
            }
            // Continue with webhook data if API fails
          }
          
          const updateData: any = {
            lemonSqueezyCustomerId: customerId,
            lemonSqueezySubscriptionId: subscriptionId,
            lemonSqueezyVariantId: variantId,
            subscriptionStatus: 'active',
            currentPlan: plan,
          };
          
          // Always update dates - set to null if not available (for active subscriptions, ends_at is null)
          updateData.subscriptionRenewalDate = renewalDate || null;
          updateData.subscriptionEndDate = endDate || null;
          
          const updated = await User.findByIdAndUpdate(
            user._id,
            updateData,
            { new: true }
          );
          
          console.log('✅ Updated user subscription:', {
            email: updated?.email,
            subscriptionStatus: updated?.subscriptionStatus,
            currentPlan: updated?.currentPlan,
            lemonSqueezyCustomerId: updated?.lemonSqueezyCustomerId,
            lemonSqueezySubscriptionId: updated?.lemonSqueezySubscriptionId,
            subscriptionRenewalDate: updated?.subscriptionRenewalDate,
            subscriptionEndDate: updated?.subscriptionEndDate,
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
          
          // Extract subscription dates from webhook payload
          const renewalDate = parseWebhookDate(subscription.renews_at);
          const endDate = parseWebhookDate(subscription.ends_at);
          
          const updateData: any = {
            lemonSqueezyVariantId: variantId,
            subscriptionStatus: subscription.status === 'active' ? 'active' : 'cancelled',
            currentPlan: plan,
          };
          
          // Update dates if provided
          if (renewalDate !== null) {
            updateData.subscriptionRenewalDate = renewalDate;
          }
          if (endDate !== null) {
            updateData.subscriptionEndDate = endDate;
          }
          
          await User.findByIdAndUpdate(user._id, updateData);
        }
        break;
      }

      case 'subscription_cancelled': {
        const subscription = data.attributes;
        const subscriptionId = data.id;

        console.log('Subscription cancelled:', {
          subscriptionId,
          ends_at: subscription.ends_at,
          subscriptionAttributes: Object.keys(subscription),
        });

        const user = await User.findOne({ lemonSqueezySubscriptionId: subscriptionId });

        if (user) {
          // Extract end date from webhook payload
          let endDate = parseWebhookDate(subscription.ends_at);
          
          // If not in webhook, try fetching from API
          if (!endDate) {
            try {
              console.log('Fetching cancelled subscription details from API...');
              const subscriptionDetails: any = await getSubscriptionDetails(subscriptionId);
              let subscriptionData = subscriptionDetails?.data?.attributes || subscriptionDetails?.attributes || subscriptionDetails;
              
              if (subscriptionData?.ends_at) {
                endDate = parseWebhookDate(subscriptionData.ends_at);
                console.log('Fetched end date from API:', subscriptionData.ends_at, 'parsed:', endDate);
              }
            } catch (error) {
              console.error('Failed to fetch cancelled subscription details from API:', error);
            }
          }
          
          const updateData: any = {
            subscriptionStatus: 'cancelled',
            subscriptionEndDate: endDate || null,
          };
          
          console.log('Updating user with cancelled subscription:', {
            userId: user._id,
            endDate,
            updateData,
          });
          
          await User.findByIdAndUpdate(user._id, updateData);
        }
        break;
      }

      case 'subscription_payment_success': {
        const subscriptionId = data.attributes.subscription_id.toString();
        // Note: subscription_payment_success may not include full subscription data
        // We might need to fetch subscription details from API, but for now we'll
        // try to get dates from the webhook payload if available
        const subscription = data.attributes;

        const user = await User.findOne({ lemonSqueezySubscriptionId: subscriptionId });

        if (user) {
          // Extract renewal date if available in webhook payload
          const renewalDate = parseWebhookDate(subscription.renews_at);
          
          const updateData: any = {
            subscriptionStatus: 'active',
          };
          
          // Update renewal date if provided
          if (renewalDate) {
            updateData.subscriptionRenewalDate = renewalDate;
          }
          
          await User.findByIdAndUpdate(user._id, updateData);
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

