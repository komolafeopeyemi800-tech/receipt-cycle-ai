import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ResponsiveLayout from "@/components/layout/ResponsiveLayout";

const MobileSignIn = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="font-sans bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/40 overflow-x-hidden">
      <div id="status-bar" className="fixed top-0 left-0 right-0 h-10 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-between px-4 shadow-sm">
        <div className="text-xs font-semibold text-gray-900">9:41</div>
        <div className="flex items-center gap-1">
          <i className="fas fa-signal text-xs text-gray-900"></i>
          <i className="fas fa-wifi text-xs text-gray-900 ml-1"></i>
          <i className="fas fa-battery-full text-xs text-gray-900 ml-1"></i>
        </div>
      </div>

      <div id="root-container" className="pt-10 min-h-screen flex flex-col">
        <div id="back-navigation-header" className="px-6 pt-6 pb-4">
          <button onClick={handleBack} className="flex items-center gap-2 text-gray-700 hover:text-primary transition-colors">
            <i className="fas fa-arrow-left text-lg"></i>
            <span className="text-sm font-medium">Back</span>
          </button>
        </div>

        <div id="signin-brand-block" className="px-6 pt-8 pb-6 text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-primary to-teal-600 shadow-xl shadow-primary/30 flex items-center justify-center transform hover:scale-105 transition-transform duration-300">
            <i className="fas fa-receipt text-3xl text-white"></i>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1 tracking-tight">Welcome Back</h1>
          <p className="text-sm text-gray-500 font-medium">Sign in to continue tracking</p>
        </div>

        <div id="signin-form-block" className="px-6 pb-6">
          <div className="bg-white/60 backdrop-blur-sm rounded-3xl shadow-lg shadow-gray-200/50 p-6 border border-gray-100/50">
            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-900 mb-2">Email Address</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <i className="fas fa-envelope text-sm"></i>
                </div>
                <input 
                  type="email" 
                  placeholder="your@email.com" 
                  className="w-full h-12 pl-11 pr-4 bg-white rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-900 mb-2">Password</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <i className="fas fa-lock text-sm"></i>
                </div>
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Enter your password" 
                  className="w-full h-12 pl-11 pr-12 bg-white rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
                <button 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-sm`}></i>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between mb-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/20 focus:ring-2" />
                <span className="text-xs text-gray-600 font-medium">Remember me</span>
              </label>
              <a href="#" className="text-xs text-primary font-semibold hover:text-primary-dark transition-colors">Forgot Password?</a>
            </div>

            <button className="w-full h-12 bg-gradient-to-r from-primary to-teal-600 text-white text-base font-semibold rounded-xl shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] mb-4">
              Sign In
            </button>

            <div className="text-center">
              <p className="text-sm text-gray-600">Don't have an account? <a href="/signup" className="text-primary font-semibold hover:text-primary-dark transition-colors">Sign Up</a></p>
            </div>
          </div>
        </div>

        <div id="signin-divider-block" className="px-6 pb-6">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
            <span className="text-xs text-gray-500 font-medium">or continue with</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
          </div>
        </div>

        <div id="social-signin-block" className="px-6 pb-6">
          <button className="w-full h-12 bg-white text-gray-900 text-sm font-semibold rounded-xl shadow-md shadow-gray-200/50 hover:shadow-lg transition-all duration-300 border border-gray-200 flex items-center justify-center gap-2 mb-3 active:scale-[0.98]">
            <i className="fab fa-google text-base text-red-500"></i>
            Continue with Google
          </button>
        </div>

        <div id="signin-security-block" className="px-6 pb-6">
          <div className="bg-gradient-to-br from-primary/5 to-teal-50/50 rounded-2xl p-4 border border-primary/10">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/80 flex items-center justify-center flex-shrink-0 shadow-sm">
                <i className="fas fa-shield-alt text-lg text-primary"></i>
              </div>
              <div className="flex-1 pt-1">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">Your Data is Secure</h3>
                <p className="text-xs text-gray-600 leading-relaxed">All credentials are encrypted end-to-end. We never store your password in plain text.</p>
              </div>
            </div>
          </div>
        </div>

        <div id="signin-trust-block" className="px-6 pb-6">
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <i className="fas fa-lock text-xs text-primary"></i>
              <span className="text-xs text-gray-600 font-medium">256-bit Encryption</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-gray-300"></div>
            <div className="flex items-center gap-1.5">
              <i className="fas fa-user-shield text-xs text-primary"></i>
              <span className="text-xs text-gray-600 font-medium">GDPR Compliant</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-gray-300"></div>
            <div className="flex items-center gap-1.5">
              <i className="fas fa-check-circle text-xs text-primary"></i>
              <span className="text-xs text-gray-600 font-medium">SOC 2 Certified</span>
            </div>
          </div>
        </div>

        <div id="bottom-safe-area" className="h-8"></div>
      </div>
    </div>
  );
};

const DesktopSignIn = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <ResponsiveLayout
      variant="auth"
      showSidebar={false}
      mobileContent={<MobileSignIn />}
    >
      <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-lg shadow-gray-200/50 p-8 border border-gray-100/50">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-primary to-teal-600 shadow-xl shadow-primary/20 flex items-center justify-center">
            <i className="fas fa-receipt text-2xl text-white"></i>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1 tracking-tight">Welcome Back</h1>
          <p className="text-sm text-gray-600">Sign in to continue tracking</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Email Address</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <i className="fas fa-envelope text-sm"></i>
              </div>
              <input
                type="email"
                placeholder="your@email.com"
                className="w-full h-12 pl-11 pr-4 bg-white rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Password</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <i className="fas fa-lock text-sm"></i>
              </div>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                className="w-full h-12 pl-11 pr-12 bg-white rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"} text-sm`}></i>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/20 focus:ring-2" />
              <span className="text-xs text-gray-600 font-medium">Remember me</span>
            </label>
            <a href="#" className="text-xs text-primary font-semibold hover:underline">Forgot Password?</a>
          </div>

          <button className="w-full h-12 bg-gradient-to-r from-primary to-teal-600 text-white text-base font-semibold rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl transition-all duration-300">
            Sign In
          </button>

          <div className="text-center text-sm text-gray-600">
            Don&apos;t have an account?{" "}
            <a href="/signup" className="text-primary font-semibold hover:underline">Sign Up</a>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
            <span className="text-xs text-gray-500 font-medium">or continue with</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
          </div>

          <button className="w-full h-12 bg-white text-gray-900 text-sm font-semibold rounded-xl shadow-md shadow-gray-200/50 hover:shadow-lg transition-all duration-300 border border-gray-200 flex items-center justify-center gap-2">
            <i className="fab fa-google text-base text-red-500"></i>
            Continue with Google
          </button>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-full h-11 bg-gray-100/70 rounded-xl text-gray-700 text-sm font-semibold hover:bg-gray-200/70 transition-colors"
          >
            Back
          </button>
        </div>
      </div>
    </ResponsiveLayout>
  );
};

const SignIn = () => {
  // ResponsiveLayout already handles mobile vs desktop
  return <DesktopSignIn />;
};

export default SignIn;
