import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createCheckout } from '@/lib/lemonsqueezy';
import connectDB from '@/lib/db';
import User from '@/models/User';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { variantId } = await req.json();

    if (!variantId) {
      return NextResponse.json(
        { error: 'Variant ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Create checkout session with redirect URL
    let baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    
    // Ensure baseUrl has a protocol
    if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
      baseUrl = `http://${baseUrl}`;
    }
    
    // Note: (dashboard) is a route group, so the URL is /billing not /dashboard/billing
    const redirectUrl = `${baseUrl}/billing?success=true`;
    
    const checkoutUrl = await createCheckout({
      variantId,
      email: user.email,
      name: user.name,
      customFields: {
        user_id: user._id.toString(),
      },
      redirectUrl,
    });

    return NextResponse.json({ url: checkoutUrl });
  } catch (error: any) {
    console.error('Checkout error:', error);
    const errorMessage = error?.message || error?.cause || 'Failed to create checkout session';
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error : undefined,
      },
      { status: 500 }
    );
  }
}

