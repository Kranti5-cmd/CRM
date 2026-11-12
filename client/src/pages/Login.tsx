import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  GraduationCap,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Zap,
  Users,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('krantishantveer@gmail.com');
  const [password, setPassword] = useState('Kranti@123');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter your email and password');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back to CodeLekho CRM!');
      navigate('/');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (quickEmail: string, quickPass: string, roleName: string) => {
    setEmail(quickEmail);
    setPassword(quickPass);
    toast.success(`Selected ${roleName} credentials! Click Sign In.`);
  };

  return (
    <div className="min-h-screen w-full flex bg-[#F8F5EE]">
      {/* ========================================================================= */}
      {/* LEFT SHOWCASE PANEL (Visible on lg+ screens)                             */}
      {/* ========================================================================= */}
      <div className="hidden lg:flex lg:w-[54%] relative overflow-hidden bg-gradient-to-br from-[#01281E] via-[#013A2B] to-[#0C2D26] text-white p-12 xl:p-16 flex-col justify-between">
        {/* Ambient Glow Orbs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-emerald-500/15 blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-teal-400/10 blur-[100px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-80 h-80 rounded-full bg-emerald-400/10 blur-[90px] pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400/25 to-teal-400/10 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shadow-lg shadow-emerald-950/40">
            <GraduationCap className="w-6 h-6 text-emerald-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight text-white">CodeLekho</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 font-semibold tracking-wide">
                CRM
              </span>
            </div>
            <p className="text-xs text-emerald-200/70 font-medium">Arshith Boot Camp Enterprise Edition</p>
          </div>
        </div>

        {/* Hero Middle Showcase */}
        <div className="relative z-10 max-w-xl my-auto py-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md text-xs font-semibold text-emerald-300">
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            <span>Centralized Student Admissions & Telemetry</span>
          </div>

          <h1 className="text-3xl xl:text-4xl 2xl:text-5xl font-black tracking-tight leading-tight text-white">
            Accelerating Tech Careers with Intelligent CRM & Admissions.
          </h1>

          <p className="text-sm xl:text-base text-emerald-100/80 leading-relaxed">
            A unified operations workspace for academic counselors, technical mentors, and executive management. Real-time fee tracking in Indian Rupees (₹), live Supabase poller, and Brevo transactional communications.
          </p>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-4">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-2.5 text-emerald-300">
                <Users className="w-4 h-4" />
              </div>
              <div className="text-lg font-bold text-white">120+</div>
              <div className="text-xs text-emerald-200/70">Real Enrolled Learners</div>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="w-8 h-8 rounded-xl bg-teal-500/20 flex items-center justify-center mb-2.5 text-teal-300">
                <Zap className="w-4 h-4" />
              </div>
              <div className="text-lg font-bold text-white">60s</div>
              <div className="text-xs text-teal-200/70">Live Supabase Polling</div>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center mb-2.5 text-purple-300">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="text-lg font-bold text-white">99.6%</div>
              <div className="text-xs text-purple-200/70">Brevo Email Delivery</div>
            </div>
          </div>
        </div>

        {/* Footer Brand Credit */}
        <div className="relative z-10 flex items-center justify-between text-xs text-emerald-200/60 pt-6 border-t border-white/10">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>TLS 256-Bit Encrypted CRM Session</span>
          </div>
          <span>Powered by Arshith Group</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RIGHT LOGIN FORM PANEL                                                    */}
      {/* ========================================================================= */}
      <div className="w-full lg:w-[46%] flex flex-col justify-center items-center p-6 sm:p-10 md:p-14">
        <div className="w-full max-w-md space-y-7">
          {/* Mobile Brand Header (Visible on mobile/tablet) */}
          <div className="lg:hidden flex items-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-2xl bg-[#013A2B] text-emerald-300 flex items-center justify-center shadow-md">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-[#0C2D26]">CodeLekho</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-[#013A2B] font-bold">
                  CRM
                </span>
              </div>
              <p className="text-xs text-slate-500">Arshith Boot Camp</p>
            </div>
          </div>

          {/* Form Header */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Welcome back
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
              Sign in to access student management, admissions pipeline, and analytics.
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-[#FBF8F1] rounded-2xl border border-[#426557]/25 p-7 sm:p-8 shadow-xs space-y-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@codelekho.com"
                    className="input-field pl-10"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      toast('Default passwords: Kranti@123 or password123. Use quick-fill below.', {
                        icon: 'ℹ️',
                      })
                    }
                    className="text-xs font-semibold text-[#013A2B] hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="input-field pl-10 pr-10"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 text-[#013A2B] focus:ring-[#013A2B]"
                  />
                  <span className="font-medium">Remember this browser</span>
                </label>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Live Sync
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 mt-2 text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-[#013A2B]/20 transition-all hover:shadow-lg hover:shadow-[#013A2B]/30"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick-Fill Team Credentials */}
            <div className="pt-4 border-t border-[#426557]/15 space-y-2.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <span>Quick Team Fill (Click to load)</span>
                <span className="text-[#013A2B] font-bold">1-Click</span>
              </div>

              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() =>
                    handleQuickFill('krantishantveer@gmail.com', 'Kranti@123', 'Kranti Shantveer')
                  }
                  className="w-full text-left p-2.5 rounded-xl bg-white/90 border border-[#426557]/20 hover:border-[#013A2B] hover:bg-white transition flex items-center justify-between group"
                >
                  <div className="min-w-0 pr-2">
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>Kranti Shantveer</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold">
                        Manager
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate mt-0.5">
                      krantishantveer@gmail.com
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-[#013A2B] opacity-0 group-hover:opacity-100 transition shrink-0">
                    Auto-Fill →
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleQuickFill('admissions@arshithbootcamp.com', 'password123', 'Admissions Office')
                  }
                  className="w-full text-left p-2.5 rounded-xl bg-white/90 border border-[#426557]/20 hover:border-[#013A2B] hover:bg-white transition flex items-center justify-between group"
                >
                  <div className="min-w-0 pr-2">
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-purple-500" />
                      <span>Admissions Office</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 font-bold">
                        Admin
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate mt-0.5">
                      admissions@arshithbootcamp.com
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-[#013A2B] opacity-0 group-hover:opacity-100 transition shrink-0">
                    Auto-Fill →
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleQuickFill('chanukya110@gmail.com', 'password123', 'Chanikya Battu')
                  }
                  className="w-full text-left p-2.5 rounded-xl bg-white/90 border border-[#426557]/20 hover:border-[#013A2B] hover:bg-white transition flex items-center justify-between group"
                >
                  <div className="min-w-0 pr-2">
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <span>Chanikya Battu</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 font-bold">
                        Admin
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate mt-0.5">
                      chanukya110@gmail.com
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-[#013A2B] opacity-0 group-hover:opacity-100 transition shrink-0">
                    Auto-Fill →
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Security Note */}
          <div className="text-center text-xs text-slate-500 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Authorized access only · CodeLekho Admissions Cloud</span>
          </div>
        </div>
      </div>
    </div>
  );
}
