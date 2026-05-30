"use client";
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (!token || !email) {
      setError('Invalid or missing token parameters in the URL.');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong');
      } else {
        setMessage(data.message || 'Password reset successfully!');
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/admin/login');
        }, 3000);
      }
    } catch (err: any) {
      setError(err?.message || 'An error occurred. Please try again.');
    }
    setLoading(false);
  };

  if (!token || !email) {
    return (
      <div className="w-full max-w-md bg-surface/40 backdrop-blur-md border border-border-color/60 p-8 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.37)] text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-red-500"></div>
        <div className="text-red-500 text-3xl mb-4">⚠</div>
        <h2 className="text-xl font-bold text-white uppercase tracking-wider mb-2">Invalid Link</h2>
        <p className="text-gray-400 text-sm mb-6">
          This password reset link is invalid, incomplete, or corrupted. Please request a new one.
        </p>
        <Link
          href="/admin/forgot-password"
          className="inline-block bg-mln-green hover:bg-mln-green-dark text-black px-6 py-3 rounded-xl font-bold tracking-widest uppercase text-xs transition-all shadow-[0_4px_20px_rgba(0,200,83,0.2)]"
        >
          Request New Link
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md bg-surface/40 backdrop-blur-md border border-border-color/60 p-8 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.37)] relative overflow-hidden transition-all duration-300 hover:border-mln-green/40">
      {/* Border glow */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-mln-green to-cyan-400"></div>

      <div className="text-center mb-8">
        <div className="text-[10px] text-mln-green font-bold uppercase tracking-[4px] mb-2">MLN Portal</div>
        <h1 className="text-3xl font-black text-white uppercase tracking-wider">New Password</h1>
        <p className="text-gray-400 text-sm mt-1">Set a new secure password for your account</p>
      </div>

      {message ? (
        <div className="space-y-6 text-center">
          <div className="bg-mln-green/10 border border-mln-green/30 text-mln-green p-4 rounded-xl text-sm font-semibold">
            <div className="text-2xl mb-1">✅</div>
            <span>{message}</span>
          </div>
          <p className="text-gray-400 text-sm">
            Redirecting to sign-in page in a moment...
          </p>
          <Link
            href="/admin/login"
            className="block w-full bg-mln-green hover:bg-mln-green-dark text-black py-4 rounded-xl font-bold tracking-widest uppercase transition-all duration-300 shadow-[0_4px_20px_rgba(0,200,83,0.2)] text-center text-xs"
          >
            Go to Sign In Now
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-sm font-semibold flex items-center gap-2">
              <span className="text-lg">⚠</span>
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-xs text-gray-400 uppercase tracking-widest font-bold">New Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-background border border-border-color rounded-xl px-4 py-3 text-white text-sm outline-none transition-all focus:border-mln-green focus:shadow-[0_0_15px_rgba(0,200,83,0.1)]"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs text-gray-400 uppercase tracking-widest font-bold">Confirm Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-background border border-border-color rounded-xl px-4 py-3 text-white text-sm outline-none transition-all focus:border-mln-green focus:shadow-[0_0_15px_rgba(0,200,83,0.1)]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-mln-green hover:bg-mln-green-dark text-black py-4 rounded-xl font-bold tracking-widest uppercase transition-all duration-300 shadow-[0_4px_20px_rgba(0,200,83,0.2)] hover:shadow-[0_4px_25px_rgba(0,200,83,0.4)] disabled:opacity-50"
          >
            {loading ? 'RESETTING...' : 'CONFIRM RESET'}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPassword() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-radial-gradient px-4 relative overflow-hidden">
      {/* Background ambient light */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-mln-green/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      <Suspense fallback={
        <div className="w-full max-w-md bg-surface/40 backdrop-blur-md border border-border-color/60 p-8 rounded-2xl text-center">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-mln-green border-t-transparent rounded-full mb-4"></div>
          <p className="text-white text-sm">Loading reset form...</p>
        </div>
      }>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
