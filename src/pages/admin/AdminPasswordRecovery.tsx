import { useState } from 'react';
import { ArrowLeft, KeyRound, Loader2, MailCheck, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router';
import { trpc } from '@/providers/trpc';

const passwordPolicy = (value: string) => value.length >= 12
  && [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((pattern) => pattern.test(value)).length >= 3;

export default function AdminPasswordRecovery() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const requestReset = trpc.admin.requestPasswordReset.useMutation({
    onSuccess: (result) => {
      setError('');
      setMessage(result.message);
      setStep('reset');
    },
    onError: () => setError('Unable to start password recovery. Please try again later.'),
  });
  const resetPassword = trpc.admin.resetPassword.useMutation({
    onSuccess: (result) => {
      setError('');
      setMessage(result.message);
      navigate('/admin/login');
    },
    onError: (resetError) => setError(resetError.message),
  });

  const handleRequest = (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    requestReset.mutate({ email });
  };

  const handleReset = (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }
    if (!passwordPolicy(newPassword)) {
      setError('Use at least 12 characters and at least three character types.');
      return;
    }
    resetPassword.mutate({ email, code, newPassword });
  };

  return (
    <div className="bg-grid flex min-h-screen items-center justify-center px-4" style={{ background: '#05060f' }}>
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="glow-gold mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-[#e8b923]/25 bg-[#e8b923]/10">
            {step === 'request' ? <KeyRound className="h-7 w-7 text-[#e8b923]" /> : <MailCheck className="h-7 w-7 text-[#e8b923]" />}
          </div>
          <h1 className="mb-1 text-2xl font-medium text-white">Recover Admin Access</h1>
          <p className="text-sm text-gray-400">{step === 'request' ? 'Request a one-time reset code by email' : 'Enter the code sent to your admin email'}</p>
        </div>

        <form onSubmit={step === 'request' ? handleRequest : handleReset} className="glass-strong rounded-2xl p-6">
          {message && <div className="mb-4 rounded-lg border border-green-500/20 bg-green-500/10 p-3 text-sm text-green-400">{message}</div>}
          {error && <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">{error}</div>}

          <label className="mb-2 block text-sm text-gray-400">Admin email</label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mb-4 w-full rounded-lg border border-white/10 bg-[#05060f] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#e8b923]"
            placeholder="admin@example.com"
            autoComplete="email"
            required
            disabled={step === 'reset'}
          />

          {step === 'request' ? (
            <>
              <p className="mb-5 text-xs leading-relaxed text-gray-500">For security, the response is intentionally generic. If this email is configured for the admin account, a six-digit code will arrive and expire after 10 minutes.</p>
              <button type="submit" disabled={requestReset.isPending} className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#e8b923] py-3 text-sm font-medium text-[#05060f] transition-colors hover:bg-[#f5cd45] disabled:cursor-not-allowed disabled:opacity-50">
                {requestReset.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {requestReset.isPending ? 'Sending code…' : 'Send Reset Code'}
              </button>
            </>
          ) : (
            <>
              <label className="mb-2 block text-sm text-gray-400">Six-digit reset code</label>
              <input
                type="text"
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                className="mb-4 w-full rounded-lg border border-white/10 bg-[#05060f] px-4 py-3 text-sm tracking-[0.4em] text-white outline-none transition-colors focus:border-[#e8b923]"
                placeholder="000000"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                required
              />
              <label className="mb-2 block text-sm text-gray-400">New password</label>
              <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="mb-4 w-full rounded-lg border border-white/10 bg-[#05060f] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#e8b923]" autoComplete="new-password" minLength={12} required />
              <label className="mb-2 block text-sm text-gray-400">Confirm new password</label>
              <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="mb-4 w-full rounded-lg border border-white/10 bg-[#05060f] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#e8b923]" autoComplete="new-password" minLength={12} required />
              <p className={`mb-5 text-xs ${passwordPolicy(newPassword) ? 'text-green-400' : 'text-gray-500'}`}>Use 12+ characters with at least three of uppercase, lowercase, number, and symbol.</p>
              <button type="submit" disabled={resetPassword.isPending || code.length !== 6 || !passwordPolicy(newPassword) || newPassword !== confirmPassword} className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#e8b923] py-3 text-sm font-medium text-[#05060f] transition-colors hover:bg-[#f5cd45] disabled:cursor-not-allowed disabled:opacity-50">
                {resetPassword.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {resetPassword.isPending ? 'Resetting password…' : 'Set New Password'}
              </button>
              <button type="button" onClick={() => { setStep('request'); setCode(''); setMessage(''); setError(''); }} className="mt-3 w-full text-center text-xs text-gray-500 hover:text-[#e8b923]">Request another code</button>
            </>
          )}
        </form>

        <div className="mt-6 flex items-center justify-center gap-4 text-center">
          <a href="/admin/login" className="inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-[#e8b923]"><ArrowLeft className="h-3.5 w-3.5" /> Back to login</a>
          <span className="text-gray-700">·</span>
          <span className="inline-flex items-center gap-1 text-xs text-gray-600"><ShieldCheck className="h-3.5 w-3.5" /> One-time code</span>
        </div>
      </div>
    </div>
  );
}
