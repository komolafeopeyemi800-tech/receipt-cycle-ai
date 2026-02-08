import { useRef, ChangeEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReceiptScanner } from '@/hooks/use-receipt-scanner';
import { useToast } from '@/hooks/use-toast';
import { useScreenSize } from '@/hooks/use-screen-size';
import { supabase } from '@/integrations/supabase/client';

interface QuickActionsProps {
  variant?: 'horizontal' | 'grid';
  onScanComplete?: (result: any) => void;
}

export const QuickActions = ({ variant = 'horizontal', onScanComplete }: QuickActionsProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { scan, isScanning } = useReceiptScanner();
  const { isMobile, isTablet, isDesktop } = useScreenSize();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const statementInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  // On mobile/tablet, open camera directly. On desktop, open file picker
  const handleScanReceipt = () => {
    if (isMobile || isTablet) {
      cameraInputRef.current?.click();
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleUploadStatement = () => {
    statementInputRef.current?.click();
  };

  const handleReceiptSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await scan(file);
      if (result.success && result.extracted_data) {
        onScanComplete?.(result);
        // Navigate to add-transaction with pre-filled data
        navigate('/add-transaction', { 
          state: { 
            scannedData: result.extracted_data,
            receiptData: result 
          } 
        });
      }
    } catch (error) {
      console.error('Scan failed:', error);
    }
    // Reset input
    if (e.target) e.target.value = '';
  };

  const handleStatementSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: 'Sign in required',
          description: 'Please sign in to upload statements',
          variant: 'destructive',
        });
        navigate('/signin');
        return;
      }

      // For CSV files, we could parse them
      if (file.name.endsWith('.csv')) {
        const text = await file.text();
        const lines = text.split('\n');
        toast({
          title: 'Statement uploaded',
          description: `Found ${lines.length - 1} potential transactions. Processing...`,
        });
        // TODO: Parse CSV and create transactions
        navigate('/add-transaction');
      } else if (file.name.endsWith('.pdf')) {
        // Try to scan PDF as receipt
        const result = await scan(file);
        if (result.success) {
          onScanComplete?.(result);
          navigate('/add-transaction', { 
            state: { 
              scannedData: result.extracted_data,
              receiptData: result 
            } 
          });
        }
      } else {
        toast({
          title: 'Unsupported format',
          description: 'Please upload CSV, PDF, or OFX files',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleAddManually = () => {
    navigate('/add-transaction');
  };

  const handleSetBudget = () => {
    navigate('/setting');
    toast({
      title: 'Set your budget',
      description: 'Update your monthly budget in profile settings',
    });
  };

  const actions = [
    {
      id: 'scan',
      icon: 'fa-camera',
      label: 'Scan Receipt',
      sublabel: 'AI-powered',
      onClick: handleScanReceipt,
      loading: isScanning,
      gradient: 'from-primary/10 to-teal-50',
      iconGradient: 'from-primary to-teal-600',
      hoverBorder: 'hover:border-primary/40',
      borderColor: 'border-primary/20',
    },
    {
      id: 'upload',
      icon: 'fa-file-upload',
      label: 'Upload Statement',
      sublabel: 'CSV, PDF, OFX',
      onClick: handleUploadStatement,
      loading: isUploading,
      gradient: 'bg-white hover:bg-blue-50/50',
      iconGradient: 'from-blue-50 to-blue-100',
      iconColor: 'text-blue-600',
      hoverBorder: 'hover:border-blue-200',
      borderColor: 'border-gray-200',
    },
    {
      id: 'manual',
      icon: 'fa-plus',
      label: 'Add Manually',
      sublabel: 'Quick entry',
      onClick: handleAddManually,
      gradient: 'bg-white hover:bg-purple-50/50',
      iconGradient: 'from-purple-50 to-purple-100',
      iconColor: 'text-purple-600',
      hoverBorder: 'hover:border-purple-200',
      borderColor: 'border-gray-200',
    },
    {
      id: 'budget',
      icon: 'fa-bullseye',
      label: 'Set Budget',
      sublabel: 'New goal',
      onClick: handleSetBudget,
      gradient: 'bg-white hover:bg-amber-50/50',
      iconGradient: 'from-amber-50 to-amber-100',
      iconColor: 'text-amber-600',
      hoverBorder: 'hover:border-amber-200',
      borderColor: 'border-gray-200',
    },
  ];

  if (variant === 'grid') {
    return (
      <>
        {/* Camera input for mobile/tablet - opens camera directly */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleReceiptSelect}
        />
        {/* File input for desktop - file picker */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          className="hidden"
          onChange={handleReceiptSelect}
        />
        <input
          ref={statementInputRef}
          type="file"
          accept=".csv,.pdf,.ofx"
          className="hidden"
          onChange={handleStatementSelect}
        />
        <div className="grid grid-cols-4 gap-4">
          {actions.map((action) => (
            <button
              key={action.id}
              onClick={action.onClick}
              disabled={action.loading}
              className={`flex flex-col items-center gap-3 p-5 bg-gradient-to-br ${action.gradient} rounded-xl border ${action.borderColor} ${action.hoverBorder} transition-all group disabled:opacity-50`}
            >
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${action.iconGradient} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                <i className={`fas ${action.loading ? 'fa-spinner fa-spin' : action.icon} ${action.iconColor || 'text-white'} text-xl`}></i>
              </div>
              <div className="text-center">
                <div className="text-sm font-semibold text-gray-900">{action.label}</div>
                <div className="text-xs text-gray-500">{action.sublabel}</div>
              </div>
            </button>
          ))}
        </div>
      </>
    );
  }

  // Horizontal scrollable variant (for mobile)
  return (
    <>
      {/* Camera input for mobile/tablet - opens camera directly */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleReceiptSelect}
      />
      {/* File input for desktop - file picker */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        onChange={handleReceiptSelect}
      />
      <input
        ref={statementInputRef}
        type="file"
        accept=".csv,.pdf,.ofx"
        className="hidden"
        onChange={handleStatementSelect}
      />
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={action.onClick}
            disabled={action.loading}
            className={`min-w-[120px] bg-gradient-to-br ${action.gradient} rounded-2xl p-4 shadow-md border ${action.borderColor} hover:shadow-lg transition-all active:scale-95 disabled:opacity-50`}
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.iconGradient} flex items-center justify-center shadow-md mb-3`}>
              <i className={`fas ${action.loading ? 'fa-spinner fa-spin' : action.icon} ${action.iconColor || 'text-white'}`}></i>
            </div>
            <div className="text-xs font-semibold text-gray-900">{action.label}</div>
            <div className="text-[10px] text-gray-500">{action.sublabel}</div>
          </button>
        ))}
      </div>
    </>
  );
};

export default QuickActions;
