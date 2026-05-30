"use client";
import { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError(res.error || 'Invalid credentials');
      } else {
        // Redirect based on role: staff/admin → /admin, players → /profile
        const session = await getSession();
        const role = (session?.user as any)?.role;
        if (role === 'staff' || role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/profile');
        }
        router.refresh();
      }
    } catch (err: any) {
      setError(err?.message || 'An error occurred. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-radial-gradient px-4 relative overflow-hidden">
      {/* Background ambient light */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-mln-green/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-surface/40 backdrop-blur-md border border-border-color/60 p-8 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.37)] relative overflow-hidden transition-all duration-300 hover:border-mln-green/40">
        {/* Border glow */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-mln-green to-cyan-400"></div>

        <div className="text-center mb-8">
          <div className="text-[10px] text-mln-green font-bold uppercase tracking-[4px] mb-2">MLN Portal</div>
          <h1 className="text-3xl font-black text-white uppercase tracking-wider">Sign In</h1>
          <p className="text-gray-400 text-sm mt-1">Log in to your MLN account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-sm font-semibold flex items-center gap-2">
              <span className="text-lg">⚠</span>
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-xs text-gray-400 uppercase tracking-widest font-bold">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="oreoluwaalawaye@gmail.com"
              className="w-full bg-background border border-border-color rounded-xl px-4 py-3 text-white text-sm outline-none transition-all focus:border-mln-green focus:shadow-[0_0_15px_rgba(0,200,83,0.1)]"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs text-gray-400 uppercase tracking-widest font-bold">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-background border border-border-color rounded-xl px-4 py-3 text-white text-sm outline-none transition-all focus:border-mln-green focus:shadow-[0_0_15px_rgba(0,200,83,0.1)]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-mln-green hover:bg-mln-green-dark text-black py-4 rounded-xl font-bold tracking-widest uppercase transition-all duration-300 shadow-[0_4px_20px_rgba(0,200,83,0.2)] hover:shadow-[0_4px_25px_rgba(0,200,83,0.4)] disabled:opacity-50"
          >
            {loading ? 'SIGNING IN...' : 'SIGN IN'}
          </button>

          <div className="text-center pt-2">
            <span className="text-gray-400 text-xs">Don&apos;t have an account? </span>
            <Link href="/admin/register" className="text-mln-green hover:text-mln-green-light text-xs font-bold transition-colors">
              Sign Up
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
