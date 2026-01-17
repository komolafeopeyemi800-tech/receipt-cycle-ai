import '@fortawesome/fontawesome-free/css/all.min.css';

export default function Home() {
  return (
    <div className="font-sans bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/40 overflow-x-hidden">
      <div
        id="status-bar"
        className="fixed top-0 left-0 right-0 h-10 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-between px-4 shadow-sm"
      >
        <div className="text-xs font-semibold text-gray-900">9:41</div>
        <div className="flex items-center gap-1">
          <i className="fas fa-signal text-xs text-gray-900"></i>
          <i className="fas fa-wifi text-xs text-gray-900 ml-1"></i>
          <i className="fas fa-battery-full text-xs text-gray-900 ml-1"></i>
        </div>
      </div>
      <div id="root-container" className="pt-10 min-h-screen flex flex-col">
        <div id="top-brand-block" className="px-6 pt-12 pb-8 text-center">
          <div className="w-24 h-24 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-primary to-teal-600 shadow-xl shadow-primary/30 flex items-center justify-center transform hover:scale-105 transition-transform duration-300">
            <i className="fas fa-receipt text-4xl text-white"></i>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">
            Receipt Cycle
          </h1>
          <p className="text-sm text-gray-500 font-medium">
            Scan Once. Claim Your Tax Refund
          </p>
        </div>
        <div id="primary-value-block" className="px-6 pb-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3 leading-tight">
            Smart Expense Tracking Made Simple
          </h2>
          <p className="text-base text-gray-600 leading-relaxed max-w-sm mx-auto">
            AI-powered expense manager that scans receipts, tracks spending
            automatically, and reveals money leaks in seconds.
          </p>
        </div>
        <div id="feature-highlight-block" className="px-6 pb-8">
          <div className="bg-white/60 backdrop-blur-sm rounded-3xl shadow-lg shadow-gray-200/50 p-6 space-y-5 border border-gray-100/50">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/10 to-teal-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                <i className="fas fa-camera text-xl text-primary"></i>
              </div>
              <div className="flex-1 pt-1">
                <h3 className="text-base font-semibold text-gray-900 mb-1">
                  Scan Receipts Instantly
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Capture receipts with your camera and extract all details
                  automatically using advanced OCR technology.
                </p>
              </div>
            </div>
            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                <i className="fas fa-cloud-upload-alt text-xl text-blue-600"></i>
              </div>
              <div className="flex-1 pt-1">
                <h3 className="text-base font-semibold text-gray-900 mb-1">
                  Upload Bank Statements
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Import CSV, OFX, or PDF statements seamlessly. Paste
                  transactions directly from your banking app.
                </p>
              </div>
            </div>
            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                <i className="fas fa-chart-line text-xl text-purple-600"></i>
              </div>
              <div className="flex-1 pt-1">
                <h3 className="text-base font-semibold text-gray-900 mb-1">
                  AI-Powered Insights
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Automatic categorization, money leak detection, and actionable
                  savings recommendations powered by AI.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div id="benefits-block" className="px-6 pb-8">
          <div className="bg-gradient-to-br from-primary/5 to-teal-50/50 rounded-3xl p-6 border border-primary/10 shadow-lg shadow-primary/5">
            <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">
              Why Receipt Cycle?
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-check text-xs text-primary"></i>
                </div>
                <p className="text-sm text-gray-700 font-medium">
                  Detect recurring subscriptions and hidden fees
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-check text-xs text-primary"></i>
                </div>
                <p className="text-sm text-gray-700 font-medium">
                  Smart merchant normalization and matching
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-check text-xs text-primary"></i>
                </div>
                <p className="text-sm text-gray-700 font-medium">
                  Multi-level categorization with AI assistance
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-check text-xs text-primary"></i>
                </div>
                <p className="text-sm text-gray-700 font-medium">
                  Budget tracking with real-time alerts
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-check text-xs text-primary"></i>
                </div>
                <p className="text-sm text-gray-700 font-medium">
                  Export detailed reports for tax season
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-check text-xs text-primary"></i>
                </div>
                <p className="text-sm text-gray-700 font-medium">
                  Works offline - sync when you're ready
                </p>
              </div>
            </div>
          </div>
        </div>
        <div id="stats-showcase-block" className="px-6 pb-8">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 text-center shadow-md shadow-gray-200/40 border border-gray-100/50">
              <div className="text-2xl font-bold text-primary mb-1">99.8%</div>
              <div className="text-xs text-gray-600 font-medium">OCR Accuracy</div>
            </div>
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 text-center shadow-md shadow-gray-200/40 border border-gray-100/50">
              <div className="text-2xl font-bold text-primary mb-1">&lt;60s</div>
              <div className="text-xs text-gray-600 font-medium">To Insights</div>
            </div>
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 text-center shadow-md shadow-gray-200/40 border border-gray-100/50">
              <div className="text-2xl font-bold text-primary mb-1">$847</div>
              <div className="text-xs text-gray-600 font-medium">Avg. Savings</div>
            </div>
          </div>
        </div>
        <div id="testimonial-block" className="px-6 pb-8">
          <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 shadow-lg shadow-gray-200/50 border border-gray-100/50">
            <div className="flex items-center gap-3 mb-4">
              <img
                src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-5.jpg"
                alt="User"
                className="w-12 h-12 rounded-full object-cover shadow-md"
              />
              <div>
                <div className="text-sm font-semibold text-gray-900">
                  Sarah Mitchell
                </div>
                <div className="flex items-center gap-1">
                  <i className="fas fa-star text-xs text-amber-400"></i>
                  <i className="fas fa-star text-xs text-amber-400"></i>
                  <i className="fas fa-star text-xs text-amber-400"></i>
                  <i className="fas fa-star text-xs text-amber-400"></i>
                  <i className="fas fa-star text-xs text-amber-400"></i>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed italic">
              "Receipt Cycle found $342 in duplicate subscriptions I didn't even
              know I had. The AI categorization is incredibly accurate and saves
              me hours every month!"
            </p>
          </div>
        </div>
        <div id="comparison-block" className="px-6 pb-8"></div>
        <div id="primary-action-block" className="px-6 pb-6">
          <button className="w-full h-14 bg-gradient-to-r from-primary to-teal-600 text-white text-base font-semibold rounded-2xl shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]">
            Get Started
          </button>
        </div>
        <div id="secondary-action-block" className="px-6 pb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
            <span className="text-xs text-gray-500 font-medium">
              or continue with
            </span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
          </div>
          <button className="w-full h-12 bg-white text-gray-900 text-sm font-semibold rounded-xl shadow-md shadow-gray-200/50 hover:shadow-lg transition-all duration-300 border border-gray-200 flex items-center justify-center gap-2 mb-3 active:scale-[0.98]">
            <i className="fab fa-google text-base"></i>
            Continue with Google
          </button>
          <button className="w-full h-12 bg-white text-gray-900 text-sm font-semibold rounded-xl shadow-md shadow-gray-200/50 hover:shadow-lg transition-all duration-300 border border-gray-200 flex items-center justify-center gap-2 active:scale-[0.98]">
            <i className="fas fa-envelope text-base"></i>
            Continue with Email
          </button>
        </div>
        <div id="pricing-preview-block" className="px-6 pb-8"></div>
        <div id="bottom-safe-area" className="h-8"></div>
      </div>
    </div>
  );
}
