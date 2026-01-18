import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Onboarding = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedCurrency, setSelectedCurrency] = useState("");
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [selectedTrackingMode, setSelectedTrackingMode] = useState("");
  const [selectedUsecases, setSelectedUsecases] = useState<string[]>([]);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState("");

  const handleNext = () => {
    if (currentStep < 7) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    if (currentStep < 7) {
      setCurrentStep(currentStep + 1);
    } else {
      // On Step 7, skip goes to registration/paywall
      handleFinish();
    }
  };

  const handleFinish = () => {
    // Store onboarding data in localStorage for later use in Settings
    const onboardingData = {
      currency: selectedCurrency,
      goals: selectedGoals,
      trackingMode: selectedTrackingMode,
      usecases: selectedUsecases,
      country: selectedCountry,
      industry: selectedIndustry,
      completed: true,
      completedAt: new Date().toISOString()
    };
    localStorage.setItem('onboardingData', JSON.stringify(onboardingData));
    
    // Navigate to registration/paywall (for now, we'll go to home since those pages aren't created yet)
    // TODO: Replace with /register or /paywall when those pages are provided
    navigate('/');
  };

  const toggleGoal = (goal: string) => {
    setSelectedGoals(prev => 
      prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]
    );
  };

  const toggleUsecase = (usecase: string) => {
    setSelectedUsecases(prev => 
      prev.includes(usecase) ? prev.filter(u => u !== usecase) : [...prev, usecase]
    );
  };

  const selectCurrency = (currency: string) => {
    setSelectedCurrency(currency);
  };

  const selectCountry = (country: string) => {
    setSelectedCountry(country);
  };

  return (
    <div className="font-sans bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/40 overflow-x-hidden min-h-screen">
      {/* Status Bar */}
      <div id="status-bar" className="fixed top-0 left-0 right-0 h-10 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-between px-4 shadow-sm">
        <div className="text-xs font-semibold text-gray-900">9:41</div>
        <div className="flex items-center gap-1">
          <i className="fas fa-signal text-xs text-gray-900"></i>
          <i className="fas fa-wifi text-xs text-gray-900 ml-1"></i>
          <i className="fas fa-battery-full text-xs text-gray-900 ml-1"></i>
        </div>
      </div>

      <div id="onboarding-step-1-currency" className={`pt-10 min-h-screen flex flex-col ${currentStep === 1 ? '' : 'hidden'}`}>
        <div id="onboarding-header" className="px-6 pt-4 pb-2 flex items-center justify-between">
          {/* Back button hidden on Step 1 */}
          <div className="w-9 h-9"></div>
          <button onClick={handleSkip} className="text-sm font-semibold text-gray-600 hover:text-primary transition-colors">Skip</button>
        </div>

        <div id="progress-indicator-block" className="px-6 pt-2 pb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500">Step 1 of 7</span>
            <span className="text-xs font-medium text-gray-400">14% Complete</span>
          </div>
          <div className="w-full h-1.5 bg-gray-200/60 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-teal-600 rounded-full transition-all duration-500" style={{ width: '14%' }}></div>
          </div>
        </div>

        <div id="illustration-block-currency" className="px-6 pb-6 flex justify-center">
          <div className="w-48 h-48 rounded-3xl bg-gradient-to-br from-primary/10 to-teal-50 flex items-center justify-center shadow-lg shadow-primary/10 border border-primary/20">
            <i className="fas fa-coins text-7xl text-primary opacity-90"></i>
          </div>
        </div>

        <div id="content-block-currency" className="px-6 pb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-3 leading-tight text-center">Choose Your Main Currency</h2>
          <p className="text-sm text-gray-600 leading-relaxed text-center max-w-sm mx-auto">Select the primary currency for tracking your expenses and income. You can add more currencies later.</p>
        </div>

        <div id="currency-selector-block" className="px-6 pb-6">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100/50 p-4">
            <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Main Currency</label>
            <div className="relative">
              <select 
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="w-full h-14 bg-white rounded-xl border-2 border-gray-200 px-4 text-base font-semibold text-gray-900 appearance-none focus:border-primary focus:outline-none transition-colors cursor-pointer"
              >
                <option value="">Select currency...</option>
                <option value="USD">🇺🇸 USD - US Dollar</option>
                <option value="EUR">🇪🇺 EUR - Euro</option>
                <option value="GBP">🇬🇧 GBP - British Pound</option>
                <option value="CAD">🇨🇦 CAD - Canadian Dollar</option>
                <option value="AUD">🇦🇺 AUD - Australian Dollar</option>
                <option value="JPY">🇯🇵 JPY - Japanese Yen</option>
                <option value="CHF">🇨🇭 CHF - Swiss Franc</option>
                <option value="CNY">🇨🇳 CNY - Chinese Yuan</option>
                <option value="INR">🇮🇳 INR - Indian Rupee</option>
                <option value="MXN">🇲🇽 MXN - Mexican Peso</option>
                <option value="BRL">🇧🇷 BRL - Brazilian Real</option>
                <option value="ZAR">🇿🇦 ZAR - South African Rand</option>
              </select>
              <i className="fas fa-chevron-down absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"></i>
            </div>
          </div>
        </div>

        <div id="popular-currencies-block" className="px-6 pb-6">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Popular Choices</h3>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => selectCurrency('USD')} className={`h-14 bg-white/60 backdrop-blur-sm rounded-xl shadow-md shadow-gray-200/40 border flex items-center justify-center gap-2 hover:border-primary hover:bg-primary/5 transition-all active:scale-95 ${selectedCurrency === 'USD' ? 'border-primary bg-primary/5' : 'border-gray-100/50'}`}>
              <span className="text-2xl">🇺🇸</span>
              <span className="text-sm font-semibold text-gray-900">USD</span>
            </button>
            <button onClick={() => selectCurrency('EUR')} className={`h-14 bg-white/60 backdrop-blur-sm rounded-xl shadow-md shadow-gray-200/40 border flex items-center justify-center gap-2 hover:border-primary hover:bg-primary/5 transition-all active:scale-95 ${selectedCurrency === 'EUR' ? 'border-primary bg-primary/5' : 'border-gray-100/50'}`}>
              <span className="text-2xl">🇪🇺</span>
              <span className="text-sm font-semibold text-gray-900">EUR</span>
            </button>
            <button onClick={() => selectCurrency('GBP')} className={`h-14 bg-white/60 backdrop-blur-sm rounded-xl shadow-md shadow-gray-200/40 border flex items-center justify-center gap-2 hover:border-primary hover:bg-primary/5 transition-all active:scale-95 ${selectedCurrency === 'GBP' ? 'border-primary bg-primary/5' : 'border-gray-100/50'}`}>
              <span className="text-2xl">🇬🇧</span>
              <span className="text-sm font-semibold text-gray-900">GBP</span>
            </button>
            <button onClick={() => selectCurrency('CAD')} className={`h-14 bg-white/60 backdrop-blur-sm rounded-xl shadow-md shadow-gray-200/40 border flex items-center justify-center gap-2 hover:border-primary hover:bg-primary/5 transition-all active:scale-95 ${selectedCurrency === 'CAD' ? 'border-primary bg-primary/5' : 'border-gray-100/50'}`}>
              <span className="text-2xl">🇨🇦</span>
              <span className="text-sm font-semibold text-gray-900">CAD</span>
            </button>
          </div>
        </div>

        <div id="info-tip-currency" className="px-6 pb-6">
          <div className="bg-blue-50/60 backdrop-blur-sm rounded-2xl p-4 border border-blue-100/50 flex items-start gap-3">
            <i className="fas fa-info-circle text-blue-600 text-lg flex-shrink-0 mt-0.5"></i>
            <div>
              <h4 className="text-sm font-semibold text-blue-900 mb-1">Multi-Currency Support</h4>
              <p className="text-xs text-blue-700 leading-relaxed">You can track expenses in multiple currencies. We'll automatically convert amounts based on real-time exchange rates.</p>
            </div>
          </div>
        </div>

        <div className="flex-1"></div>

        <div id="action-button-currency" className="px-6 pb-6">
          <button onClick={handleNext} className="w-full h-14 bg-gradient-to-r from-primary to-teal-600 text-white text-base font-semibold rounded-2xl shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]">
            Next
          </button>
        </div>

        <div id="bottom-safe-area" className="h-4"></div>
      </div>

      {/* Step 2: Goal */}
      <div id="onboarding-step-2-goal" className={`pt-10 min-h-screen flex flex-col ${currentStep === 2 ? '' : 'hidden'}`}>
        <div id="onboarding-header-2" className="px-6 pt-4 pb-2 flex items-center justify-between">
          <button onClick={handleBack} className="w-9 h-9 rounded-xl bg-white/60 backdrop-blur-sm shadow-md shadow-gray-200/40 border border-gray-100/50 flex items-center justify-center active:scale-95 transition-transform">
            <i className="fas fa-arrow-left text-gray-700 text-sm"></i>
          </button>
          <button onClick={handleSkip} className="text-sm font-semibold text-gray-600 hover:text-primary transition-colors">Skip</button>
        </div>

        <div id="progress-indicator-block-2" className="px-6 pt-2 pb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500">Step 2 of 7</span>
            <span className="text-xs font-medium text-gray-400">28% Complete</span>
          </div>
          <div className="w-full h-1.5 bg-gray-200/60 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-teal-600 rounded-full transition-all duration-500" style={{ width: '28%' }}></div>
          </div>
        </div>

        <div id="illustration-block-goal" className="px-6 pb-6 flex justify-center">
          <div className="w-48 h-48 rounded-3xl bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center shadow-lg shadow-purple-200/50 border border-purple-100">
            <i className="fas fa-bullseye text-7xl text-purple-600 opacity-90"></i>
          </div>
        </div>

        <div id="content-block-goal" className="px-6 pb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-3 leading-tight text-center">What's Your Primary Financial Goal?</h2>
          <p className="text-sm text-gray-600 leading-relaxed text-center max-w-sm mx-auto">Select all goals that matter to you. We'll tailor your experience accordingly.</p>
        </div>

        <div id="goal-options-block" className="px-6 pb-6">
          <div className="space-y-3">
            <button onClick={() => toggleGoal('track')} className={`w-full bg-white/70 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border-2 hover:border-primary hover:bg-primary/5 transition-all active:scale-98 flex items-center gap-4 text-left ${selectedGoals.includes('track') ? 'border-primary bg-primary/5' : 'border-gray-100/50'}`}>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center flex-shrink-0">
                <i className="fas fa-chart-line text-xl text-blue-600"></i>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-gray-900 mb-0.5">Track Incomes & Expenses</h4>
                <p className="text-xs text-gray-600">Monitor all your financial transactions</p>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selectedGoals.includes('track') ? 'border-primary bg-primary' : 'border-gray-300'}`}>
                <i className={`fas fa-check text-xs text-white ${selectedGoals.includes('track') ? '' : 'hidden'}`}></i>
              </div>
            </button>

            <button onClick={() => toggleGoal('debts')} className={`w-full bg-white/70 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border-2 hover:border-primary hover:bg-primary/5 transition-all active:scale-98 flex items-center gap-4 text-left ${selectedGoals.includes('debts') ? 'border-primary bg-primary/5' : 'border-gray-100/50'}`}>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center flex-shrink-0">
                <i className="fas fa-hand-holding-usd text-xl text-red-600"></i>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-gray-900 mb-0.5">Manage Debts / Loans</h4>
                <p className="text-xs text-gray-600">Track and pay off your debts faster</p>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selectedGoals.includes('debts') ? 'border-primary bg-primary' : 'border-gray-300'}`}>
                <i className={`fas fa-check text-xs text-white ${selectedGoals.includes('debts') ? '' : 'hidden'}`}></i>
              </div>
            </button>

            <button onClick={() => toggleGoal('cut')} className={`w-full bg-white/70 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border-2 hover:border-primary hover:bg-primary/5 transition-all active:scale-98 flex items-center gap-4 text-left ${selectedGoals.includes('cut') ? 'border-primary bg-primary/5' : 'border-gray-100/50'}`}>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center flex-shrink-0">
                <i className="fas fa-cut text-xl text-orange-600"></i>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-gray-900 mb-0.5">Cut Down Expenses</h4>
                <p className="text-xs text-gray-600">Find and eliminate unnecessary spending</p>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selectedGoals.includes('cut') ? 'border-primary bg-primary' : 'border-gray-300'}`}>
                <i className={`fas fa-check text-xs text-white ${selectedGoals.includes('cut') ? '' : 'hidden'}`}></i>
              </div>
            </button>

            <button onClick={() => toggleGoal('saving')} className={`w-full bg-white/70 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border-2 hover:border-primary hover:bg-primary/5 transition-all active:scale-98 flex items-center gap-4 text-left ${selectedGoals.includes('saving') ? 'border-primary bg-primary/5' : 'border-gray-100/50'}`}>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center flex-shrink-0">
                <i className="fas fa-piggy-bank text-xl text-green-600"></i>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-gray-900 mb-0.5">Saving</h4>
                <p className="text-xs text-gray-600">Build your savings and reach goals</p>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selectedGoals.includes('saving') ? 'border-primary bg-primary' : 'border-gray-300'}`}>
                <i className={`fas fa-check text-xs text-white ${selectedGoals.includes('saving') ? '' : 'hidden'}`}></i>
              </div>
            </button>

            <button onClick={() => toggleGoal('manage')} className={`w-full bg-white/70 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border-2 hover:border-primary hover:bg-primary/5 transition-all active:scale-98 flex items-center gap-4 text-left ${selectedGoals.includes('manage') ? 'border-primary bg-primary/5' : 'border-gray-100/50'}`}>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center flex-shrink-0">
                <i className="fas fa-wallet text-xl text-purple-600"></i>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-gray-900 mb-0.5">Manage All Money in One Place</h4>
                <p className="text-xs text-gray-600">Complete financial overview and control</p>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selectedGoals.includes('manage') ? 'border-primary bg-primary' : 'border-gray-300'}`}>
                <i className={`fas fa-check text-xs text-white ${selectedGoals.includes('manage') ? '' : 'hidden'}`}></i>
              </div>
            </button>
          </div>
        </div>

        <div className="flex-1"></div>

        <div id="action-button-goal" className="px-6 pb-6">
          <button onClick={handleNext} className="w-full h-14 bg-gradient-to-r from-primary to-teal-600 text-white text-base font-semibold rounded-2xl shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]">
            Next
          </button>
        </div>

        <div id="bottom-safe-area-2" className="h-4"></div>
      </div>

      {/* Step 3: Tracking Mode */}
      <div id="onboarding-step-3-tracking" className={`pt-10 min-h-screen flex flex-col ${currentStep === 3 ? '' : 'hidden'}`}>
        <div id="onboarding-header-3" className="px-6 pt-4 pb-2 flex items-center justify-between">
          <button onClick={handleBack} className="w-9 h-9 rounded-xl bg-white/60 backdrop-blur-sm shadow-md shadow-gray-200/40 border border-gray-100/50 flex items-center justify-center active:scale-95 transition-transform">
            <i className="fas fa-arrow-left text-gray-700 text-sm"></i>
          </button>
          <button onClick={handleSkip} className="text-sm font-semibold text-gray-600 hover:text-primary transition-colors">Skip</button>
        </div>

        <div id="progress-indicator-block-3" className="px-6 pt-2 pb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500">Step 3 of 7</span>
            <span className="text-xs font-medium text-gray-400">42% Complete</span>
          </div>
          <div className="w-full h-1.5 bg-gray-200/60 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-teal-600 rounded-full transition-all duration-500" style={{ width: '42%' }}></div>
          </div>
        </div>

        <div id="illustration-block-tracking" className="px-6 pb-6 flex justify-center">
          <div className="w-48 h-48 rounded-3xl bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center justify-center shadow-lg shadow-indigo-200/50 border border-indigo-100">
            <i className="fas fa-users text-7xl text-indigo-600 opacity-90"></i>
          </div>
        </div>

        <div id="content-block-tracking" className="px-6 pb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-3 leading-tight text-center">Choose Tracking Mode</h2>
          <p className="text-sm text-gray-600 leading-relaxed text-center max-w-sm mx-auto">Do you need to track expenses for yourself only, or for a team?</p>
        </div>

        <div id="tracking-mode-block" className="px-6 pb-6">
          <div className="space-y-4">
            <button onClick={() => setSelectedTrackingMode('just-me')} className={`w-full bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-lg shadow-gray-200/50 border-2 hover:border-primary hover:bg-primary/5 transition-all active:scale-98 ${selectedTrackingMode === 'just-me' ? 'border-primary bg-primary/5' : 'border-gray-100/50'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/10 to-teal-50 flex items-center justify-center">
                  <i className="fas fa-user text-2xl text-primary"></i>
                </div>
                <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center ${selectedTrackingMode === 'just-me' ? 'border-primary' : 'border-gray-300'}`}>
                  <div className={`w-4 h-4 rounded-full bg-primary ${selectedTrackingMode === 'just-me' ? '' : 'hidden'}`}></div>
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 text-left">Just Me</h3>
              <p className="text-sm text-gray-600 leading-relaxed text-left">Track your personal expenses, receipts, and financial goals individually.</p>
              <div className="mt-4 pt-4 border-t border-gray-200/50 flex items-center gap-2">
                <i className="fas fa-check text-xs text-primary"></i>
                <span className="text-xs text-gray-600 font-medium">Perfect for personal budgeting</span>
              </div>
            </button>

            <button onClick={() => setSelectedTrackingMode('team')} className={`w-full bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-lg shadow-gray-200/50 border-2 hover:border-primary hover:bg-primary/5 transition-all active:scale-98 ${selectedTrackingMode === 'team' ? 'border-primary bg-primary/5' : 'border-gray-100/50'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                  <i className="fas fa-users text-2xl text-blue-600"></i>
                </div>
                <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center ${selectedTrackingMode === 'team' ? 'border-primary' : 'border-gray-300'}`}>
                  <div className={`w-4 h-4 rounded-full bg-primary ${selectedTrackingMode === 'team' ? '' : 'hidden'}`}></div>
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 text-left">Team Tracking</h3>
              <p className="text-sm text-gray-600 leading-relaxed text-left">Invite team members or employees to submit their expenses for approval.</p>
              <div className="mt-4 pt-4 border-t border-gray-200/50 space-y-2">
                <div className="flex items-center gap-2">
                  <i className="fas fa-check text-xs text-blue-600"></i>
                  <span className="text-xs text-gray-600 font-medium">Invite unlimited team members</span>
                </div>
                <div className="flex items-center gap-2">
                  <i className="fas fa-check text-xs text-blue-600"></i>
                  <span className="text-xs text-gray-600 font-medium">Approval workflows</span>
                </div>
                <div className="flex items-center gap-2">
                  <i className="fas fa-check text-xs text-blue-600"></i>
                  <span className="text-xs text-gray-600 font-medium">Centralized expense reports</span>
                </div>
              </div>
            </button>
          </div>
        </div>

        <div id="info-tip-tracking" className="px-6 pb-6">
          <div className="bg-amber-50/60 backdrop-blur-sm rounded-2xl p-4 border border-amber-100/50 flex items-start gap-3">
            <i className="fas fa-lightbulb text-amber-600 text-lg flex-shrink-0 mt-0.5"></i>
            <div>
              <h4 className="text-sm font-semibold text-amber-900 mb-1">You Can Switch Later</h4>
              <p className="text-xs text-amber-700 leading-relaxed">Don't worry! You can upgrade to team tracking anytime from your account settings.</p>
            </div>
          </div>
        </div>

        <div className="flex-1"></div>

        <div id="action-button-tracking" className="px-6 pb-6">
          <button onClick={handleNext} className="w-full h-14 bg-gradient-to-r from-primary to-teal-600 text-white text-base font-semibold rounded-2xl shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]">
            Next
          </button>
        </div>

        <div id="bottom-safe-area-3" className="h-4"></div>
      </div>

      {/* Step 4: Use Case */}
      <div id="onboarding-step-4-usecase" className={`pt-10 min-h-screen flex flex-col ${currentStep === 4 ? '' : 'hidden'}`}>
        <div id="onboarding-header-4" className="px-6 pt-4 pb-2 flex items-center justify-between">
          <button onClick={handleBack} className="w-9 h-9 rounded-xl bg-white/60 backdrop-blur-sm shadow-md shadow-gray-200/40 border border-gray-100/50 flex items-center justify-center active:scale-95 transition-transform">
            <i className="fas fa-arrow-left text-gray-700 text-sm"></i>
          </button>
          <button onClick={handleSkip} className="text-sm font-semibold text-gray-600 hover:text-primary transition-colors">Skip</button>
        </div>

        <div id="progress-indicator-block-4" className="px-6 pt-2 pb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500">Step 4 of 7</span>
            <span className="text-xs font-medium text-gray-400">56% Complete</span>
          </div>
          <div className="w-full h-1.5 bg-gray-200/60 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-teal-600 rounded-full transition-all duration-500" style={{ width: '56%' }}></div>
          </div>
        </div>

        <div id="illustration-block-usecase" className="px-6 pb-6 flex justify-center">
          <div className="w-48 h-48 rounded-3xl bg-gradient-to-br from-rose-50 to-rose-100 flex items-center justify-center shadow-lg shadow-rose-200/50 border border-rose-100">
            <i className="fas fa-briefcase text-7xl text-rose-600 opacity-90"></i>
          </div>
        </div>

        <div id="content-block-usecase" className="px-6 pb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-3 leading-tight text-center">How Will You Use Receipt Cycle?</h2>
          <p className="text-sm text-gray-600 leading-relaxed text-center max-w-sm mx-auto">Select all that apply. We'll customize features to match your needs.</p>
        </div>

        <div id="usecase-options-block" className="px-6 pb-6">
          <div className="space-y-3">
            <button onClick={() => toggleUsecase('personal')} className={`w-full bg-white/70 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border-2 hover:border-primary hover:bg-primary/5 transition-all active:scale-98 flex items-center gap-4 text-left ${selectedUsecases.includes('personal') ? 'border-primary bg-primary/5' : 'border-gray-100/50'}`}>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-50 to-teal-100 flex items-center justify-center flex-shrink-0">
                <i className="fas fa-home text-xl text-teal-600"></i>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-gray-900 mb-0.5">Personal Budget</h4>
                <p className="text-xs text-gray-600">Track household and personal spending</p>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selectedUsecases.includes('personal') ? 'border-primary bg-primary' : 'border-gray-300'}`}>
                <i className={`fas fa-check text-xs text-white ${selectedUsecases.includes('personal') ? '' : 'hidden'}`}></i>
              </div>
            </button>

            <button onClick={() => toggleUsecase('expense')} className={`w-full bg-white/70 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border-2 hover:border-primary hover:bg-primary/5 transition-all active:scale-98 flex items-center gap-4 text-left ${selectedUsecases.includes('expense') ? 'border-primary bg-primary/5' : 'border-gray-100/50'}`}>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center flex-shrink-0">
                <i className="fas fa-file-invoice text-xl text-blue-600"></i>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-gray-900 mb-0.5">Submit Expense Reports</h4>
                <p className="text-xs text-gray-600">Create reports for reimbursement</p>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selectedUsecases.includes('expense') ? 'border-primary bg-primary' : 'border-gray-300'}`}>
                <i className={`fas fa-check text-xs text-white ${selectedUsecases.includes('expense') ? '' : 'hidden'}`}></i>
              </div>
            </button>

            <button onClick={() => toggleUsecase('tax')} className={`w-full bg-white/70 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border-2 hover:border-primary hover:bg-primary/5 transition-all active:scale-98 flex items-center gap-4 text-left ${selectedUsecases.includes('tax') ? 'border-primary bg-primary/5' : 'border-gray-100/50'}`}>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center flex-shrink-0">
                <i className="fas fa-receipt text-xl text-purple-600"></i>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-gray-900 mb-0.5">Tax Deductions</h4>
                <p className="text-xs text-gray-600">Track deductible business expenses</p>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selectedUsecases.includes('tax') ? 'border-primary bg-primary' : 'border-gray-300'}`}>
                <i className={`fas fa-check text-xs text-white ${selectedUsecases.includes('tax') ? '' : 'hidden'}`}></i>
              </div>
            </button>
          </div>
        </div>

        <div id="benefit-cards-usecase" className="px-6 pb-6">
          <div className="bg-gradient-to-br from-primary/5 to-teal-50/50 rounded-3xl p-5 border border-primary/10">
            <h4 className="text-sm font-bold text-gray-900 mb-3">What You'll Get:</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <i className="fas fa-check-circle text-primary text-sm"></i>
                <span className="text-xs text-gray-700 font-medium">Custom categories for your use case</span>
              </div>
              <div className="flex items-center gap-2">
                <i className="fas fa-check-circle text-primary text-sm"></i>
                <span className="text-xs text-gray-700 font-medium">Smart expense templates</span>
              </div>
              <div className="flex items-center gap-2">
                <i className="fas fa-check-circle text-primary text-sm"></i>
                <span className="text-xs text-gray-700 font-medium">Tailored reports and insights</span>
              </div>
              <div className="flex items-center gap-2">
                <i className="fas fa-check-circle text-primary text-sm"></i>
                <span className="text-xs text-gray-700 font-medium">Tax-ready documentation</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1"></div>

        <div id="action-button-usecase" className="px-6 pb-6">
          <button onClick={handleNext} className="w-full h-14 bg-gradient-to-r from-primary to-teal-600 text-white text-base font-semibold rounded-2xl shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]">
            Next
          </button>
        </div>

        <div id="bottom-safe-area-4" className="h-4"></div>
      </div>

      {/* Step 5: Country */}
      <div id="onboarding-step-5-country" className={`pt-10 min-h-screen flex flex-col ${currentStep === 5 ? '' : 'hidden'}`}>
        <div id="onboarding-header-5" className="px-6 pt-4 pb-2 flex items-center justify-between">
          <button onClick={handleBack} className="w-9 h-9 rounded-xl bg-white/60 backdrop-blur-sm shadow-md shadow-gray-200/40 border border-gray-100/50 flex items-center justify-center active:scale-95 transition-transform">
            <i className="fas fa-arrow-left text-gray-700 text-sm"></i>
          </button>
          <button onClick={handleSkip} className="text-sm font-semibold text-gray-600 hover:text-primary transition-colors">Skip</button>
        </div>

        <div id="progress-indicator-block-5" className="px-6 pt-2 pb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500">Step 5 of 7</span>
            <span className="text-xs font-medium text-gray-400">70% Complete</span>
          </div>
          <div className="w-full h-1.5 bg-gray-200/60 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-teal-600 rounded-full transition-all duration-500" style={{ width: '70%' }}></div>
          </div>
        </div>

        <div id="illustration-block-country" className="px-6 pb-6 flex justify-center">
          <div className="w-48 h-48 rounded-3xl bg-gradient-to-br from-cyan-50 to-cyan-100 flex items-center justify-center shadow-lg shadow-cyan-200/50 border border-cyan-100">
            <i className="fas fa-globe-americas text-7xl text-cyan-600 opacity-90"></i>
          </div>
        </div>

        <div id="content-block-country" className="px-6 pb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-3 leading-tight text-center">What Country Are You In?</h2>
          <p className="text-sm text-gray-600 leading-relaxed text-center max-w-sm mx-auto">We'll customize tax rules, date formats, and regional features for you.</p>
        </div>

        <div id="country-selector-block" className="px-6 pb-6">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100/50 p-4">
            <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Select Country</label>
            <div className="relative">
              <select 
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full h-14 bg-white rounded-xl border-2 border-gray-200 px-4 text-base font-semibold text-gray-900 appearance-none focus:border-primary focus:outline-none transition-colors cursor-pointer"
              >
                <option value="">Choose your country...</option>
                <option value="US">🇺🇸 United States</option>
                <option value="CA">🇨🇦 Canada</option>
                <option value="GB">🇬🇧 United Kingdom</option>
                <option value="AU">🇦🇺 Australia</option>
                <option value="DE">🇩🇪 Germany</option>
                <option value="FR">🇫🇷 France</option>
                <option value="ES">🇪🇸 Spain</option>
                <option value="IT">🇮🇹 Italy</option>
                <option value="NL">🇳🇱 Netherlands</option>
                <option value="SE">🇸🇪 Sweden</option>
                <option value="NO">🇳🇴 Norway</option>
                <option value="DK">🇩🇰 Denmark</option>
                <option value="FI">🇫🇮 Finland</option>
                <option value="CH">🇨🇭 Switzerland</option>
                <option value="AT">🇦🇹 Austria</option>
                <option value="BE">🇧🇪 Belgium</option>
                <option value="IE">🇮🇪 Ireland</option>
                <option value="NZ">🇳🇿 New Zealand</option>
                <option value="SG">🇸🇬 Singapore</option>
                <option value="JP">🇯🇵 Japan</option>
                <option value="KR">🇰🇷 South Korea</option>
                <option value="IN">🇮🇳 India</option>
                <option value="BR">🇧🇷 Brazil</option>
                <option value="MX">🇲🇽 Mexico</option>
                <option value="AR">🇦🇷 Argentina</option>
                <option value="ZA">🇿🇦 South Africa</option>
              </select>
              <i className="fas fa-chevron-down absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"></i>
            </div>
          </div>
        </div>

        <div id="region-features-block" className="px-6 pb-6">
          <div className="bg-gradient-to-br from-blue-50/60 to-blue-100/40 backdrop-blur-sm rounded-2xl p-5 border border-blue-100/50">
            <h4 className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
              <i className="fas fa-map-marker-alt text-blue-600"></i>
              Regional Features
            </h4>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <i className="fas fa-check text-blue-600 text-xs mt-1 flex-shrink-0"></i>
                <span className="text-xs text-blue-800 leading-relaxed">Tax rules and deduction categories specific to your region</span>
              </div>
              <div className="flex items-start gap-2">
                <i className="fas fa-check text-blue-600 text-xs mt-1 flex-shrink-0"></i>
                <span className="text-xs text-blue-800 leading-relaxed">Automatic date format detection (MM/DD vs DD/MM)</span>
              </div>
              <div className="flex items-start gap-2">
                <i className="fas fa-check text-blue-600 text-xs mt-1 flex-shrink-0"></i>
                <span className="text-xs text-blue-800 leading-relaxed">Local merchant recognition and categorization</span>
              </div>
              <div className="flex items-start gap-2">
                <i className="fas fa-check text-blue-600 text-xs mt-1 flex-shrink-0"></i>
                <span className="text-xs text-blue-800 leading-relaxed">Region-appropriate currency and tax calculations</span>
              </div>
            </div>
          </div>
        </div>

        <div id="popular-regions-block" className="px-6 pb-6">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Popular Regions</h3>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => selectCountry('US')} className={`h-14 bg-white/60 backdrop-blur-sm rounded-xl shadow-md shadow-gray-200/40 border flex items-center justify-center gap-2 hover:border-primary hover:bg-primary/5 transition-all active:scale-95 ${selectedCountry === 'US' ? 'border-primary bg-primary/5' : 'border-gray-100/50'}`}>
              <span className="text-2xl">🇺🇸</span>
              <span className="text-sm font-semibold text-gray-900">United States</span>
            </button>
            <button onClick={() => selectCountry('GB')} className={`h-14 bg-white/60 backdrop-blur-sm rounded-xl shadow-md shadow-gray-200/40 border flex items-center justify-center gap-2 hover:border-primary hover:bg-primary/5 transition-all active:scale-95 ${selectedCountry === 'GB' ? 'border-primary bg-primary/5' : 'border-gray-100/50'}`}>
              <span className="text-2xl">🇬🇧</span>
              <span className="text-sm font-semibold text-gray-900">UK</span>
            </button>
            <button onClick={() => selectCountry('CA')} className={`h-14 bg-white/60 backdrop-blur-sm rounded-xl shadow-md shadow-gray-200/40 border flex items-center justify-center gap-2 hover:border-primary hover:bg-primary/5 transition-all active:scale-95 ${selectedCountry === 'CA' ? 'border-primary bg-primary/5' : 'border-gray-100/50'}`}>
              <span className="text-2xl">🇨🇦</span>
              <span className="text-sm font-semibold text-gray-900">Canada</span>
            </button>
            <button onClick={() => selectCountry('AU')} className={`h-14 bg-white/60 backdrop-blur-sm rounded-xl shadow-md shadow-gray-200/40 border flex items-center justify-center gap-2 hover:border-primary hover:bg-primary/5 transition-all active:scale-95 ${selectedCountry === 'AU' ? 'border-primary bg-primary/5' : 'border-gray-100/50'}`}>
              <span className="text-2xl">🇦🇺</span>
              <span className="text-sm font-semibold text-gray-900">Australia</span>
            </button>
          </div>
        </div>

        <div className="flex-1"></div>

        <div id="action-button-country" className="px-6 pb-6">
          <button onClick={handleNext} className="w-full h-14 bg-gradient-to-r from-primary to-teal-600 text-white text-base font-semibold rounded-2xl shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]">
            Next
          </button>
        </div>

        <div id="bottom-safe-area-5" className="h-4"></div>
      </div>

      {/* Step 6: Industry */}
      <div id="onboarding-step-6-industry" className={`pt-10 min-h-screen flex flex-col ${currentStep === 6 ? '' : 'hidden'}`}>
        <div id="onboarding-header-6" className="px-6 pt-4 pb-2 flex items-center justify-between">
          <button onClick={handleBack} className="w-9 h-9 rounded-xl bg-white/60 backdrop-blur-sm shadow-md shadow-gray-200/40 border border-gray-100/50 flex items-center justify-center active:scale-95 transition-transform">
            <i className="fas fa-arrow-left text-gray-700 text-sm"></i>
          </button>
          <button onClick={handleSkip} className="text-sm font-semibold text-gray-600 hover:text-primary transition-colors">Skip</button>
        </div>

        <div id="progress-indicator-block-6" className="px-6 pt-2 pb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500">Step 6 of 7</span>
            <span className="text-xs font-medium text-gray-400">84% Complete</span>
          </div>
          <div className="w-full h-1.5 bg-gray-200/60 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-teal-600 rounded-full transition-all duration-500" style={{ width: '84%' }}></div>
          </div>
        </div>

        <div id="illustration-block-industry" className="px-6 pb-6 flex justify-center">
          <div className="w-48 h-48 rounded-3xl bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center shadow-lg shadow-amber-200/50 border border-amber-100">
            <i className="fas fa-building text-7xl text-amber-600 opacity-90"></i>
          </div>
        </div>

        <div id="content-block-industry" className="px-6 pb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-3 leading-tight text-center">What Industry Are You In?</h2>
          <p className="text-sm text-gray-600 leading-relaxed text-center max-w-sm mx-auto">Optional but helps us provide tailored insights and expense categories.</p>
        </div>

        <div id="industry-options-block" className="px-6 pb-6">
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setSelectedIndustry('construction')} className={`bg-white/70 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border-2 hover:border-primary hover:bg-primary/5 transition-all active:scale-95 flex flex-col items-center text-center gap-2 ${selectedIndustry === 'construction' ? 'border-primary bg-primary/5' : 'border-gray-100/50'}`}>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
                <i className="fas fa-hard-hat text-xl text-orange-600"></i>
              </div>
              <span className="text-sm font-semibold text-gray-900">Construction</span>
            </button>

            <button onClick={() => setSelectedIndustry('influencer')} className={`bg-white/70 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border-2 hover:border-primary hover:bg-primary/5 transition-all active:scale-95 flex flex-col items-center text-center gap-2 ${selectedIndustry === 'influencer' ? 'border-primary bg-primary/5' : 'border-gray-100/50'}`}>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-50 to-pink-100 flex items-center justify-center">
                <i className="fas fa-camera text-xl text-pink-600"></i>
              </div>
              <span className="text-sm font-semibold text-gray-900">Influencer</span>
            </button>

            <button onClick={() => setSelectedIndustry('health')} className={`bg-white/70 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border-2 hover:border-primary hover:bg-primary/5 transition-all active:scale-95 flex flex-col items-center text-center gap-2 ${selectedIndustry === 'health' ? 'border-primary bg-primary/5' : 'border-gray-100/50'}`}>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
                <i className="fas fa-heartbeat text-xl text-red-600"></i>
              </div>
              <span className="text-sm font-semibold text-gray-900">Health</span>
            </button>

            <button onClick={() => setSelectedIndustry('sales')} className={`bg-white/70 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border-2 hover:border-primary hover:bg-primary/5 transition-all active:scale-95 flex flex-col items-center text-center gap-2 ${selectedIndustry === 'sales' ? 'border-primary bg-primary/5' : 'border-gray-100/50'}`}>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                <i className="fas fa-handshake text-xl text-blue-600"></i>
              </div>
              <span className="text-sm font-semibold text-gray-900">Sales</span>
            </button>

            <button onClick={() => setSelectedIndustry('real-estate')} className={`bg-white/70 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border-2 hover:border-primary hover:bg-primary/5 transition-all active:scale-95 flex flex-col items-center text-center gap-2 ${selectedIndustry === 'real-estate' ? 'border-primary bg-primary/5' : 'border-gray-100/50'}`}>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center">
                <i className="fas fa-home text-xl text-purple-600"></i>
              </div>
              <span className="text-sm font-semibold text-gray-900">Real Estate</span>
            </button>

            <button onClick={() => setSelectedIndustry('digital')} className={`bg-white/70 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border-2 hover:border-primary hover:bg-primary/5 transition-all active:scale-95 flex flex-col items-center text-center gap-2 ${selectedIndustry === 'digital' ? 'border-primary bg-primary/5' : 'border-gray-100/50'}`}>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center justify-center">
                <i className="fas fa-laptop-code text-xl text-indigo-600"></i>
              </div>
              <span className="text-sm font-semibold text-gray-900">Digital Products</span>
            </button>

            <button onClick={() => setSelectedIndustry('food')} className={`bg-white/70 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border-2 hover:border-primary hover:bg-primary/5 transition-all active:scale-95 flex flex-col items-center text-center gap-2 ${selectedIndustry === 'food' ? 'border-primary bg-primary/5' : 'border-gray-100/50'}`}>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
                <i className="fas fa-utensils text-xl text-green-600"></i>
              </div>
              <span className="text-sm font-semibold text-gray-900">Food & Beverage</span>
            </button>

            <button onClick={() => setSelectedIndustry('retail')} className={`bg-white/70 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border-2 hover:border-primary hover:bg-primary/5 transition-all active:scale-95 flex flex-col items-center text-center gap-2 ${selectedIndustry === 'retail' ? 'border-primary bg-primary/5' : 'border-gray-100/50'}`}>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-50 to-teal-100 flex items-center justify-center">
                <i className="fas fa-shopping-bag text-xl text-teal-600"></i>
              </div>
              <span className="text-sm font-semibold text-gray-900">Retail</span>
            </button>

            <button onClick={() => setSelectedIndustry('travel')} className={`bg-white/70 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border-2 hover:border-primary hover:bg-primary/5 transition-all active:scale-95 flex flex-col items-center text-center gap-2 ${selectedIndustry === 'travel' ? 'border-primary bg-primary/5' : 'border-gray-100/50'}`}>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-50 to-cyan-100 flex items-center justify-center">
                <i className="fas fa-plane text-xl text-cyan-600"></i>
              </div>
              <span className="text-sm font-semibold text-gray-900">Travel</span>
            </button>

            <button onClick={() => setSelectedIndustry('creative')} className={`bg-white/70 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border-2 hover:border-primary hover:bg-primary/5 transition-all active:scale-95 flex flex-col items-center text-center gap-2 ${selectedIndustry === 'creative' ? 'border-primary bg-primary/5' : 'border-gray-100/50'}`}>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-50 to-yellow-100 flex items-center justify-center">
                <i className="fas fa-paint-brush text-xl text-yellow-600"></i>
              </div>
              <span className="text-sm font-semibold text-gray-900">Creative</span>
            </button>

            <button onClick={() => setSelectedIndustry('consulting')} className={`bg-white/70 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border-2 hover:border-primary hover:bg-primary/5 transition-all active:scale-95 flex flex-col items-center text-center gap-2 ${selectedIndustry === 'consulting' ? 'border-primary bg-primary/5' : 'border-gray-100/50'}`}>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                <i className="fas fa-cog text-xl text-gray-600"></i>
              </div>
              <span className="text-sm font-semibold text-gray-900">Consulting</span>
            </button>

            <button onClick={() => setSelectedIndustry('other')} className={`bg-white/70 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border-2 hover:border-primary hover:bg-primary/5 transition-all active:scale-95 flex flex-col items-center text-center gap-2 ${selectedIndustry === 'other' ? 'border-primary bg-primary/5' : 'border-gray-100/50'}`}>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-50 to-rose-100 flex items-center justify-center">
                <i className="fas fa-ellipsis-h text-xl text-rose-600"></i>
              </div>
              <span className="text-sm font-semibold text-gray-900">Other</span>
            </button>
          </div>
        </div>

        <div id="industry-benefit-block" className="px-6 pb-6">
          <div className="bg-gradient-to-br from-primary/5 to-teal-50/50 rounded-2xl p-5 border border-primary/10">
            <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <i className="fas fa-lightbulb text-primary"></i>
              Industry-Specific Benefits
            </h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <i className="fas fa-check-circle text-primary text-xs"></i>
                <span className="text-xs text-gray-700">Custom expense categories for your field</span>
              </div>
              <div className="flex items-center gap-2">
                <i className="fas fa-check-circle text-primary text-xs"></i>
                <span className="text-xs text-gray-700">Benchmarking against industry averages</span>
              </div>
              <div className="flex items-center gap-2">
                <i className="fas fa-check-circle text-primary text-xs"></i>
                <span className="text-xs text-gray-700">Relevant tax deduction recommendations</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1"></div>

        <div id="action-button-industry" className="px-6 pb-6">
          <button onClick={handleNext} className="w-full h-14 bg-gradient-to-r from-primary to-teal-600 text-white text-base font-semibold rounded-2xl shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]">
            Next
          </button>
        </div>

        <div id="bottom-safe-area-6" className="h-4"></div>
      </div>

      {/* Step 7: First Receipt */}
      <div id="onboarding-step-7-first-receipt" className={`pt-10 min-h-screen flex flex-col ${currentStep === 7 ? '' : 'hidden'}`}>
        <div id="onboarding-header-7" className="px-6 pt-4 pb-2 flex items-center justify-between">
          <button onClick={handleBack} className="w-9 h-9 rounded-xl bg-white/60 backdrop-blur-sm shadow-md shadow-gray-200/40 border border-gray-100/50 flex items-center justify-center active:scale-95 transition-transform">
            <i className="fas fa-arrow-left text-gray-700 text-sm"></i>
          </button>
          <button onClick={handleSkip} className="text-sm font-semibold text-gray-600 hover:text-primary transition-colors">Skip</button>
        </div>

        <div id="progress-indicator-block-7" className="px-6 pt-2 pb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500">Step 7 of 7</span>
            <span className="text-xs font-medium text-gray-400">100% Complete</span>
          </div>
          <div className="w-full h-1.5 bg-gray-200/60 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-teal-600 rounded-full transition-all duration-500" style={{ width: '100%' }}></div>
          </div>
        </div>

        <div id="illustration-block-receipt" className="px-6 pb-6 flex justify-center">
          <div className="w-48 h-48 rounded-3xl bg-gradient-to-br from-primary/10 to-teal-50 flex items-center justify-center shadow-lg shadow-primary/20 border border-primary/20">
            <i className="fas fa-receipt text-7xl text-primary opacity-90"></i>
          </div>
        </div>

        <div id="content-block-receipt" className="px-6 pb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-3 leading-tight text-center">Track Your First Expense!</h2>
          <p className="text-sm text-gray-600 leading-relaxed text-center max-w-sm mx-auto">Let's get started by adding your first receipt or expense. This helps us show you how Receipt Cycle works.</p>
        </div>

        <div id="first-receipt-options-block" className="px-6 pb-6">
          <div className="space-y-3">
            <button className="w-full bg-gradient-to-br from-primary/5 to-teal-50/50 backdrop-blur-sm rounded-3xl p-6 shadow-lg shadow-gray-200/50 border-2 border-primary/20 hover:border-primary hover:shadow-xl hover:shadow-primary/20 transition-all active:scale-98">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-teal-600 flex items-center justify-center shadow-lg shadow-primary/30">
                  <i className="fas fa-camera text-2xl text-white"></i>
                </div>
                <div className="flex-1 text-left">
                  <h3 className="text-base font-bold text-gray-900 mb-1">Scan Receipt</h3>
                  <p className="text-xs text-gray-600">Use your camera to capture</p>
                </div>
                <i className="fas fa-arrow-right text-primary text-lg"></i>
              </div>
              <div className="pt-3 border-t border-primary/10 flex items-center gap-2">
                <i className="fas fa-star text-xs text-amber-500"></i>
                <span className="text-xs text-gray-600 font-medium">Recommended - Fastest way to start</span>
              </div>
            </button>

            <button className="w-full bg-white/70 backdrop-blur-sm rounded-2xl p-5 shadow-md shadow-gray-200/40 border-2 border-gray-100/50 hover:border-primary hover:bg-primary/5 transition-all active:scale-98 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                <i className="fas fa-image text-xl text-blue-600"></i>
              </div>
              <div className="flex-1 text-left">
                <h4 className="text-sm font-semibold text-gray-900 mb-0.5">Upload from Gallery</h4>
                <p className="text-xs text-gray-600">Choose an existing photo</p>
              </div>
              <i className="fas fa-chevron-right text-gray-400"></i>
            </button>

            <button className="w-full bg-white/70 backdrop-blur-sm rounded-2xl p-5 shadow-md shadow-gray-200/40 border-2 border-gray-100/50 hover:border-primary hover:bg-primary/5 transition-all active:scale-98 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center">
                <i className="fas fa-file-pdf text-xl text-purple-600"></i>
              </div>
              <div className="flex-1 text-left">
                <h4 className="text-sm font-semibold text-gray-900 mb-0.5">Upload PDF Receipt</h4>
                <p className="text-xs text-gray-600">Import PDF documents</p>
              </div>
              <i className="fas fa-chevron-right text-gray-400"></i>
            </button>

            <button className="w-full bg-white/70 backdrop-blur-sm rounded-2xl p-5 shadow-md shadow-gray-200/40 border-2 border-gray-100/50 hover:border-primary hover:bg-primary/5 transition-all active:scale-98 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
                <i className="fas fa-keyboard text-xl text-green-600"></i>
              </div>
              <div className="flex-1 text-left">
                <h4 className="text-sm font-semibold text-gray-900 mb-0.5">Enter Manually</h4>
                <p className="text-xs text-gray-600">Type in expense details</p>
              </div>
              <i className="fas fa-chevron-right text-gray-400"></i>
            </button>
          </div>
        </div>

        <div id="skip-option-block" className="px-6 pb-6">
          <button onClick={handleFinish} className="w-full h-12 bg-gray-100/60 backdrop-blur-sm rounded-xl text-gray-700 text-sm font-semibold hover:bg-gray-200/60 transition-all active:scale-98 flex items-center justify-center gap-2">
            <i className="fas fa-forward text-xs"></i>
            Skip for now, I'll add receipts later
          </button>
        </div>

        <div id="quick-tip-receipt" className="px-6 pb-6">
          <div className="bg-gradient-to-br from-amber-50/60 to-amber-100/40 backdrop-blur-sm rounded-2xl p-4 border border-amber-100/50 flex items-start gap-3">
            <i className="fas fa-magic text-amber-600 text-lg flex-shrink-0 mt-0.5"></i>
            <div>
              <h4 className="text-sm font-semibold text-amber-900 mb-1">AI-Powered Scanning</h4>
              <p className="text-xs text-amber-700 leading-relaxed">Our OCR technology automatically extracts merchant name, amount, date, tax, and categorizes your expenses instantly.</p>
            </div>
          </div>
        </div>

        <div id="completion-celebration-block" className="px-6 pb-6">
          <div className="bg-gradient-to-br from-primary/5 to-teal-50/50 rounded-3xl p-6 border border-primary/10 text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-teal-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/30">
              <i className="fas fa-check text-3xl text-white"></i>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Setup Complete!</h3>
            <p className="text-sm text-gray-600 leading-relaxed mb-4">You're all set to start tracking your expenses and discovering money leaks.</p>
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
              <i className="fas fa-clock"></i>
              <span>Takes less than 60 seconds to get insights</span>
            </div>
          </div>
        </div>

        <div className="flex-1"></div>

        <div id="action-button-finish" className="px-6 pb-6">
          <button onClick={handleFinish} className="w-full h-14 bg-gradient-to-r from-primary to-teal-600 text-white text-base font-semibold rounded-2xl shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2">
            <span>Get Started</span>
            <i className="fas fa-arrow-right"></i>
          </button>
        </div>

        <div id="bottom-safe-area-7" className="h-4"></div>
      </div>
    </div>
  );
};

export default Onboarding;
