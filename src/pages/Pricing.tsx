import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import ResponsiveLayout from "@/components/layout/ResponsiveLayout";
import DesktopFooter from "@/components/layout/DesktopFooter";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const PricingContent = () => {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState('yearly');

  const handleSkip = () => {
    navigate('/dashboard');
  };

  return (
    <>
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-4">
          <i className="fas fa-crown text-primary"></i>
          <span className="text-sm font-semibold text-primary">Upgrade to Premium</span>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">Choose the plan that works best for you. All plans include full access to our powerful receipt scanning and expense tracking features.</p>
      </div>

      {/* Limited Time Offer */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200/50 mb-8 max-w-3xl mx-auto">
        <div className="flex items-center justify-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <i className="fas fa-bolt text-white text-xl"></i>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-bold text-amber-700 uppercase tracking-wide">Limited Time Offer</span>
              <span className="px-2 py-0.5 bg-amber-200 text-amber-800 text-xs font-bold rounded-full">20% OFF</span>
            </div>
            <p className="text-base font-semibold text-gray-900">Special discount on yearly plan - Ends soon!</p>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-3 gap-6 mb-16 max-w-5xl mx-auto">
        {/* Weekly Plan */}
        <div 
          className={`bg-white rounded-2xl p-6 shadow-md border-2 transition-all cursor-pointer hover:shadow-lg ${selectedPlan === 'weekly' ? 'border-primary' : 'border-gray-200'}`}
          onClick={() => setSelectedPlan('weekly')}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Weekly Plan</h3>
              <p className="text-sm text-gray-600">Perfect for trial</p>
            </div>
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedPlan === 'weekly' ? 'bg-primary border-primary' : 'border-gray-300'}`}>
              {selectedPlan === 'weekly' && <i className="fas fa-check text-white text-xs"></i>}
            </div>
          </div>
          <div className="mb-6">
            <span className="text-4xl font-bold text-gray-900">$0.99</span>
            <span className="text-gray-600">/week</span>
          </div>
          <ul className="space-y-3 mb-6">
            <li className="flex items-center gap-2 text-sm text-gray-700">
              <i className="fas fa-check text-primary"></i>All premium features
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-700">
              <i className="fas fa-check text-primary"></i>Unlimited scans
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-700">
              <i className="fas fa-check text-primary"></i>Cancel anytime
            </li>
          </ul>
          <button className={`w-full h-11 rounded-xl font-semibold transition-all ${selectedPlan === 'weekly' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            Select Plan
          </button>
        </div>

        {/* Monthly Plan */}
        <div 
          className={`bg-white rounded-2xl p-6 shadow-md border-2 transition-all cursor-pointer hover:shadow-lg relative ${selectedPlan === 'monthly' ? 'border-primary' : 'border-gray-200'}`}
          onClick={() => setSelectedPlan('monthly')}
        >
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded-full">
            POPULAR
          </div>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Monthly Plan</h3>
              <p className="text-sm text-gray-600">Most flexible option</p>
            </div>
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedPlan === 'monthly' ? 'bg-primary border-primary' : 'border-gray-300'}`}>
              {selectedPlan === 'monthly' && <i className="fas fa-check text-white text-xs"></i>}
            </div>
          </div>
          <div className="mb-6">
            <span className="text-4xl font-bold text-gray-900">$3.99</span>
            <span className="text-gray-600">/month</span>
          </div>
          <ul className="space-y-3 mb-6">
            <li className="flex items-center gap-2 text-sm text-gray-700">
              <i className="fas fa-check text-primary"></i>All premium features
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-700">
              <i className="fas fa-check text-primary"></i>Unlimited scans
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-700">
              <i className="fas fa-check text-primary"></i>Priority support
            </li>
          </ul>
          <button className={`w-full h-11 rounded-xl font-semibold transition-all ${selectedPlan === 'monthly' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            Select Plan
          </button>
        </div>

        {/* Yearly Plan */}
        <div 
          className={`bg-gradient-to-br from-primary/5 to-teal-50 rounded-2xl p-6 shadow-lg border-2 transition-all cursor-pointer hover:shadow-xl relative ${selectedPlan === 'yearly' ? 'border-primary' : 'border-primary/30'}`}
          onClick={() => setSelectedPlan('yearly')}
        >
          <div className="absolute -top-3 right-4 px-3 py-1 bg-gradient-to-r from-primary to-teal-600 text-white text-xs font-bold rounded-full">
            BEST VALUE
          </div>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Yearly Plan</h3>
              <p className="text-sm text-gray-600">Save $9.58 per year</p>
            </div>
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedPlan === 'yearly' ? 'bg-primary border-primary' : 'border-gray-300'}`}>
              {selectedPlan === 'yearly' && <i className="fas fa-check text-white text-xs"></i>}
            </div>
          </div>
          <div className="mb-2">
            <span className="text-4xl font-bold text-primary">$38.30</span>
            <span className="text-gray-600">/year</span>
          </div>
          <div className="flex items-center gap-2 mb-6">
            <span className="text-sm text-gray-500 line-through">$47.88</span>
            <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs font-bold rounded-full">SAVE 20%</span>
          </div>
          <ul className="space-y-3 mb-6">
            <li className="flex items-center gap-2 text-sm text-gray-700 font-medium">
              <i className="fas fa-check text-primary"></i>All premium features
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-700 font-medium">
              <i className="fas fa-check text-primary"></i>Unlimited scans & uploads
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-700 font-medium">
              <i className="fas fa-check text-primary"></i>Priority support
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-700 font-medium">
              <i className="fas fa-check text-primary"></i>Early access to new features
            </li>
          </ul>
          <button className="w-full h-11 rounded-xl font-semibold bg-gradient-to-r from-primary to-teal-600 text-white shadow-md hover:shadow-lg transition-all">
            Get Started
          </button>
          <div className="mt-3 text-center text-xs text-gray-600">
            Equivalent to <span className="font-bold text-primary">$3.19/month</span>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Everything You Need to Track Expenses</h2>
        <div className="grid grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-teal-100 flex items-center justify-center mb-4">
              <i className="fas fa-infinity text-xl text-primary"></i>
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-2">Unlimited Scans</h3>
            <p className="text-sm text-gray-600">Scan and store unlimited receipts with advanced OCR technology.</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center mb-4">
              <i className="fas fa-brain text-xl text-purple-600"></i>
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-2">AI Insights</h3>
            <p className="text-sm text-gray-600">Discover hidden subscriptions and savings opportunities with AI.</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center mb-4">
              <i className="fas fa-chart-pie text-xl text-blue-600"></i>
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-2">Budget Tracking</h3>
            <p className="text-sm text-gray-600">Set budgets and track progress with detailed analytics.</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center mb-4">
              <i className="fas fa-file-export text-xl text-orange-600"></i>
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-2">Export Reports</h3>
            <p className="text-sm text-gray-600">Generate tax-ready reports in CSV, PDF, or Excel format.</p>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto mb-16">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Frequently Asked Questions</h2>
        <Accordion type="single" collapsible className="space-y-4">
          <AccordionItem value="item-1" className="bg-white rounded-xl border border-gray-100 px-6">
            <AccordionTrigger className="text-left font-semibold text-gray-900">Can I cancel my subscription anytime?</AccordionTrigger>
            <AccordionContent className="text-gray-600">
              Yes, you can cancel your subscription at any time. Your access will continue until the end of your billing period. No questions asked, no hidden fees.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2" className="bg-white rounded-xl border border-gray-100 px-6">
            <AccordionTrigger className="text-left font-semibold text-gray-900">What payment methods do you accept?</AccordionTrigger>
            <AccordionContent className="text-gray-600">
              We accept all major credit cards (Visa, MasterCard, American Express), Apple Pay, Google Pay, and PayPal. All payments are processed securely.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3" className="bg-white rounded-xl border border-gray-100 px-6">
            <AccordionTrigger className="text-left font-semibold text-gray-900">Is there a free trial available?</AccordionTrigger>
            <AccordionContent className="text-gray-600">
              Yes! You can try our weekly plan for just $0.99 to experience all premium features. This is a great way to see if Receipt Cycle is right for you.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-4" className="bg-white rounded-xl border border-gray-100 px-6">
            <AccordionTrigger className="text-left font-semibold text-gray-900">Can I switch between plans?</AccordionTrigger>
            <AccordionContent className="text-gray-600">
              Absolutely! You can upgrade or downgrade your plan at any time. When upgrading, you'll be prorated for the remaining time. When downgrading, changes take effect at your next billing date.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-5" className="bg-white rounded-xl border border-gray-100 px-6">
            <AccordionTrigger className="text-left font-semibold text-gray-900">Is my data secure?</AccordionTrigger>
            <AccordionContent className="text-gray-600">
              Your security is our top priority. We use bank-level encryption (256-bit SSL) to protect your data. We never share your information with third parties and comply with GDPR and CCPA regulations.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-br from-primary/10 to-teal-50 rounded-3xl p-12 text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Take Control of Your Finances?</h2>
        <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">Join thousands of users who are saving money and tracking expenses smarter with Receipt Cycle.</p>
        <div className="flex flex-col items-center gap-4">
          <button 
            onClick={() => navigate('/signup')}
            className="h-14 px-10 bg-gradient-to-r from-primary to-teal-600 text-white text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            Start Your Free Trial
          </button>
          <button 
            onClick={handleSkip}
            className="h-12 px-8 bg-white text-gray-700 text-base font-semibold rounded-xl border border-gray-200 hover:bg-gray-50 transition-all"
          >
            Skip for now — explore the app
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-4">No credit card required • Cancel anytime</p>
      </div>

      <DesktopFooter />
    </>
  );
};

const MobilePricing = () => {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState('yearly');

  const handleSkip = () => {
    navigate('/dashboard');
  };

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
      <div className="fixed top-0 left-0 right-0 h-10 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-between px-4 shadow-sm">
        <div className="text-xs font-semibold text-gray-900">9:41</div>
        <div className="flex items-center gap-1">
          <i className="fas fa-signal text-xs text-gray-900"></i>
          <i className="fas fa-wifi text-xs text-gray-900 ml-1"></i>
          <i className="fas fa-battery-full text-xs text-gray-900 ml-1"></i>
        </div>
      </div>

      <div className="pt-10 min-h-screen flex flex-col">
        <div className="sticky top-10 bg-white/80 backdrop-blur-md z-40 shadow-sm border-b border-gray-100/50">
          <div className="flex items-center justify-between px-4 py-3">
            <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-white shadow-md flex items-center justify-center">
              <i className="fas fa-arrow-left text-gray-900"></i>
            </button>
            <h1 className="text-base font-bold text-gray-900">Upgrade to Premium</h1>
            <button className="w-9 h-9 rounded-xl bg-white shadow-md flex items-center justify-center">
              <i className="fas fa-info-circle text-primary"></i>
            </button>
          </div>
        </div>

        <div className="px-6 pt-8 pb-6">
          <div className="relative bg-gradient-to-br from-primary/10 via-teal-50/50 to-emerald-100/30 rounded-3xl p-8 shadow-lg border border-primary/20 overflow-hidden">
            <div className="relative z-10 text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-teal-600 shadow-xl flex items-center justify-center">
                <i className="fas fa-crown text-3xl text-white"></i>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Unlock Full Receipt Cycle Features</h2>
              <p className="text-sm text-gray-600 leading-relaxed max-w-xs mx-auto">Track all your expenses, get AI insights, and save smarter</p>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6">
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-200/50 shadow-md">
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

        <div className="px-6 pb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">Choose Your Plan</h3>
          <div className="space-y-3">
            <div id="weekly-plan-card" className="bg-white/60 backdrop-blur-sm rounded-2xl p-5 shadow-md border-2 border-gray-200/50 cursor-pointer">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="text-base font-bold text-gray-900">Weekly Plan</h4>
                  <p className="text-xs text-gray-600">Perfect for trial</p>
                </div>
                <div className="plan-checkbox w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center flex-shrink-0 mt-0.5"></div>
              </div>
              <div className="flex items-baseline gap-1 mb-3">
                <span className="text-3xl font-bold text-gray-900">$0.99</span>
                <span className="text-sm text-gray-600">/week</span>
              </div>
            </div>

            <div id="monthly-plan-card" className="bg-white/60 backdrop-blur-sm rounded-2xl p-5 shadow-md border-2 border-gray-200/50 cursor-pointer">
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
            </div>

            <div id="yearly-plan-card" className="bg-gradient-to-br from-primary/10 via-teal-50/50 to-emerald-100/30 rounded-2xl p-5 shadow-lg border-2 border-primary cursor-pointer relative overflow-hidden">
              <div className="absolute top-3 right-3 bg-gradient-to-r from-primary to-teal-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md">
                BEST VALUE
              </div>
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 pr-16">
                  <h4 className="text-base font-bold text-gray-900">Yearly Plan</h4>
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
            </div>
          </div>
        </div>

      {/* CTA Button */}
        <div className="px-6 pb-8">
          <button className="w-full h-14 bg-gradient-to-r from-primary to-teal-600 text-white text-lg font-bold rounded-2xl shadow-xl">
            Continue
          </button>
          <button 
            onClick={handleSkip}
            className="w-full h-12 mt-3 bg-gray-100 text-gray-700 text-base font-semibold rounded-xl hover:bg-gray-200 transition-colors"
          >
            Skip for now
          </button>
          <p className="text-center text-xs text-gray-500 mt-3">Cancel anytime • Secure payment</p>
        </div>
      </div>
    </div>
  );
};

const Pricing = () => {
  return (
    <ResponsiveLayout
      mobileContent={<MobilePricing />}
      variant="landing"
      showSidebar={false}
    >
      <PricingContent />
    </ResponsiveLayout>
  );
};

export default Pricing;
