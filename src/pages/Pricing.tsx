import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const Pricing = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const planCards = document.querySelectorAll('#weekly-plan-card, #monthly-plan-card, #yearly-plan-card');
    
    planCards.forEach(card => {
      card.addEventListener('click', function() {
        planCards.forEach(c => {
          const checkbox = c.querySelector('.plan-checkbox');
          if (checkbox) {
            checkbox.classList.remove('bg-primary', 'border-primary');
            checkbox.classList.add('border-gray-300');
            checkbox.innerHTML = '';
          }
        });
        
        const checkbox = this.querySelector('.plan-checkbox');
        if (checkbox) {
          checkbox.classList.remove('border-gray-300');
          checkbox.classList.add('bg-primary', 'border-primary');
          checkbox.innerHTML = '<i class="fas fa-check text-white text-xs"></i>';
        }
      });
    });
    
    const yearlyCard = document.getElementById('yearly-plan-card');
    if (yearlyCard) {
      yearlyCard.click();
    }
  }, []);

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

        <div id="header" className="sticky top-10 bg-white/80 backdrop-blur-md z-40 shadow-sm border-b border-gray-100/50">
          <div className="flex items-center justify-between px-4 py-3">
            <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-white shadow-md shadow-gray-200/40 flex items-center justify-center active:scale-95 transition-transform">
              <i className="fas fa-arrow-left text-gray-900"></i>
            </button>
            <h1 className="text-base font-bold text-gray-900">Upgrade to Premium</h1>
            <button className="w-9 h-9 rounded-xl bg-white shadow-md shadow-gray-200/40 flex items-center justify-center active:scale-95 transition-transform">
              <i className="fas fa-info-circle text-primary"></i>
            </button>
          </div>
        </div>

        <div id="hero-section" className="px-6 pt-8 pb-6">
          <div className="relative bg-gradient-to-br from-primary/10 via-teal-50/50 to-emerald-100/30 rounded-3xl p-8 shadow-lg shadow-primary/10 border border-primary/20 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-teal-200/30 to-transparent rounded-full blur-2xl"></div>
            
            <div className="relative z-10 text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-teal-600 shadow-xl shadow-primary/30 flex items-center justify-center">
                <i className="fas fa-crown text-3xl text-white"></i>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Unlock Full Receipt Cycle Features</h2>
              <p className="text-sm text-gray-600 leading-relaxed max-w-xs mx-auto">Track all your expenses, get AI insights, and save smarter with unlimited access</p>
            </div>
          </div>
        </div>

        <div id="limited-time-offer-banner" className="px-6 pb-6">
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-200/50 shadow-md shadow-amber-100/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                <i className="fas fa-bolt text-white text-lg"></i>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">Limited Time</span>
                  <span className="px-2 py-0.5 bg-amber-200 text-amber-800 text-[10px] font-bold rounded-full">20% OFF</span>
                </div>
                <p className="text-sm font-semibold text-gray-900">Special offer on yearly plan</p>
              </div>
            </div>
          </div>
        </div>

        <div id="pricing-plans-section" className="px-6 pb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">Choose Your Plan</h3>
          
          <div className="space-y-3">
            
            <div id="weekly-plan-card" className="bg-white/60 backdrop-blur-sm rounded-2xl p-5 shadow-md shadow-gray-200/40 border-2 border-gray-200/50 active:scale-[0.98] transition-all cursor-pointer">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-base font-bold text-gray-900">Weekly Plan</h4>
                  </div>
                  <p className="text-xs text-gray-600">Perfect for trial</p>
                </div>
                <div className="plan-checkbox w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center flex-shrink-0 mt-0.5"></div>
              </div>
              <div className="flex items-baseline gap-1 mb-3">
                <span className="text-3xl font-bold text-gray-900">$0.99</span>
                <span className="text-sm text-gray-600">/week</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <i className="fas fa-check text-xs text-primary"></i>
                  <span className="text-xs text-gray-700">All premium features</span>
                </div>
                <div className="flex items-center gap-2">
                  <i className="fas fa-check text-xs text-primary"></i>
                  <span className="text-xs text-gray-700">Unlimited scans</span>
                </div>
                <div className="flex items-center gap-2">
                  <i className="fas fa-check text-xs text-primary"></i>
                  <span className="text-xs text-gray-700">Cancel anytime</span>
                </div>
              </div>
            </div>

            <div id="monthly-plan-card" className="bg-white/60 backdrop-blur-sm rounded-2xl p-5 shadow-md shadow-gray-200/40 border-2 border-gray-200/50 active:scale-[0.98] transition-all cursor-pointer">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-base font-bold text-gray-900">Monthly Plan</h4>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full">POPULAR</span>
                  </div>
                  <p className="text-xs text-gray-600">Most flexible option</p>
                </div>
                <div className="plan-checkbox w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center flex-shrink-0 mt-0.5"></div>
              </div>
              <div className="flex items-baseline gap-1 mb-3">
                <span className="text-3xl font-bold text-gray-900">$3.99</span>
                <span className="text-sm text-gray-600">/month</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <i className="fas fa-check text-xs text-primary"></i>
                  <span className="text-xs text-gray-700">All premium features</span>
                </div>
                <div className="flex items-center gap-2">
                  <i className="fas fa-check text-xs text-primary"></i>
                  <span className="text-xs text-gray-700">Unlimited scans</span>
                </div>
                <div className="flex items-center gap-2">
                  <i className="fas fa-check text-xs text-primary"></i>
                  <span className="text-xs text-gray-700">Priority support</span>
                </div>
              </div>
            </div>

            <div id="yearly-plan-card" className="bg-gradient-to-br from-primary/10 via-teal-50/50 to-emerald-100/30 rounded-2xl p-5 shadow-lg shadow-primary/20 border-2 border-primary active:scale-[0.98] transition-all cursor-pointer relative overflow-hidden">
              <div className="absolute top-3 right-3 bg-gradient-to-r from-primary to-teal-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md">
                BEST VALUE
              </div>
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 pr-16">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-base font-bold text-gray-900">Yearly Plan</h4>
                  </div>
                  <p className="text-xs text-gray-600">Save $9.58 per year</p>
                </div>
                <div className="plan-checkbox w-6 h-6 rounded-full bg-primary border-2 border-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                  <i className="fas fa-check text-white text-xs"></i>
                </div>
              </div>
              <div className="mb-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-primary">$38.30</span>
                  <span className="text-sm text-gray-600">/year</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500 line-through">$47.88</span>
                  <span className="px-2 py-0.5 bg-primary/20 text-primary text-[10px] font-bold rounded-full">SAVE 20%</span>
                </div>
              </div>
              <div className="space-y-2 mb-3">
                <div className="flex items-center gap-2">
                  <i className="fas fa-check text-xs text-primary"></i>
                  <span className="text-xs text-gray-700 font-medium">All premium features</span>
                </div>
                <div className="flex items-center gap-2">
                  <i className="fas fa-check text-xs text-primary"></i>
                  <span className="text-xs text-gray-700 font-medium">Unlimited scans & uploads</span>
                </div>
                <div className="flex items-center gap-2">
                  <i className="fas fa-check text-xs text-primary"></i>
                  <span className="text-xs text-gray-700 font-medium">Priority support</span>
                </div>
                <div className="flex items-center gap-2">
                  <i className="fas fa-check text-xs text-primary"></i>
                  <span className="text-xs text-gray-700 font-medium">Early access to new features</span>
                </div>
              </div>
              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 border border-primary/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-700 font-medium">Equivalent to</span>
                  <span className="text-sm font-bold text-primary">$3.19/month</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        <div id="features-benefits-section" className="px-6 pb-6">
          <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 shadow-lg shadow-gray-200/50 border border-gray-100/50">
            <h3 className="text-base font-bold text-gray-900 mb-4 text-center">Premium Features Included</h3>
            
            <div className="space-y-4">
              
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-teal-100 flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-infinity text-lg text-primary"></i>
                </div>
                <div className="flex-1 pt-1">
                  <h4 className="text-sm font-semibold text-gray-900 mb-0.5">Unlimited Receipt Scans & Uploads</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">Scan and store unlimited receipts with advanced OCR technology. Take photos, upload from gallery, or attach PDFs.</p>
                </div>
              </div>

              <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-brain text-lg text-purple-600"></i>
                </div>
                <div className="flex-1 pt-1">
                  <h4 className="text-sm font-semibold text-gray-900 mb-0.5">Advanced AI Insights & Money-Leak Detection</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">Discover hidden subscriptions, duplicate charges, unusual spikes, and savings opportunities with AI-powered analysis.</p>
                </div>
              </div>

              <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-chart-pie text-lg text-blue-600"></i>
                </div>
                <div className="flex-1 pt-1">
                  <h4 className="text-sm font-semibold text-gray-900 mb-0.5">Budget Tracking & Progress Reports</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">Set budgets, track progress, and get detailed spending analytics with daily, weekly, and monthly charts.</p>
                </div>
              </div>

              <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-layer-group text-lg text-orange-600"></i>
                </div>
                <div className="flex-1 pt-1">
                  <h4 className="text-sm font-semibold text-gray-900 mb-0.5">Multi-Account Support</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">Track expenses across multiple accounts, credit cards, and bank statements with automatic categorization.</p>
                </div>
              </div>

              <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-sync-alt text-lg text-green-600"></i>
                </div>
                <div className="flex-1 pt-1">
                  <h4 className="text-sm font-semibold text-gray-900 mb-0.5">Recurring Transaction Detection</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">Automatically identify and track recurring payments, subscriptions, and monthly expenses.</p>
                </div>
              </div>

              <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-file-export text-lg text-indigo-600"></i>
                </div>
                <div className="flex-1 pt-1">
                  <h4 className="text-sm font-semibold text-gray-900 mb-0.5">Export Tax-Ready Reports</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">Generate detailed expense reports for tax filing and reimbursements in CSV, PDF, or Excel format.</p>
                </div>
              </div>

              <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-50 to-rose-100 flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-bell text-lg text-rose-600"></i>
                </div>
                <div className="flex-1 pt-1">
                  <h4 className="text-sm font-semibold text-gray-900 mb-0.5">Smart Alerts & Notifications</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">Get notified about unusual spending, bill due dates, budget limits, and suspicious charges.</p>
                </div>
              </div>

              <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-50 to-cyan-100 flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-users text-lg text-cyan-600"></i>
                </div>
                <div className="flex-1 pt-1">
                  <h4 className="text-sm font-semibold text-gray-900 mb-0.5">Team Collaboration</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">Share expenses with family members or business partners with secure access controls.</p>
                </div>
              </div>

              <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-50 to-teal-100 flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-tags text-lg text-teal-600"></i>
                </div>
                <div className="flex-1 pt-1">
                  <h4 className="text-sm font-semibold text-gray-900 mb-0.5">Unlimited Custom Tags & Categories</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">Create unlimited custom tags, categories, and multi-level categorization for precise tracking.</p>
                </div>
              </div>

              <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-shield-alt text-lg text-amber-600"></i>
                </div>
                <div className="flex-1 pt-1">
                  <h4 className="text-sm font-semibold text-gray-900 mb-0.5">Priority Support & Early Access</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">Get faster responses, dedicated assistance, and early access to new features before anyone else.</p>
                </div>
              </div>

            </div>
          </div>
        </div>

        <div id="comparison-free-vs-premium" className="px-6 pb-6">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-3xl p-6 border border-gray-200/50 shadow-lg">
            <h3 className="text-base font-bold text-gray-900 mb-4 text-center">Free vs Premium</h3>
            
            <div className="space-y-3">
              
              <div className="bg-white rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">Receipt Scans</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">10/month</span>
                    <i className="fas fa-arrow-right text-xs text-gray-400"></i>
                    <span className="text-xs text-primary font-semibold">Unlimited</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">AI Insights</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">Basic</span>
                    <i className="fas fa-arrow-right text-xs text-gray-400"></i>
                    <span className="text-xs text-primary font-semibold">Advanced</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">Budget Categories</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">5 max</span>
                    <i className="fas fa-arrow-right text-xs text-gray-400"></i>
                    <span className="text-xs text-primary font-semibold">Unlimited</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">Export Reports</span>
                  <div className="flex items-center gap-3">
                    <i className="fas fa-times text-xs text-gray-400"></i>
                    <i className="fas fa-arrow-right text-xs text-gray-400"></i>
                    <i className="fas fa-check-circle text-sm text-primary"></i>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">Multi-Account Support</span>
                  <div className="flex items-center gap-3">
                    <i className="fas fa-times text-xs text-gray-400"></i>
                    <i className="fas fa-arrow-right text-xs text-gray-400"></i>
                    <i className="fas fa-check-circle text-sm text-primary"></i>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">Bank Statement Upload</span>
                  <div className="flex items-center gap-3">
                    <i className="fas fa-times text-xs text-gray-400"></i>
                    <i className="fas fa-arrow-right text-xs text-gray-400"></i>
                    <i className="fas fa-check-circle text-sm text-primary"></i>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">Priority Support</span>
                  <div className="flex items-center gap-3">
                    <i className="fas fa-times text-xs text-gray-400"></i>
                    <i className="fas fa-arrow-right text-xs text-gray-400"></i>
                    <i className="fas fa-check-circle text-sm text-primary"></i>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        <div id="testimonials-section" className="px-6 pb-6">
          <h3 className="text-base font-bold text-gray-900 mb-4 text-center">What Premium Users Say</h3>
          
          <div className="space-y-3">
            
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-5 shadow-lg shadow-gray-200/50 border border-gray-100/50">
              <div className="flex items-center gap-3 mb-3">
                <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-3.jpg" alt="Premium User" className="w-12 h-12 rounded-full object-cover shadow-md" />
                <div>
                  <div className="text-sm font-semibold text-gray-900">Michael Chen</div>
                  <div className="flex items-center gap-1">
                    <i className="fas fa-star text-xs text-amber-400"></i>
                    <i className="fas fa-star text-xs text-amber-400"></i>
                    <i className="fas fa-star text-xs text-amber-400"></i>
                    <i className="fas fa-star text-xs text-amber-400"></i>
                    <i className="fas fa-star text-xs text-amber-400"></i>
                    <span className="text-xs text-gray-500 ml-1">Premium User</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed italic">"The yearly plan is absolutely worth it. I've saved over $800 by catching duplicate subscriptions and unnecessary fees. The AI insights are incredibly accurate!"</p>
            </div>

            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-5 shadow-lg shadow-gray-200/50 border border-gray-100/50">
              <div className="flex items-center gap-3 mb-3">
                <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-5.jpg" alt="Premium User" className="w-12 h-12 rounded-full object-cover shadow-md" />
                <div>
                  <div className="text-sm font-semibold text-gray-900">Sarah Johnson</div>
                  <div className="flex items-center gap-1">
                    <i className="fas fa-star text-xs text-amber-400"></i>
                    <i className="fas fa-star text-xs text-amber-400"></i>
                    <i className="fas fa-star text-xs text-amber-400"></i>
                    <i className="fas fa-star text-xs text-amber-400"></i>
                    <i className="fas fa-star text-xs text-amber-400"></i>
                    <span className="text-xs text-gray-500 ml-1">Small Business Owner</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed italic">"Receipt Cycle made tax season so much easier! The unlimited scans and export features saved me hours of manual work. Best investment for my business."</p>
            </div>

            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-5 shadow-lg shadow-gray-200/50 border border-gray-100/50">
              <div className="flex items-center gap-3 mb-3">
                <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-8.jpg" alt="Premium User" className="w-12 h-12 rounded-full object-cover shadow-md" />
                <div>
                  <div className="text-sm font-semibold text-gray-900">David Martinez</div>
                  <div className="flex items-center gap-1">
                    <i className="fas fa-star text-xs text-amber-400"></i>
                    <i className="fas fa-star text-xs text-amber-400"></i>
                    <i className="fas fa-star text-xs text-amber-400"></i>
                    <i className="fas fa-star text-xs text-amber-400"></i>
                    <i className="fas fa-star text-xs text-amber-400"></i>
                    <span className="text-xs text-gray-500 ml-1">Freelancer</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed italic">"Finally found an expense tracker that actually works! The OCR is super accurate, and I love the money leak detection. Found $45/month in forgotten subscriptions!"</p>
            </div>

          </div>
        </div>

        <div id="money-back-guarantee-section" className="px-6 pb-6">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50/50 rounded-2xl p-5 border border-green-200/50 shadow-md">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center flex-shrink-0 shadow-md">
                <i className="fas fa-shield-check text-xl text-white"></i>
              </div>
              <div className="flex-1">
                <h4 className="text-base font-bold text-gray-900 mb-1">7-Day Money-Back Guarantee</h4>
                <p className="text-sm text-gray-600 leading-relaxed">Try premium risk-free. If you're not satisfied, get a full refund within 7 days. No questions asked.</p>
              </div>
            </div>
          </div>
        </div>

        <div id="primary-cta-section" className="px-6 pb-4">
          <button className="w-full h-14 bg-gradient-to-r from-primary to-teal-600 text-white text-base font-semibold rounded-2xl shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 transform active:scale-[0.98]">
            Subscribe Now
          </button>
        </div>

        <div id="secondary-cta-section" className="px-6 pb-6">
          <button className="w-full h-12 bg-white/80 backdrop-blur-sm text-gray-700 text-sm font-semibold rounded-xl shadow-md shadow-gray-200/50 border border-gray-200 transition-all duration-300 active:scale-[0.98]">
            Restore Purchase
          </button>
        </div>

        <div id="free-version-option" className="px-6 pb-6">
          <button className="w-full text-sm text-gray-600 font-medium underline active:text-primary transition-colors">
            Continue with Free Version
          </button>
        </div>

        <div id="trust-indicators-section" className="px-6 pb-6">
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <i className="fas fa-lock text-xs text-primary"></i>
              <span className="text-xs text-gray-600 font-medium">Secure Payment</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-gray-300"></div>
            <div className="flex items-center gap-1.5">
              <i className="fas fa-times-circle text-xs text-primary"></i>
              <span className="text-xs text-gray-600 font-medium">Cancel Anytime</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-gray-300"></div>
            <div className="flex items-center gap-1.5">
              <i className="fas fa-sync-alt text-xs text-primary"></i>
              <span className="text-xs text-gray-600 font-medium">Auto-Renewal</span>
            </div>
          </div>
        </div>

        <div id="faq-premium-section" className="px-6 pb-6">
          <h3 className="text-base font-bold text-gray-900 mb-4 text-center">Subscription FAQs</h3>
          
          <div className="space-y-3">
            
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border border-gray-100/50">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h4 className="text-sm font-semibold text-gray-900">Can I cancel my subscription anytime?</h4>
                <i className="fas fa-check-circle text-primary text-sm flex-shrink-0 mt-0.5"></i>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">Yes, you can cancel anytime from your account settings. Your access continues until the end of the billing period.</p>
            </div>

            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border border-gray-100/50">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h4 className="text-sm font-semibold text-gray-900">Will I be charged automatically?</h4>
                <i className="fas fa-credit-card text-primary text-sm flex-shrink-0 mt-0.5"></i>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">Yes, subscriptions auto-renew. You'll receive a reminder email 3 days before renewal. You can turn off auto-renewal anytime.</p>
            </div>

            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border border-gray-100/50">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h4 className="text-sm font-semibold text-gray-900">Can I switch plans later?</h4>
                <i className="fas fa-exchange-alt text-primary text-sm flex-shrink-0 mt-0.5"></i>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">Absolutely. You can upgrade or downgrade your plan at any time. Changes take effect at the next billing cycle.</p>
            </div>

            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border border-gray-100/50">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h4 className="text-sm font-semibold text-gray-900">What payment methods do you accept?</h4>
                <i className="fas fa-wallet text-primary text-sm flex-shrink-0 mt-0.5"></i>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">We accept all major credit cards, debit cards, Apple Pay, Google Pay, and PayPal for your convenience.</p>
            </div>

            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border border-gray-100/50">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h4 className="text-sm font-semibold text-gray-900">Is there a free trial?</h4>
                <i className="fas fa-gift text-primary text-sm flex-shrink-0 mt-0.5"></i>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">Yes! All plans include a 7-day free trial. You won't be charged until the trial period ends.</p>
            </div>

            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border border-gray-100/50">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h4 className="text-sm font-semibold text-gray-900">What happens to my data if I cancel?</h4>
                <i className="fas fa-database text-primary text-sm flex-shrink-0 mt-0.5"></i>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">Your data remains secure and accessible. You can export all your receipts and reports before downgrading to the free plan.</p>
            </div>

            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border border-gray-100/50">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h4 className="text-sm font-semibold text-gray-900">Do you offer student or business discounts?</h4>
                <i className="fas fa-percentage text-primary text-sm flex-shrink-0 mt-0.5"></i>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">Yes! Contact our support team with valid student ID or business documentation for special pricing.</p>
            </div>

          </div>
        </div>

        <div id="payment-providers-section" className="px-6 pb-6">
          <div className="text-center mb-3">
            <p className="text-xs text-gray-500 font-medium">Secure payment powered by</p>
          </div>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <div className="bg-white rounded-lg px-4 py-2 shadow-sm border border-gray-100">
              <i className="fab fa-cc-visa text-2xl text-blue-600"></i>
            </div>
            <div className="bg-white rounded-lg px-4 py-2 shadow-sm border border-gray-100">
              <i className="fab fa-cc-mastercard text-2xl text-orange-500"></i>
            </div>
            <div className="bg-white rounded-lg px-4 py-2 shadow-sm border border-gray-100">
              <i className="fab fa-cc-amex text-2xl text-blue-500"></i>
            </div>
            <div className="bg-white rounded-lg px-4 py-2 shadow-sm border border-gray-100">
              <i className="fab fa-cc-paypal text-2xl text-blue-700"></i>
            </div>
            <div className="bg-white rounded-lg px-4 py-2 shadow-sm border border-gray-100">
              <i className="fab fa-apple-pay text-2xl text-gray-900"></i>
            </div>
            <div className="bg-white rounded-lg px-4 py-2 shadow-sm border border-gray-100">
              <i className="fab fa-google-pay text-2xl text-gray-700"></i>
            </div>
          </div>
        </div>

        <div id="security-privacy-section" className="px-6 pb-6">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-3xl p-6 border border-blue-200/50 shadow-md">
            <h3 className="text-base font-bold text-gray-900 mb-4 text-center">Your Data is Protected</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-lock text-lg text-blue-600"></i>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-gray-900">End-to-End Encryption</h4>
                  <p className="text-xs text-gray-600">All your financial data is encrypted and secure</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-shield-alt text-lg text-blue-600"></i>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-gray-900">Bank-Level Security</h4>
                  <p className="text-xs text-gray-600">Industry-standard security protocols</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-user-shield text-lg text-blue-600"></i>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-gray-900">Privacy First</h4>
                  <p className="text-xs text-gray-600">We never share or sell your data</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div id="footer" className="px-6 pb-6 pt-4">
          <div className="text-center mb-4">
            <p className="text-xs text-gray-500 leading-relaxed">By subscribing, you agree to our <a href="#" className="text-primary font-medium underline">Terms of Service</a> and <a href="#" className="text-primary font-medium underline">Privacy Policy</a>. Subscriptions automatically renew unless cancelled.</p>
          </div>
          
          <div className="flex items-center justify-center gap-6 mb-4">
            <a href="#" className="text-xs text-gray-600 hover:text-primary font-medium transition-colors">Help Center</a>
            <div className="w-1 h-1 rounded-full bg-gray-300"></div>
            <a href="#" className="text-xs text-gray-600 hover:text-primary font-medium transition-colors">Contact Support</a>
            <div className="w-1 h-1 rounded-full bg-gray-300"></div>
            <a href="#" className="text-xs text-gray-600 hover:text-primary font-medium transition-colors">About Us</a>
          </div>
          
          <div className="text-center">
            <p className="text-xs text-gray-500">© 2024 Receipt Cycle. All rights reserved.</p>
          </div>
        </div>

        <div id="bottom-safe-area" className="h-8"></div>

      </div>
    </div>
  );
};

export default Pricing;
