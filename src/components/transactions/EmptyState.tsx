import { useNavigate } from 'react-router-dom';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState = ({
  title = 'No transactions yet',
  description = 'Start by scanning a receipt or adding a transaction manually.',
  icon = 'fa-receipt',
  actionLabel = 'Add Transaction',
  onAction,
}: EmptyStateProps) => {
  const navigate = useNavigate();

  const handleAction = () => {
    if (onAction) {
      onAction();
    } else {
      navigate('/add-transaction');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-teal-50 flex items-center justify-center mb-4">
        <i className={`fas ${icon} text-3xl text-primary`}></i>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 text-center mb-6 max-w-xs">{description}</p>
      <button
        onClick={handleAction}
        className="px-6 py-3 bg-gradient-to-r from-primary to-teal-600 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all"
      >
        <i className="fas fa-plus mr-2"></i>
        {actionLabel}
      </button>
    </div>
  );
};

export default EmptyState;
