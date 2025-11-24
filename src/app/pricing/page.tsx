import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Check } from 'lucide-react';

export default function PricingPage() {
  const plans = [
    {
      name: 'Free Trial',
      price: 'Free',
      period: '',
      description: 'Try our service for 7 days',
      features: [
        'Full access to all features',
        'No credit card required',
        'Cancel anytime',
        'All premium features included',
        '7-day trial period',
      ],
      cta: 'Start Free Trial',
      popular: false,
      highlight: false,
    },
    {
      name: 'Monthly',
      price: '$9.99',
      period: '/month',
      description: 'Pay monthly, cancel anytime',
      features: [
        'All features included',
        'Monthly billing',
        'Cancel anytime',
        'Priority support',
        'Regular updates',
      ],
      cta: 'Get Started',
      popular: false,
      highlight: false,
    },
    {
      name: 'Yearly',
      price: '$48',
      period: '/year',
      description: 'Best value - Save 60%',
      savings: 'Save $72/year',
      features: [
        'All features included',
        'Annual billing',
        'Save 60% vs monthly',
        'Priority support',
        'Regular updates',
        'Best value',
      ],
      cta: 'Get Started',
      popular: true,
      highlight: true,
    },
  ];

  return (
    <main className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <h1 className="text-xl font-bold">SaaS Starter</h1>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Pricing Section */}
      <section className="flex flex-1 items-center justify-center px-4 py-24">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Simple, Transparent Pricing
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose the perfect plan for your needs. Start with a 7-day free trial, no credit card required.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={`relative flex flex-col ${
                  plan.highlight
                    ? 'border-primary shadow-lg scale-105 md:scale-110'
                    : ''
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                      Best Value
                    </span>
                  </div>
                )}
                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                  <CardDescription className="text-base mb-4">
                    {plan.description}
                  </CardDescription>
                  <div className="flex flex-col items-center justify-center gap-1">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground">{plan.period}</span>
                    </div>
                    {plan.savings && (
                      <span className="text-sm text-primary font-medium mt-1">
                        {plan.savings}
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    asChild
                    className="w-full"
                    variant={plan.highlight ? 'default' : 'outline'}
                  >
                    <Link href="/signup">{plan.cta}</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-xs text-muted-foreground">
              All plans include a 7-day free trial. No credit card required.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2024 SaaS Starter. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}

