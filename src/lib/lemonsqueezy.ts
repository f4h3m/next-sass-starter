import { lemonSqueezySetup, createCheckout as createCheckoutLS, getSubscription, cancelSubscription as cancelSubscriptionLS } from '@lemonsqueezy/lemonsqueezy.js';

if (!process.env.LEMONSQUEEZY_API_KEY) {
  throw new Error('LEMONSQUEEZY_API_KEY is not set');
}

// Initialize Lemon Squeezy
lemonSqueezySetup({
  apiKey: process.env.LEMONSQUEEZY_API_KEY,
});

export interface CheckoutOptions {
  variantId: string;
  email: string;
  name: string;
  customPrice?: number;
  customFields?: Record<string, any>;
  redirectUrl?: string;
}

/**
 * Create a checkout session
 */
export async function createCheckout(options: CheckoutOptions) {
  const storeId = process.env.LEMONSQUEEZY_STORE_ID;
  
  if (!storeId) {
    throw new Error('LEMONSQUEEZY_STORE_ID is not set');
  }

  // Convert variantId to number if it's a string
  const variantIdNum = typeof options.variantId === 'string' 
    ? parseInt(options.variantId, 10) 
    : options.variantId;
  
  const storeIdNum = typeof storeId === 'string' 
    ? parseInt(storeId, 10) 
    : storeId;

  // Build the checkout object according to Lemon Squeezy API structure
  const checkoutParams: any = {};

  // Add checkout data - ensure proper format
  if (options.email || options.name || (options.customFields && Object.keys(options.customFields).length > 0)) {
    checkoutParams.checkoutData = {};
    if (options.email) {
      checkoutParams.checkoutData.email = String(options.email).trim();
    }
    if (options.name) {
      checkoutParams.checkoutData.name = String(options.name).trim();
    }
    // Add custom data if provided - must be Record<string, unknown>
    if (options.customFields && Object.keys(options.customFields).length > 0) {
      checkoutParams.checkoutData.custom = options.customFields;
    }
  }

  // Add checkout options
  checkoutParams.checkoutOptions = {
    embed: false,
    media: false,
    logo: true,
  };

  // Add product options
  checkoutParams.productOptions = {
    name: 'SaaS Starter Subscription',
    description: 'Monthly or Yearly subscription',
  };

  // Add redirect URL if provided - validate and fix URL format
  if (options.redirectUrl) {
    let redirectUrl = options.redirectUrl.trim();
    
    // Ensure URL has a protocol
    if (!redirectUrl.startsWith('http://') && !redirectUrl.startsWith('https://')) {
      // If it starts with localhost, add http://
      if (redirectUrl.startsWith('localhost')) {
        redirectUrl = `http://${redirectUrl}`;
      } else {
        // For other cases, try to add https://
        redirectUrl = `https://${redirectUrl}`;
      }
    }
    
    try {
      new URL(redirectUrl); // Validate URL format
      checkoutParams.productOptions.redirectUrl = redirectUrl;
    } catch (e) {
      console.warn('Invalid redirectUrl format, skipping:', options.redirectUrl);
    }
  }

  // Add custom price if provided
  if (options.customPrice) {
    checkoutParams.customPrice = options.customPrice;
  }

  // Log the request being sent for debugging
  console.log('Creating checkout with params:', {
    storeId: storeIdNum,
    variantId: variantIdNum,
    checkoutParams: JSON.stringify(checkoutParams, null, 2),
  });

  const response = await createCheckoutLS(storeIdNum, variantIdNum, checkoutParams);

  if (response.error) {
    console.error('Lemon Squeezy checkout error:', {
      error: response.error,
      statusCode: response.statusCode,
      message: response.error?.message,
      cause: response.error?.cause,
      fullError: JSON.stringify(response.error, null, 2),
    });
    
    // Extract the specific field error if available
    if (response.error?.cause && Array.isArray(response.error.cause) && response.error.cause.length > 0) {
      const errorDetail = response.error.cause[0];
      if (errorDetail?.source?.pointer) {
        console.error('Invalid field:', errorDetail.source.pointer);
      }
    }
    
    throw response.error;
  }

  // Response structure: response.data.data.attributes.url
  return response.data.data.attributes.url;
}

/**
 * Get subscription details
 */
export async function getSubscriptionDetails(subscriptionId: string) {
  const response = await getSubscription(subscriptionId);

  if (response.error) {
    throw response.error;
  }

  return response.data;
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(subscriptionId: string) {
  const response = await cancelSubscriptionLS(subscriptionId);

  if (response.error) {
    throw response.error;
  }

  return response.data;
}

/**
 * Verify webhook signature
 * Lemon Squeezy sends the signature in the x-signature header
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string
): boolean {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  
  if (!secret) {
    // In development, you might want to skip verification
    if (process.env.NODE_ENV === 'development') {
      console.warn('LEMONSQUEEZY_WEBHOOK_SECRET is not set, skipping verification in development');
      return true;
    }
    throw new Error('LEMONSQUEEZY_WEBHOOK_SECRET is not set');
  }

  // Lemon Squeezy uses HMAC SHA256 for webhook verification
  const crypto = require('crypto');
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const calculatedSignature = hmac.digest('hex');

  // Lemon Squeezy signature might include a prefix, so we check both
  return calculatedSignature === signature || signature.includes(calculatedSignature);
}

