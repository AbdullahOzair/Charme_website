/**
 * Forgot Password Page (secure email-code flow)
 * Step 1: enter email  -> a 6-digit code is emailed.
 * Step 2: enter code + new password -> password is reset.
 * Matches the Login/Register card styling and reuses PasswordInput.
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import PasswordInput from '../components/common/PasswordInput';
import toast from 'react-hot-toast';

const strength = (pw) => {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score; // 0..4
};
const STRENGTH_LABEL = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'];
const STRENGTH_COLOR = ['#e5e7eb', '#ef4444', '#f59e0b', '#eab308', '#16a34a'];

const errText = (err, fallback) => {
  const data = err.response?.data ?? {};
  const details = data.error?.details ?? {};
  return (
    details.new_password?.[0] ??
    details.code?.[0] ??
    details.email?.[0] ??
    data.error?.message ??
    data.detail ??
    fallback
  );
};

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);         // 1 = email, 2 = code + password
  const [done, setDone] = useState(false);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const s = strength(password);

  const requestCode = async (e) => {
    e?.preventDefault();
    setError('');
    if (!email) { setError('Please enter your email.'); return; }
    setBusy(true);
    try {
      await authService.requestPasswordReset({ email });
      toast.success('If that email exists, a code has been sent.');
      setStep(2);
    } catch (err) {
      const msg = errText(err, 'Could not send the code. Please try again.');
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const confirmReset = async (e) => {
    e.preventDefault();
    setError('');
    if (code.trim().length !== 6) { setError('Enter the 6-digit code from your email.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }

    setBusy(true);
    try {
      await authService.confirmPasswordReset({ email, code: code.trim(), new_password: password });
      setDone(true);
      toast.success('Password reset. You can now log in.');
    } catch (err) {
      const msg = errText(err, 'Invalid or expired code.');
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="card p-8">
          {done ? (
            <div className="text-center">
              <h2 className="text-3xl font-display font-bold mb-2">Password Reset</h2>
              <p className="text-gray-600 mb-8">
                Your password has been updated. You can now log in with your new password.
              </p>
              <button onClick={() => navigate('/login')} className="btn-primary w-full">
                Back to Login
              </button>
            </div>
          ) : step === 1 ? (
            <>
              <h2 className="text-3xl font-display font-bold text-center mb-2">Forgot Password</h2>
              <p className="text-center text-gray-600 mb-8">
                Enter your email and we'll send you a 6-digit reset code.
              </p>

              <form onSubmit={requestCode} className="space-y-6">
                <div>
                  <label className="label">Email</label>
                  <input
                    type="email"
                    className="input"
                    placeholder="your@email.com"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <button type="submit" className="btn-primary w-full" disabled={busy}>
                  {busy ? 'Sending...' : 'Send Reset Code'}
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-3xl font-display font-bold text-center mb-2">Enter Code</h2>
              <p className="text-center text-gray-600 mb-8">
                We've sent a 6-digit code to <span className="font-medium">{email}</span>.
                Enter it below with your new password.
              </p>

              <form onSubmit={confirmReset} className="space-y-6">
                <div>
                  <label className="label">6-digit code</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    className="input tracking-[0.5em] text-center text-lg"
                    placeholder="000000"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  />
                </div>

                <div>
                  <label className="label">New Password</label>
                  <PasswordInput
                    placeholder="••••••••"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  {password && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                        <div
                          className="h-full transition-all"
                          style={{ width: `${(s / 4) * 100}%`, background: STRENGTH_COLOR[s] }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{STRENGTH_LABEL[s]}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="label">Confirm New Password</label>
                  <PasswordInput
                    placeholder="••••••••"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                  />
                  {confirm && confirm !== password && (
                    <p className="mt-1 text-xs text-red-600">Passwords do not match.</p>
                  )}
                </div>

                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <button type="submit" className="btn-primary w-full" disabled={busy}>
                  {busy ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>

              <div className="mt-4 text-center text-sm text-gray-600">
                Didn't get it?{' '}
                <button
                  type="button"
                  onClick={requestCode}
                  disabled={busy}
                  className="text-primary-600 hover:underline font-medium disabled:opacity-50"
                >
                  Resend code
                </button>
              </div>
            </>
          )}

          {!done && (
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Remembered it?{' '}
                <Link to="/login" className="text-primary-600 hover:underline font-medium">
                  Back to Login
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
