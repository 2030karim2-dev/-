import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Save, Zap, ShieldCheck, Package, Info, Hash, DollarSign, Box } from 'lucide-react';
import { ProductFormData, Product } from '../types';
import Modal from '../../../ui/base/Modal';
import Button from '../../../ui/base/Button';
import Input from '../../../ui/base/Input';
import { useTranslation } from '../../../lib/hooks/useTranslation';
import { useAuthStore } from '../../auth/store';
import productService from '../services/productService';
import SimilarityAdvisor from './SimilarityAdvisor';
import { useDebounce } from 'use-debounce';

// Modular Form Components
import ProductImageUploader from './product_form/ProductImageUploader';
import ProductCoreInfo from './product_form/ProductCoreInfo';
import ProductCategory from './product_form/ProductCategory';
import ProductFinancials from './product_form/ProductFinancials';
import ProductStockInfo from './product_form/ProductStockInfo';
import ProductDetails from './product_form/ProductDetails';
import ProductFitment from './product_form/ProductFitment';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProductFormData) => void | Promise<void>;
  isSubmitting: boolean;
  initialData?: Product | null;
}

const AddProductModal: React.FC<Props> = ({ isOpen, onClose, onSubmit, isSubmitting, initialData }) => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [similarProducts, setSimilarProducts] = React.useState<any[]>([]);
  const [isCheckingSimilarity, setIsCheckingSimilarity] = React.useState(false);

  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm<ProductFormData>({
    defaultValues: {
      unit: 'piece',
      category: 'عام',
      min_stock_level: 5
    }
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          name: initialData.name,
          sku: initialData.sku,
          part_number: initialData.part_number,
          brand: initialData.brand,
          size: initialData.size,
          specifications: initialData.specifications,
          alternative_numbers: initialData.alternatives?.join(', '),
          image_url: initialData.image_url,
          cost_price: initialData.cost_price,
          selling_price: initialData.selling_price,
          min_stock_level: initialData.min_stock_level,
          stock_quantity: initialData.stock_quantity,
          unit: (initialData.unit as any) || 'piece',
          category: initialData.category || 'عام',
          location: initialData.location
        });
      } else {
        const autoSku = `AZ-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
        reset({
          name: '', sku: autoSku, part_number: '', brand: '', size: '', specifications: '',
          alternative_numbers: '', image_url: null, cost_price: '', selling_price: '',
          min_stock_level: 5, stock_quantity: 0, unit: 'piece', category: 'عام'
        });
      }
    }
  }, [isOpen, initialData, reset]);

  const productName = watch('name');
  const [debouncedName] = useDebounce(productName, 600);

  useEffect(() => {
    const checkSimilarity = async () => {
      if (!debouncedName || debouncedName.length < 3 || !user?.company_id || initialData) {
        setSimilarProducts([]);
        return;
      }

      setIsCheckingSimilarity(true);
      try {
        const results = await productService.getSimilarProducts(debouncedName, user.company_id);
        setSimilarProducts(results);
      } catch (err) {
        console.error('Similarity check failed:', err);
      } finally {
        setIsCheckingSimilarity(false);
      }
    };

    checkSimilarity();
  }, [debouncedName, user?.company_id, initialData]);

  const footer = (
    <div className="flex w-full gap-2 p-1">
      <button
        type="button"
        onClick={onClose}
        className="flex-1 py-3 text-[11px] font-black text-gray-500 bg-gray-50 dark:bg-slate-800 border dark:border-slate-700 uppercase tracking-widest hover:bg-gray-100 transition-colors"
      >
        {t('cancel')}
      </button>
      <Button
        onClick={handleSubmit(onSubmit)}
        isLoading={isSubmitting}
        className="flex-[2] rounded-none text-[11px] font-black bg-blue-600 border-blue-700 shadow-xl uppercase tracking-widest"
        leftIcon={<Save size={16} />}
      >
        {initialData ? t('update_data') : t('confirm_product')}
      </Button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      icon={initialData ? ShieldCheck : Package}
      title={initialData ? t('edit_product_title') : t('new_product_title')}
      description={t('product_card_desc')}
      footer={footer}
    >
      <div className="flex flex-col">
        {/* القسم الأول: الصورة، الكود، والتصنيف */}
        <div className="p-5 bg-white dark:bg-slate-900 border-b dark:border-slate-800 flex flex-row gap-6">
          <div className="flex flex-col gap-2 w-32 shrink-0">
            <ProductImageUploader setValue={setValue} watch={watch} />
            <div className="space-y-1">
              <label className="text-[9px] font-black text-blue-500 uppercase tracking-tighter text-center block">{t('product_code')}</label>
              <input
                {...register('sku')}
                readOnly
                className="w-full text-center font-mono text-[10px] font-black py-1.5 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 text-blue-700 dark:text-blue-400 outline-none rounded-lg"
              />
            </div>
          </div>
          <div className="flex-1 flex flex-col justify-center">
            <ProductCategory register={register} watch={watch} setValue={setValue} />
          </div>
        </div>

        {/* القسم الثاني: بيانات الصنف الأساسية */}
        <div className="p-5 border-b dark:border-slate-800 bg-gray-50/30 dark:bg-slate-950/30">
          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 px-1 mb-4">
            <Zap size={14} className="text-blue-500" />
            {t('identity_data')}
          </h4>
          <ProductCoreInfo register={register} errors={errors} />
          <SimilarityAdvisor
            isVisible={similarProducts.length > 0}
            similarProducts={similarProducts}
            onApplyName={(name) => setValue('name', name)}
          />
        </div>

        {/* القسم الثالث: المالية والمخزون والتفاصيل */}
        <div className="p-5 space-y-6 bg-white dark:bg-slate-900">
          <div className="grid grid-cols-2 gap-x-6">
            <div className="space-y-3">
              <h4 className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1.5 px-1">
                <DollarSign size={12} /> {t('pricing')}
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <ProductFinancials register={register} />
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest flex items-center gap-1.5 px-1">
                <Box size={12} /> {t('stock')}
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <ProductStockInfo register={register} />
              </div>
            </div>
          </div>
          <ProductDetails register={register} />
          <div className="pt-4 border-t dark:border-slate-800">
            <ProductFitment productId={initialData?.id} />
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default AddProductModal;
