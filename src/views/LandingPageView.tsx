import React, { useState } from 'react';
import {
  Wallet,
  Smartphone,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Sparkles,
  RefreshCw,
  HelpCircle,
  FileText,
  X,
  AlertCircle,
  Coffee,
  Check,
  ArrowRightLeft,
  Users2,
  PieChart
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatTaka } from '../domain/money';

interface LandingPageViewProps {
  currentTheme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenSupport: () => void;
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({
  currentTheme,
  onToggleTheme,
  onOpenSupport
}) => {
  const {
    loginGoogle,
    loginEmail,
    registerEmail,
    requestPasswordReset,
    loginDemoUser,
    isFirebaseReady,
    authError,
    clearAuthError
  } = useAuth();

  // Auth Mode: 'signin' | 'signup'
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forgot Password Modal
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);
  const [forgotCooldown, setForgotCooldown] = useState(0);

  // Info Modals
  const [infoModal, setInfoModal] = useState<'about' | 'privacy' | null>(null);

  const handleGoogleSignIn = async () => {
    setFormError(null);
    clearAuthError();
    setIsSubmitting(true);
    try {
      await loginGoogle();
    } catch (err: any) {
      setFormError(err?.message || 'Google sign in failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    clearAuthError();

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setFormError('Please enter your email address.');
      return;
    }
    if (!password) {
      setFormError('Please enter your password.');
      return;
    }

    if (authMode === 'signup') {
      if (!name.trim()) {
        setFormError('Please enter your name.');
        return;
      }
      if (password.length < 6) {
        setFormError('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setFormError('Passwords do not match. Please re-type your password.');
        return;
      }

      setIsSubmitting(true);
      try {
        await registerEmail(cleanEmail, password, name.trim());
      } catch (err: any) {
        setFormError(err?.message || 'Failed to create account.');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setIsSubmitting(true);
      try {
        await loginEmail(cleanEmail, password);
      } catch (err: any) {
        setFormError(err?.message || 'Failed to sign in.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;

    try {
      await requestPasswordReset(forgotEmail.trim());
    } catch {
      // Intentionally don't reveal failure to prevent account enumeration
    }
    setForgotSubmitted(true);
    setForgotCooldown(60);
    const interval = setInterval(() => {
      setForgotCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#111317] text-[#E2E2E8] flex flex-col justify-between selection:bg-[#73E3B4]/30 selection:text-[#73E3B4]">
      {/* Top Navigation */}
      <header className="h-16 border-b border-[#3D4943]/30 px-4 sm:px-8 max-w-7xl mx-auto w-full flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#1A1C20] border border-[#73E3B4]/50 flex items-center justify-center text-[#73E3B4] font-bold text-sm tracking-wider shadow-sm">
            Ec
          </div>
          <div>
            <div className="text-base font-bold text-[#E2E2E8] tracking-tight leading-none">
              EcO
            </div>
            <div className="text-[10px] text-[#87948C] font-mono tracking-wider uppercase mt-0.5">
              Smart Ledger · Bangladesh
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onToggleTheme}
            className="p-2 rounded-lg bg-[#1A1C20] hover:bg-[#282A2E] text-[#BCCAC1] hover:text-[#E2E2E8] border border-[#3D4943]/40 transition-colors cursor-pointer"
            title={`Switch to ${currentTheme === 'dark' ? 'Light' : 'Dark'} mode`}
            aria-label="Toggle theme"
          >
            {currentTheme === 'dark' ? <Sun className="w-4 h-4 text-[#FACC15]" /> : <Moon className="w-4 h-4 text-[#73E3B4]" />}
          </button>

          <button
            type="button"
            onClick={onOpenSupport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FFDD00] hover:bg-[#FACC15] text-xs text-[#1A1C20] font-bold shadow-sm transition-all cursor-pointer"
          >
            <Coffee className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">Support EcO</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-8 py-8 sm:py-12 space-y-16">
        {/* Firebase Config Notice Banner if placeholders ('***') remain */}
        {!isFirebaseReady && (
          <div className="p-4 rounded-xl bg-[#1A1C20] border border-[#73E3B4]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md animate-in fade-in">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-[#73E3B4] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold text-[#E2E2E8]">
                  Firebase Web App Configuration Placeholder Active
                </h4>
                <p className="text-[11px] text-[#BCCAC1] mt-0.5 leading-relaxed">
                  Your project credentials in <code className="text-[#73E3B4] bg-[#0C0E12] px-1 py-0.5 rounded">src/data/firebase.ts</code> contain placeholders (<code className="text-[#73E3B4]">***</code>).
                  You can explore with 1-Click Instant Preview or connect your Firebase Console anytime.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => loginDemoUser('Demo User', 'demo@eco.ledger')}
              className="px-3.5 py-2 rounded-lg bg-[#55C79A] hover:bg-[#73E3B4] text-[#003826] font-semibold text-xs whitespace-nowrap transition-colors shadow-sm self-start sm:self-auto cursor-pointer"
            >
              1-Click Instant Preview
            </button>
          </div>
        )}

        {/* HERO SECTION WITH EMBEDDED AUTH CARD */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Value Proposition */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1A1C20] border border-[#73E3B4]/40 text-[#73E3B4] text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-[#73E3B4] animate-pulse" />
              <span>Bangladeshi Personal Finance Ledger</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#E2E2E8] tracking-tight leading-tight">
              Money management <span className="text-[#73E3B4]">without confusion.</span>
            </h1>

            <p className="text-sm sm:text-base text-[#BCCAC1] leading-relaxed max-w-2xl">
              EcO is a calm, dependable personal expense tracker built specifically for Bangladesh.
              Effortlessly track Cash, bKash, and Nagad wallets, protect bills with an adaptive daily budget, and keep transparent debt records.
            </p>

            {/* Core Feature Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-[#1A1C20] border border-[#3D4943]/40 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#E2E2E8]">
                  <Wallet className="w-3.5 h-3.5 text-[#73E3B4]" />
                  <span>3 Core Wallets</span>
                </div>
                <p className="text-[11px] text-[#87948C]">Cash, bKash & Nagad with exact cashout fees</p>
              </div>

              <div className="p-3 rounded-xl bg-[#1A1C20] border border-[#3D4943]/40 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#E2E2E8]">
                  <TrendingUp className="w-3.5 h-3.5 text-[#73E3B4]" />
                  <span>Adaptive Budget</span>
                </div>
                <p className="text-[11px] text-[#87948C]">Bills & emergency reserve protected first</p>
              </div>

              <div className="p-3 rounded-xl bg-[#1A1C20] border border-[#3D4943]/40 space-y-1 col-span-2 sm:col-span-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#E2E2E8]">
                  <Users2 className="w-3.5 h-3.5 text-[#73E3B4]" />
                  <span>People Ledgers</span>
                </div>
                <p className="text-[11px] text-[#87948C]">WhatsApp debt reminders in polite Bangla</p>
              </div>
            </div>
          </div>

          {/* Right Column: Sign In / Sign Up Form */}
          <div className="lg:col-span-5">
            <div className="bg-[#1A1C20] border border-[#3D4943]/50 rounded-2xl p-6 sm:p-7 shadow-xl space-y-5">
              <div>
                <h3 className="text-lg font-bold text-[#E2E2E8] tracking-tight">
                  {authMode === 'signin' ? 'Sign in to your account' : 'Create your EcO account'}
                </h3>
                <p className="text-xs text-[#87948C] mt-0.5">
                  Private Google Cloud storage. Nobody else can see your data.
                </p>
              </div>

              {/* Error Alert */}
              {(formError || authError) && (
                <div className="p-3 rounded-xl bg-[#FFB4AB]/10 border border-[#FFB4AB]/30 text-xs text-[#FFB4AB] flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{formError || authError}</span>
                </div>
              )}

              {/* 1. Primary Action: Google Login */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-gray-100 text-gray-900 font-semibold text-xs flex items-center justify-center gap-2.5 transition-all shadow-sm active:scale-[0.99] cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-[#3D4943]/40" />
                <span className="text-[11px] text-[#87948C] uppercase tracking-wider">or with email</span>
                <div className="flex-1 h-px bg-[#3D4943]/40" />
              </div>

              {/* Tab Switcher: Sign In vs Sign Up */}
              <div className="flex rounded-lg bg-[#0C0E12] p-1 border border-[#3D4943]/40 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signin');
                    setFormError(null);
                  }}
                  className={`flex-1 py-1.5 rounded-md font-medium transition-colors ${
                    authMode === 'signin' ? 'bg-[#1E2024] text-[#73E3B4] shadow-sm' : 'text-[#87948C] hover:text-[#E2E2E8]'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signup');
                    setFormError(null);
                  }}
                  className={`flex-1 py-1.5 rounded-md font-medium transition-colors ${
                    authMode === 'signup' ? 'bg-[#1E2024] text-[#73E3B4] shadow-sm' : 'text-[#87948C] hover:text-[#E2E2E8]'
                  }`}
                >
                  Create Account
                </button>
              </div>

              {/* Email & Password Form */}
              <form onSubmit={handleEmailSubmit} className="space-y-3 text-xs">
                {authMode === 'signup' && (
                  <div>
                    <label className="block text-[11px] font-medium text-[#BCCAC1] mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Fardin Ahmed"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[#0C0E12] border border-[#3D4943]/50 text-xs text-[#E2E2E8] placeholder-[#87948C] outline-none focus:border-[#73E3B4]"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-medium text-[#BCCAC1] mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="you@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#0C0E12] border border-[#3D4943]/50 text-xs text-[#E2E2E8] placeholder-[#87948C] outline-none focus:border-[#73E3B4]"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-medium text-[#BCCAC1]">
                      Password
                    </label>
                    {authMode === 'signin' && (
                      <button
                        type="button"
                        onClick={() => {
                          setForgotEmail(email);
                          setForgotSubmitted(false);
                          setIsForgotOpen(true);
                        }}
                        className="text-[11px] text-[#73E3B4] hover:underline cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder={authMode === 'signup' ? 'At least 6 characters' : 'Enter your password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-3 pr-9 py-2 rounded-lg bg-[#0C0E12] border border-[#3D4943]/50 text-xs text-[#E2E2E8] placeholder-[#87948C] outline-none focus:border-[#73E3B4]"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2.5 text-[#87948C] hover:text-[#E2E2E8] cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {authMode === 'signup' && (
                  <div>
                    <label className="block text-[11px] font-medium text-[#BCCAC1] mb-1">
                      Confirm Password
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Repeat your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[#0C0E12] border border-[#3D4943]/50 text-xs text-[#E2E2E8] placeholder-[#87948C] outline-none focus:border-[#73E3B4]"
                      required
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-lg bg-[#55C79A] hover:bg-[#73E3B4] disabled:opacity-50 text-[#003826] font-semibold text-xs transition-colors shadow-sm cursor-pointer mt-2"
                >
                  {isSubmitting
                    ? 'Processing...'
                    : authMode === 'signin'
                    ? 'Sign In'
                    : 'Create My Account'}
                </button>
              </form>

              {/* Privacy Footer */}
              <p className="text-[10px] text-[#87948C] text-center pt-2 border-t border-[#3D4943]/20">
                By continuing, you agree to EcO's{' '}
                <button
                  type="button"
                  onClick={() => setInfoModal('privacy')}
                  className="text-[#73E3B4] hover:underline cursor-pointer"
                >
                  Privacy Policy
                </button>
                . Your data is never sold or shared.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 2: HOW THE MONEY FLOW WORKS */}
        <section className="space-y-6 pt-6">
          <div className="text-center max-w-xl mx-auto space-y-1.5">
            <h2 className="text-xl sm:text-2xl font-bold text-[#E2E2E8] tracking-tight">
              The EcO Money Flow
            </h2>
            <p className="text-xs text-[#BCCAC1]">
              A logical 6-step cycle that turns daily chaos into effortless financial clarity.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { step: '1', title: 'Earn', desc: 'Salary, freelance & profit logged to specific accounts' },
              { step: '2', title: 'Store', desc: 'Cash, bKash & Nagad balances stay strictly tracked' },
              { step: '3', title: 'Spend', desc: 'Everyday costs use up your daily limit' },
              { step: '4', title: 'Lend & Borrow', desc: 'Personal loans recorded with polite reminders' },
              { step: '5', title: 'Understand', desc: 'Visual analytics, category burn & liquid position' },
              { step: '6', title: 'Decide Better', desc: 'Adaptive limit recalibrates every single day' }
            ].map((s) => (
              <div
                key={s.step}
                className="p-4 rounded-xl bg-[#1A1C20] border border-[#3D4943]/40 flex flex-col justify-between space-y-3"
              >
                <div className="w-7 h-7 rounded-lg bg-[#0C0E12] border border-[#73E3B4]/40 flex items-center justify-center text-[#73E3B4] font-mono font-bold text-xs">
                  {s.step}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#E2E2E8]">{s.title}</h4>
                  <p className="text-[11px] text-[#87948C] mt-1 leading-snug">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 3: THE 5 QUESTIONS ECO ANSWERS EVERY DAY */}
        <section className="p-6 sm:p-8 rounded-2xl bg-[#1A1C20] border border-[#3D4943]/40 space-y-6">
          <div className="max-w-xl space-y-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#73E3B4]">
              Clarity on Demand
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-[#E2E2E8] tracking-tight">
              5 Questions EcO Answers in 5 Seconds
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { q: 'How much liquid money do I have right now?', a: 'Instant breakdown of physical Cash and mobile accounts (bKash & Nagad) with exact operator fee deductions.' },
              { q: 'Where did my money go this month?', a: 'Clean category breakdowns for groceries, food, transport, and utilities without drowning in micro-receipts.' },
              { q: 'How much can I safely spend today?', a: 'An adaptive daily budget formula that automatically reserves rent, bills, and emergency funds before setting your daily limit.' },
              { q: 'Who owes me money, and how long has it been?', a: 'Maturity milestones (7 days, 1 month, 3 months) with one-click culturally polite Bangla WhatsApp reminders.' },
              { q: 'How much do I owe others?', a: 'Unambiguous record of personal borrowings so you never forget a loan from a colleague or friend.' }
            ].map((item, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-[#0C0E12] border border-[#3D4943]/30 space-y-2">
                <div className="text-xs font-semibold text-[#E2E2E8] flex items-start gap-2">
                  <span className="text-[#73E3B4] font-mono font-bold">0{idx + 1}.</span>
                  <span>{item.q}</span>
                </div>
                <p className="text-[11px] text-[#87948C] leading-relaxed pl-6">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 4: HONEST PRIVACY PROMISE */}
        <section className="p-6 sm:p-8 rounded-2xl bg-[#0C0E12] border border-[#3D4943]/50 space-y-5">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#73E3B4]">
              <Lock className="w-3.5 h-3.5" />
              <span>Honest, No-Nonsense Privacy</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#E2E2E8] tracking-tight">
              Your financial records belong exclusively to you.
            </h2>
            <p className="text-xs text-[#BCCAC1] leading-relaxed">
              We do not make exaggerated marketing claims like "military-grade". Instead, we follow straightforward, transparent engineering rules:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            <div className="space-y-1">
              <div className="text-xs font-semibold text-[#E2E2E8]">Google Cloud Tenancy</div>
              <p className="text-[11px] text-[#87948C] leading-relaxed">
                All records live in your isolated user collection on Google Firebase with strict authorization rules.
              </p>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-semibold text-[#E2E2E8]">No Bank Passwords</div>
              <p className="text-[11px] text-[#87948C] leading-relaxed">
                EcO never asks for bank PINs, OTPs, or SMS access. You maintain full control over what is recorded.
              </p>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-semibold text-[#E2E2E8]">Zero Ads or Trackers</div>
              <p className="text-[11px] text-[#87948C] leading-relaxed">
                We do not sell data, partner with lending brokers, or run third-party advertising scripts.
              </p>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-semibold text-[#E2E2E8]">1-Click Export & Deletion</div>
              <p className="text-[11px] text-[#87948C] leading-relaxed">
                Download your complete JSON backup or permanently purge all records from Firebase whenever you wish.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#3D4943]/30 py-6 px-4 sm:px-8 max-w-7xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#87948C]">
        <div>
          © {new Date().getFullYear()} EcO Smart Ledger · Bangladesh
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setInfoModal('about')}
            className="hover:text-[#E2E2E8] transition-colors cursor-pointer"
          >
            About EcO
          </button>
          <span>·</span>
          <button
            type="button"
            onClick={() => setInfoModal('privacy')}
            className="hover:text-[#E2E2E8] transition-colors cursor-pointer"
          >
            Privacy Policy
          </button>
          <span>·</span>
          <button
            type="button"
            onClick={onOpenSupport}
            className="hover:text-[#FACC15] transition-colors cursor-pointer"
          >
            Support Project
          </button>
        </div>
      </footer>

      {/* --- FORGOT PASSWORD MODAL --- */}
      {isForgotOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsForgotOpen(false);
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-[#1A1C20] border border-[#3D4943]/60 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#3D4943]/30 pb-3">
              <h3 className="text-sm font-semibold text-[#E2E2E8] flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#73E3B4]" />
                <span>Reset Your Password</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsForgotOpen(false)}
                className="p-1 rounded text-[#87948C] hover:text-[#E2E2E8] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {forgotSubmitted ? (
              <div className="space-y-4 text-xs">
                <div className="p-3.5 rounded-xl bg-[#73E3B4]/10 border border-[#73E3B4]/30 text-[#73E3B4] flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">Password Reset Link Sent</span>
                    <p className="text-[11px] text-[#BCCAC1] mt-1 leading-relaxed">
                      If an account is associated with <strong>{forgotEmail}</strong>, a password reset link has been dispatched. Please check your inbox and spam folder.
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsForgotOpen(false)}
                    className="px-4 py-2 rounded-lg bg-[#55C79A] hover:bg-[#73E3B4] text-[#003826] font-semibold text-xs transition-colors"
                  >
                    Return to Sign In
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-3.5 text-xs">
                <p className="text-[#BCCAC1] text-xs leading-relaxed">
                  Enter your account's email address below and we'll send you a secure link to create a new password.
                </p>

                <div>
                  <label className="block text-[11px] font-medium text-[#BCCAC1] mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="you@domain.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#0C0E12] border border-[#3D4943]/50 text-xs text-[#E2E2E8] outline-none focus:border-[#73E3B4]"
                    required
                    autoFocus
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#3D4943]/30">
                  <button
                    type="button"
                    onClick={() => setIsForgotOpen(false)}
                    className="px-3.5 py-2 rounded-lg text-xs text-[#87948C] hover:text-[#E2E2E8]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotCooldown > 0}
                    className="px-4 py-2 rounded-lg bg-[#55C79A] hover:bg-[#73E3B4] disabled:opacity-50 text-[#003826] font-semibold text-xs transition-colors shadow-sm"
                  >
                    {forgotCooldown > 0 ? `Wait ${forgotCooldown}s` : 'Send Reset Link'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* --- INFO / ABOUT / PRIVACY MODAL --- */}
      {infoModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setInfoModal(null);
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg bg-[#1A1C20] border border-[#3D4943]/60 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#3D4943]/30 pb-3">
              <h3 className="text-sm font-semibold text-[#E2E2E8] flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#73E3B4]" />
                <span>{infoModal === 'about' ? 'About EcO Smart Ledger' : 'Privacy Policy'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setInfoModal(null)}
                className="p-1 rounded text-[#87948C] hover:text-[#E2E2E8] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {infoModal === 'about' ? (
              <div className="space-y-3 text-xs text-[#BCCAC1] leading-relaxed">
                <p>
                  <strong>EcO</strong> is an independent, user-first personal finance tracking application engineered for Bangladeshi individuals, students, freelancers, and professionals.
                </p>
                <p>
                  Unlike typical generic budgeting apps, EcO addresses the real financial ecosystem of Bangladesh:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-1 text-[#E2E2E8]">
                  <li>Native Cash, bKash, and Nagad wallets with standard operator fees (1.85%, 1.49%, 1.395%).</li>
                  <li>Adaptive daily budget formula that automatically isolates fixed utility bills, rent, and emergency cushions before setting everyday allowance.</li>
                  <li>Cultural debt ledgers with milestone tracking (7d, 1mo, 3mo) and polite Bangla WhatsApp reminder templates.</li>
                </ul>
                <p>
                  Built with high-performance React and Google Firebase Firestore, all records are stored in private cloud tenancy with zero ads and zero tracking scripts.
                </p>
              </div>
            ) : (
              <div className="space-y-3 text-xs text-[#BCCAC1] leading-relaxed">
                <p>
                  <strong>Our Privacy Commitment:</strong>
                </p>
                <p>
                  1. <strong>Private Tenancy:</strong> When you sign in with Google or Email, your data is written solely to your private path on Google Cloud Firebase Firestore (<code className="text-[#73E3B4]">users/{'{userId}'}/*</code>). Firestore Security Rules strictly prohibit any other authenticated user from reading or modifying your records.
                </p>
                <p>
                  2. <strong>No Financial Credentials:</strong> EcO is an offline-friendly ledger. It does not connect to bank APIs, scrape SMS messages, or ask for bank/MFS login credentials.
                </p>
                <p>
                  3. <strong>Data Portability:</strong> You can export a comprehensive JSON snapshot of your accounts, transactions, and categories at any time from Settings.
                </p>
                <p>
                  4. <strong>Right to Erasure:</strong> You can delete all your financial records or permanently close your account directly in the Settings menu with double confirmation.
                </p>
              </div>
            )}

            <div className="pt-2 flex justify-end border-t border-[#3D4943]/30">
              <button
                type="button"
                onClick={() => setInfoModal(null)}
                className="px-4 py-1.5 rounded-lg bg-[#282A2E] text-xs font-semibold text-[#E2E2E8]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
