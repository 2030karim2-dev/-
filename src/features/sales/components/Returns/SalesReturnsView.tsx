import React, { useState } from 'react';
import InvoiceListView from '../list/InvoiceListView';
import CreateReturnModal from './CreateReturnModal';
import Button from '../../../../ui/base/Button';
import { RefreshCw, Plus } from 'lucide-react';

interface SalesReturnsViewProps {
  searchTerm: string;
  onViewDetails: (id: string) => void;
}

const SalesReturnsView: React.FC<SalesReturnsViewProps> = ({ searchTerm, onViewDetails }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-3 animate-in fade-in duration-300 pt-2">
      <div className="flex justify-end">
        <Button 
            onClick={() => setIsModalOpen(true)}
            variant="danger"
            size="sm"
            leftIcon={<Plus size={14} />}
        >
            مرتجع مبيعات جديد
        </Button>
      </div>
      
      <InvoiceListView 
        viewType="return_sale"
        searchTerm={searchTerm} 
        onViewDetails={onViewDetails} 
      />

      <CreateReturnModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default SalesReturnsView;