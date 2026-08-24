import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Lock, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAdminAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(password);
      if (result.success) {
        navigate('/admin');
      } else {
        setError(result.message || 'Invalid password');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="bg-grid flex min-h-screen items-center justify-center px-4"
      style={{ background: '#05060f' }}
    >
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="glow-gold mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-[#e8b923]/25 bg-[#e8b923]/10">
            <Lock className="h-7 w-7 text-[#e8b923]" />
          </div>
          <h1 className="mb-1 text-2xl font-medium text-white">Admin Access</h1>
          <p className="text-sm text-gray-400">Enter your password to access the dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-strong rounded-2xl p-6">
          {error && (
            <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="mb-2 block text-sm text-gray-400">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#05060f] px-4 py-3 pr-12 text-sm text-white transition-colors outline-none focus:border-[#e8b923]"
                placeholder="Enter admin password"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !password}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#e8b923] py-3 text-sm font-medium text-[#05060f] transition-colors hover:bg-[#f5cd45] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? 'Authenticating…' : 'Login'}
          </button>
          <div className="mt-4 text-center">
            <a href="/admin/recover" className="text-xs text-gray-500 transition-colors hover:text-[#e8b923]">Forgot your password?</a>
          </div>
        </form>

        <div className="mt-6 text-center">
          <a href="/" className="text-sm text-gray-500 transition-colors hover:text-[#e8b923]">
            &larr; Back to portfolio
          </a>
        </div>
      </div>
    </div>
  );
}
