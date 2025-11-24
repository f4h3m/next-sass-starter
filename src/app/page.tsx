import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">SaaS Starter</h1>
          </div>
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

      {/* Hero Section */}
      <section className="flex flex-1 items-center justify-center px-4 py-24">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Build Your SaaS Product
            <br />
            <span className="text-primary">Faster Than Ever</span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            A modern starter template with authentication, dashboard, and all the
            tools you need to launch your SaaS product quickly.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/signup" className="cursor-pointer inline-block">
              <Button size="lg" className="gap-2 cursor-pointer ">
                Get Started
                <ArrowRight className="size-4 cur" />
              </Button>
            </Link>
            <Link href="/login" className="cursor-pointer inline-block">
              <Button size="lg" variant="outline">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t bg-muted/50 py-24">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h3 className="text-3xl font-bold tracking-tight">Everything You Need</h3>
            <p className="mt-4 text-muted-foreground">
              Built with modern technologies and best practices
            </p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-lg bg-primary/10">
                <svg
                  className="size-6 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h4 className="text-lg font-semibold">Secure Authentication</h4>
              <p className="mt-2 text-sm text-muted-foreground">
                Built-in authentication with NextAuth.js and secure password hashing
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-lg bg-primary/10">
                <svg
                  className="size-6 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h4 className="text-lg font-semibold">Dashboard</h4>
              <p className="mt-2 text-sm text-muted-foreground">
                Beautiful dashboard with sidebar navigation and responsive design
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-lg bg-primary/10">
                <svg
                  className="size-6 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                  />
                </svg>
              </div>
              <h4 className="text-lg font-semibold">Modern UI</h4>
              <p className="mt-2 text-sm text-muted-foreground">
                Built with shadcn/ui components and Tailwind CSS for a modern look
              </p>
            </div>
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
