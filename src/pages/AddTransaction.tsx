import { useState, useRef, ChangeEvent, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ResponsiveLayout from "@/components/layout/ResponsiveLayout";
import { useReceiptScanner } from "@/hooks/use-receipt-scanner";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import QuickActions from "@/components/transactions/QuickActions";

interface FormData {
  amount: string;
  merchant: string;
  category: string;
  date: string;
  paymentMethod: string;
  tags: string;
  notes: string;
}

const AddTransactionContent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { scan, isScanning, scanResult } = useReceiptScanner();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [transactionType, setTransactionType] = useState<'expense' | 'income'>('expense');
  const [isRecurring, setIsRecurring] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    amount: '',
    merchant: '',
    category: 'Food & Dining',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'Cash',
    tags: '',
    notes: '',
  });

  // Pre-fill form from scanned data if passed via navigation
  useEffect(() => {
    const scannedData = location.state?.scannedData;
    if (scannedData) {
      setFormData(prev => ({
        ...prev,
        amount: scannedData.total_amount?.toString() || prev.amount,
        merchant: scannedData.merchant_name || prev.merchant,
        category: scannedData.category || prev.category,
        date: scannedData.date || prev.date,
        paymentMethod: scannedData.payment_method || prev.paymentMethod,
      }));
    }
  }, [location.state]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await scan(file);
      if (result.success && result.extracted_data) {
        const data = result.extracted_data;
        setFormData(prev => ({
          ...prev,
          amount: data.total_amount?.toString() || prev.amount,
          merchant: data.merchant_name || prev.merchant,
          category: data.category || prev.category,
          date: data.date || prev.date,
          paymentMethod: data.payment_method || prev.paymentMethod,
        }));
      }
    } catch (error) {
      console.error('Scan failed:', error);
    }
  };

  const handleScanReceipt = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveTransaction = async () => {
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid amount',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: 'Sign in required',
          description: 'Please sign in to save transactions',
          variant: 'destructive',
        });
        navigate('/signin');
        return;
      }

      const receiptData = scanResult?.extracted_data || location.state?.receiptData?.extracted_data || null;

      const { error } = await supabase.from('transactions').insert({
        user_id: user.id,
        amount: parseFloat(formData.amount),
        type: transactionType,
        category: formData.category,
        merchant: formData.merchant,
        date: formData.date,
        payment_method: formData.paymentMethod,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        description: formData.notes,
        is_recurring: isRecurring,
        receipt_data: receiptData,
      });

      if (error) throw error;

      toast({
        title: 'Transaction saved!',
        description: `${transactionType === 'expense' ? 'Expense' : 'Income'} of $${formData.amount} recorded.`,
      });
      
      navigate('/transaction');
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: 'Failed to save',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const categoryOptions = [
    { icon: 'fa-utensils', color: 'amber', label: 'Food & Dining' },
    { icon: 'fa-shopping-cart', color: 'blue', label: 'Shopping' },
    { icon: 'fa-car', color: 'purple', label: 'Transportation' },
    { icon: 'fa-home', color: 'green', label: 'Bills' },
    { icon: 'fa-heartbeat', color: 'red', label: 'Health' },
    { icon: 'fa-film', color: 'pink', label: 'Entertainment' },
    { icon: 'fa-graduation-cap', color: 'indigo', label: 'Education' },
    { icon: 'fa-ellipsis-h', color: 'gray', label: 'Other' },
  ];

  return (
    <div id="root-container" className="pt-10 min-h-screen flex flex-col pb-20">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        capture="environment"
        className="hidden"
        onChange={handleFileSelect}
      />
      
      <div id="header" className="sticky top-10 bg-white/80 backdrop-blur-md z-40 px-4 py-4 shadow-sm border-b border-gray-100/50">
        <div className="flex items-center justify-between">
          <button onClick={handleBack} className="w-10 h-10 rounded-xl bg-white shadow-md shadow-gray-200/50 flex items-center justify-center border border-gray-100/50 active:scale-95 transition-transform">
            <i className="fas fa-arrow-left text-gray-900"></i>
          </button>
          <h1 className="text-lg font-bold text-gray-900">Add Transaction</h1>
          <button className="w-10 h-10 rounded-xl bg-white shadow-md shadow-gray-200/50 flex items-center justify-center border border-gray-100/50 active:scale-95 transition-transform">
            <i className="fas fa-question-circle text-gray-500"></i>
          </button>
        </div>
      </div>

      <div id="transaction-type-selector" className="px-4 pt-6 pb-4">
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-1.5 shadow-lg shadow-gray-200/50 border border-gray-100/50 flex gap-1.5">
          <button 
            onClick={() => setTransactionType('expense')}
            className={`flex-1 h-12 ${transactionType === 'expense' ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md shadow-red-500/30' : 'bg-gray-50 text-gray-600'} text-sm font-semibold rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform`}
          >
            <i className="fas fa-arrow-down"></i>
            Expense
          </button>
          <button 
            onClick={() => setTransactionType('income')}
            className={`flex-1 h-12 ${transactionType === 'income' ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md shadow-green-500/30' : 'bg-gray-50 text-gray-600'} text-sm font-semibold rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform`}
          >
            <i className="fas fa-arrow-up"></i>
            Income
          </button>
        </div>
      </div>

      <div id="amount-section" className="px-4 pb-6">
        <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 shadow-lg shadow-gray-200/50 border border-gray-100/50">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 block">Amount</label>
          <div className="flex items-center gap-3">
            <div className="text-3xl font-bold text-gray-400">$</div>
            <input 
              type="number" 
              step="0.01"
              placeholder="0.00" 
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', e.target.value)}
              className="flex-1 text-4xl font-bold text-gray-900 bg-transparent border-none outline-none placeholder-gray-300" 
            />
          </div>
        </div>
      </div>

      <div id="date-section" className="px-4 pb-4">
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border border-gray-100/50">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 block">Date</label>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-teal-100 flex items-center justify-center flex-shrink-0">
              <i className="fas fa-calendar text-primary"></i>
            </div>
            <input 
              type="date" 
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              className="flex-1 text-base font-semibold text-gray-900 bg-transparent border-none outline-none" 
            />
          </div>
        </div>
      </div>

      <div id="merchant-section" className="px-4 pb-4">
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border border-gray-100/50">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 block">Merchant / Payee</label>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center flex-shrink-0">
              <i className="fas fa-store text-blue-600"></i>
            </div>
            <input 
              type="text" 
              placeholder="Enter merchant name" 
              value={formData.merchant}
              onChange={(e) => handleInputChange('merchant', e.target.value)}
              className="flex-1 text-base font-medium text-gray-900 bg-transparent border-none outline-none placeholder-gray-400" 
            />
          </div>
        </div>
      </div>

      <div id="category-section" className="px-4 pb-4">
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border border-gray-100/50">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 block">Category</label>
          <div className="grid grid-cols-4 gap-2">
            {categoryOptions.map((cat) => (
              <button 
                key={cat.label}
                onClick={() => handleInputChange('category', cat.label)}
                className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border active:scale-95 transition-transform ${
                  formData.category === cat.label 
                    ? 'bg-gradient-to-br from-primary/10 to-teal-100 border-primary/50' 
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <i className={`fas ${cat.icon} text-sm ${formData.category === cat.label ? 'text-primary' : 'text-gray-600'}`}></i>
                <span className={`text-xs font-medium ${formData.category === cat.label ? 'text-primary' : 'text-gray-700'}`}>{cat.label.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div id="receipt-upload-section" className="px-4 pb-4">
        <div className="bg-gradient-to-br from-primary/5 to-teal-50/50 rounded-3xl p-5 border border-primary/10 shadow-lg shadow-primary/5">
          <div className="flex items-center gap-2 mb-4">
            <i className="fas fa-receipt text-primary"></i>
            <label className="text-sm font-semibold text-gray-900">Receipt / Supporting Document</label>
            {isScanning && (
              <div className="ml-auto flex items-center gap-2 text-primary">
                <i className="fas fa-spinner fa-spin text-sm"></i>
                <span className="text-xs font-medium">Scanning...</span>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-3 gap-3 mb-4">
            <button 
              onClick={handleScanReceipt}
              disabled={isScanning}
              className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl shadow-md shadow-gray-200/40 border border-gray-100 active:scale-95 transition-transform disabled:opacity-50"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-teal-100 flex items-center justify-center">
                <i className="fas fa-camera text-primary text-lg"></i>
              </div>
              <span className="text-xs font-semibold text-gray-700 text-center">Scan Receipt</span>
            </button>
            
            <button 
              onClick={handleScanReceipt}
              disabled={isScanning}
              className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl shadow-md shadow-gray-200/40 border border-gray-100 active:scale-95 transition-transform disabled:opacity-50"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                <i className="fas fa-images text-blue-600 text-lg"></i>
              </div>
              <span className="text-xs font-semibold text-gray-700 text-center">From Gallery</span>
            </button>
            
            <button 
              onClick={handleScanReceipt}
              disabled={isScanning}
              className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl shadow-md shadow-gray-200/40 border border-gray-100 active:scale-95 transition-transform disabled:opacity-50"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center">
                <i className="fas fa-file-upload text-purple-600 text-lg"></i>
              </div>
              <span className="text-xs font-semibold text-gray-700 text-center">Upload File</span>
            </button>
          </div>

          {(scanResult?.success || location.state?.scannedData) && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4">
              <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
                <i className="fas fa-check-circle"></i>
                <span>Receipt scanned successfully! Data auto-filled.</span>
              </div>
            </div>
          )}

          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-primary/20">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <i className="fas fa-info-circle text-primary"></i>
              <span>OCR will auto-extract merchant, amount, date & tax details</span>
            </div>
          </div>
        </div>
      </div>

      <div id="notes-section" className="px-4 pb-4">
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border border-gray-100/50">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 block">Notes</label>
          <textarea 
            placeholder="Add notes or description..." 
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            className="w-full text-sm text-gray-900 bg-transparent border-none outline-none placeholder-gray-400 resize-none" 
            rows={2}
          />
        </div>
      </div>

      <div id="recurring-section" className="px-4 pb-4">
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border border-gray-100/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-50 to-cyan-100 flex items-center justify-center flex-shrink-0">
                <i className="fas fa-redo text-cyan-600"></i>
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">Repeat Transaction</div>
                <div className="text-xs text-gray-500">Set as recurring</div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={isRecurring}
                onChange={() => setIsRecurring(!isRecurring)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>
      </div>

      <div id="transaction-summary-section" className="px-4 pb-4">
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border border-gray-100/50">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Transaction Summary</div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Type</span>
              <span className={`font-semibold ${transactionType === 'expense' ? 'text-red-600' : 'text-green-600'}`}>
                {transactionType === 'expense' ? 'Expense' : 'Income'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Amount</span>
              <span className="font-semibold text-gray-900">${formData.amount || '0.00'}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Category</span>
              <span className="font-semibold text-gray-900">{formData.category}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Merchant</span>
              <span className="font-semibold text-gray-900">{formData.merchant || 'Not specified'}</span>
            </div>
          </div>
        </div>
      </div>

      <div id="action-buttons-section" className="px-4 pb-6">
        <button 
          onClick={handleSaveTransaction}
          disabled={isSaving}
          className="w-full h-14 bg-gradient-to-r from-primary to-teal-600 text-white text-base font-semibold rounded-2xl shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] mb-3 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <i className="fas fa-spinner fa-spin"></i>
              Saving...
            </>
          ) : (
            <>
              <i className="fas fa-check-circle"></i>
              Save Transaction
            </>
          )}
        </button>
      </div>

      <div id="bottom-safe-area" className="h-4"></div>
    </div>
  );
};

const MobileAddTransaction = () => {
  const navigate = useNavigate();
  
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
      <AddTransactionContent />

      <div id="bottom-nav" className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-100 shadow-2xl shadow-gray-900/10 z-50">
        <div className="flex items-center justify-around px-4 py-3">
          <button onClick={() => navigate('/dashboard')} className="flex flex-col items-center gap-1 text-gray-400 active:scale-95 transition-transform">
            <i className="fas fa-home text-xl"></i>
            <span className="text-xs font-medium">Home</span>
          </button>
          <button onClick={() => navigate('/transaction')} className="flex flex-col items-center gap-1 text-gray-400 active:scale-95 transition-transform">
            <i className="fas fa-list text-xl"></i>
            <span className="text-xs font-medium">Transactions</span>
          </button>
          <button className="relative -mt-6">
            <div className="w-16 h-16 bg-gradient-to-r from-primary to-teal-600 rounded-full shadow-lg shadow-primary/40 flex items-center justify-center">
              <i className="fas fa-plus text-white text-2xl"></i>
            </div>
          </button>
          <button onClick={() => navigate('/insight')} className="flex flex-col items-center gap-1 text-gray-400 active:scale-95 transition-transform">
            <i className="fas fa-chart-pie text-xl"></i>
            <span className="text-xs font-medium">Insights</span>
          </button>
          <button onClick={() => navigate('/setting')} className="flex flex-col items-center gap-1 text-gray-400 active:scale-95 transition-transform">
            <i className="fas fa-cog text-xl"></i>
            <span className="text-xs font-medium">Settings</span>
          </button>
        </div>
        <div className="h-6 bg-white"></div>
      </div>
    </div>
  );
};

const DesktopAddTransaction = () => {
  return (
    <ResponsiveLayout variant="app" showSidebar={true} mobileContent={<MobileAddTransaction />}>
      <div className="max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Add Transaction</h1>
          <p className="text-gray-600">Capture, categorize, and attach receipts in one place.</p>
        </div>
        
        {/* Quick Actions Section */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <QuickActions variant="grid" />
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
          <div className="p-6">
            <AddTransactionContent />
          </div>
        </div>
      </div>
    </ResponsiveLayout>
  );
};

const AddTransaction = () => {
  return <DesktopAddTransaction />;
};

export default AddTransaction;
