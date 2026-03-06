import { useState } from 'react';
import { Product } from '../types';

export const useInventoryView = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeView, setActiveView] = useState('products');
  const [displayMode, setDisplayMode] = useState<'table' | 'grid'>('table');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
      setIsModalOpen(false);
  };

  return {
    searchTerm,
    setSearchTerm,
    activeView,
    setActiveView,
    displayMode,
    setDisplayMode,
    selectedProduct,
    setSelectedProduct,
    editingProduct,
    isModalOpen,
    setIsModalOpen,
    handleEdit,
    handleAdd,
    handleCloseModal
  };
};
