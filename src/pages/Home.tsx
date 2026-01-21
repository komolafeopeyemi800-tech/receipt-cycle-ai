import '@fortawesome/fontawesome-free/css/all.min.css';
import { useNavigate } from 'react-router-dom';
import { useScreenSize } from '@/hooks/use-screen-size';
import DesktopNav from '@/components/layout/DesktopNav';
import DesktopFooter from '@/components/layout/DesktopFooter';

// Mobile version of the home page
const MobileHome = () => {
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
};

// Desktop version - Full SaaS Landing Page
const DesktopHome = () => {
  const navigate = useNavigate();

  return (
    <div className="font-sans bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/40 min-h-screen">
      <DesktopNav variant="landing" />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-6">
                <i className="fas fa-bolt text-primary text-sm"></i>
                <span className="text-sm font-semibold text-primary">AI-Powered Expense Tracking</span>
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Simplify Receipt Management with{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-teal-600">
                  AI Data Capture
                </span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed max-w-xl">
                Scan receipts instantly, detect money leaks automatically, and get AI-powered insights to save smarter. The most accurate first-party consumer data.
              </p>
              <div className="flex flex-wrap gap-4 mb-8">
                <button 
                  onClick={() => navigate('/signup')}
                  className="h-14 px-8 bg-gradient-to-r from-primary to-teal-600 text-white text-lg font-semibold rounded-xl shadow-lg shadow-primary/30 hover:shadow-xl transition-all flex items-center gap-2"
                >
                  Get Started Free
                  <i className="fas fa-arrow-right"></i>
                </button>
                <button className="h-14 px-8 bg-white text-gray-900 text-lg font-semibold rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-all flex items-center gap-2">
                  <i className="fas fa-play-circle text-primary"></i>
                  Watch Demo
                </button>
              </div>
              <div className="flex items-center gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <i className="fas fa-check-circle text-primary"></i>
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <i className="fas fa-check-circle text-primary"></i>
                  <span>14-day free trial</span>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-gradient-to-br from-primary/10 to-teal-50 rounded-3xl p-8 shadow-2xl">
                <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-teal-600 flex items-center justify-center">
                      <i className="fas fa-receipt text-2xl text-white"></i>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-gray-900">Receipt Scanned</div>
                      <div className="text-sm text-gray-500">Whole Foods Market</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Amount</span>
                      <span className="font-bold text-gray-900">$124.67</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Category</span>
                      <span className="px-2 py-1 bg-primary/10 text-primary rounded-lg text-xs font-semibold">Groceries</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">AI Confidence</span>
                      <span className="font-bold text-primary">99.8%</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                      <i className="fas fa-lightbulb text-amber-600"></i>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">Money Leak Detected!</div>
                      <div className="text-xs text-gray-600">You could save $342/month on subscriptions</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 bg-white rounded-xl shadow-lg p-3 animate-float">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                    <i className="fas fa-check text-green-600 text-sm"></i>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">Auto-Categorized</span>
                </div>
              </div>
              
              <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg p-3 animate-float" style={{ animationDelay: '0.5s' }}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <i className="fas fa-sync text-blue-600 text-sm"></i>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">Real-time Sync</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="py-12 bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-sm font-medium text-gray-500 mb-8">Trusted by leading companies worldwide</p>
          <div className="flex flex-wrap items-center justify-center gap-12 opacity-60">
            <div className="text-2xl font-bold text-gray-400">Fetch</div>
            <div className="text-2xl font-bold text-gray-400">Ibotta</div>
            <div className="text-2xl font-bold text-gray-400">Instacart</div>
            <div className="text-2xl font-bold text-gray-400">Upside</div>
            <div className="text-2xl font-bold text-gray-400">Dosh</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">The Most Accurate First-Party Consumer Data</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our AI-powered OCR technology extracts every detail from your receipts with industry-leading accuracy.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/10 to-teal-100 flex items-center justify-center mb-6">
                <i className="fas fa-camera text-2xl text-primary"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Powerful Receipt Scanner</h3>
              <p className="text-gray-600 leading-relaxed">
                Capture receipts with your camera or upload images. Our OCR extracts all details including line items, taxes, and totals.
              </p>
            </div>
            
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center mb-6">
                <i className="fas fa-brain text-2xl text-blue-600"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">AI-Powered Insights</h3>
              <p className="text-gray-600 leading-relaxed">
                Automatic categorization, money leak detection, and actionable savings recommendations powered by advanced AI.
              </p>
            </div>
            
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center mb-6">
                <i className="fas fa-chart-line text-2xl text-purple-600"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Detailed Analytics</h3>
              <p className="text-gray-600 leading-relaxed">
                Track spending trends, set budgets, and get real-time alerts. Export tax-ready reports with one click.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 px-6 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">Get started in under 60 seconds</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-teal-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/30">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Capture</h3>
              <p className="text-gray-600">Scan receipts with your camera or upload bank statements in CSV, PDF, or OFX format.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-teal-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/30">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Extract</h3>
              <p className="text-gray-600">Our AI extracts and categorizes all transaction details with 99.8% accuracy.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-teal-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/30">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Analyze</h3>
              <p className="text-gray-600">Get insights, detect money leaks, and export reports for tax season.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-primary to-teal-600">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">5B+ Transactions Processed Every Year</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">99.8%</div>
              <div className="text-white/80">OCR Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">&lt;60s</div>
              <div className="text-white/80">To Insights</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">$847</div>
              <div className="text-white/80">Avg. Savings</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">12M+</div>
              <div className="text-white/80">Happy Users</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Loved by Thousands</h2>
            <p className="text-xl text-gray-600">See what our customers have to say</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <i key={i} className="fas fa-star text-amber-400"></i>
                ))}
              </div>
              <p className="text-gray-600 mb-6 leading-relaxed">
                "Receipt Cycle found $342 in duplicate subscriptions I didn't even know I had. The AI categorization is incredibly accurate!"
              </p>
              <div className="flex items-center gap-3">
                <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-5.jpg" alt="Sarah M." className="w-12 h-12 rounded-full" />
                <div>
                  <div className="font-semibold text-gray-900">Sarah Mitchell</div>
                  <div className="text-sm text-gray-500">Small Business Owner</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <i key={i} className="fas fa-star text-amber-400"></i>
                ))}
              </div>
              <p className="text-gray-600 mb-6 leading-relaxed">
                "The tax export feature saved me hours during tax season. Everything was perfectly categorized and ready for my accountant."
              </p>
              <div className="flex items-center gap-3">
                <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-2.jpg" alt="Michael C." className="w-12 h-12 rounded-full" />
                <div>
                  <div className="font-semibold text-gray-900">Michael Chen</div>
                  <div className="text-sm text-gray-500">Freelance Consultant</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <i key={i} className="fas fa-star text-amber-400"></i>
                ))}
              </div>
              <p className="text-gray-600 mb-6 leading-relaxed">
                "I've tried many expense trackers, but Receipt Cycle's AI is on another level. The money leak detection alone pays for itself!"
              </p>
              <div className="flex items-center gap-3">
                <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-3.jpg" alt="Emily J." className="w-12 h-12 rounded-full" />
                <div>
                  <div className="font-semibold text-gray-900">Emily Johnson</div>
                  <div className="text-sm text-gray-500">Marketing Manager</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Take Control of Your Finances?</h2>
          <p className="text-xl text-gray-300 mb-8">
            Join over 12 million users who trust Receipt Cycle to manage their expenses.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button 
              onClick={() => navigate('/signup')}
              className="h-14 px-8 bg-gradient-to-r from-primary to-teal-600 text-white text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
            >
              Start Free Trial
              <i className="fas fa-arrow-right"></i>
            </button>
            <button 
              onClick={() => navigate('/pricing')}
              className="h-14 px-8 bg-white/10 text-white text-lg font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-all"
            >
              View Pricing
            </button>
          </div>
        </div>
      </section>

      <DesktopFooter />
    </div>
  );
};

export default function Home() {
  const { isMobileOrTablet } = useScreenSize();
  
  return isMobileOrTablet ? <MobileHome /> : <DesktopHome />;
}
