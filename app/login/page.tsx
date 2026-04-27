'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleLogin() {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    console.log('login data:', data);
    console.log('login error:', error);

    if (error) {
      alert(error.message);
      return;
    }

    router.push('/');
    router.refresh();
  }

  async function handleSignUp() {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    console.log('login data:', data);
    console.log('login error:', error);

    if (error) {
      alert(error.message);
      return;
    }

    alert('Sign up successful. Now try logging in.');
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">Welcome back</h1>
          <p className="text-sm text-muted-foreground">Sign in to continue to Chat Bot.</p>
        </div>

        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        <Button className="w-full" onClick={handleLogin}>
          Login
        </Button>

        <Button className="w-full" variant="outline" onClick={handleSignUp}>
          Sign up
        </Button>
      </div>
    </main>
  );
}
