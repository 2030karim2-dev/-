import React from 'react';
import { UseFormRegister } from 'react-hook-form';
import Input from '../../../../ui/base/Input';
import { ProductFormData } from '../../types';
import { Box, BellRing } from 'lucide-react';
import { useTranslation } from '../../../../lib/hooks/useTranslation';

interface Props { register: UseFormRegister<ProductFormData>; }

const ProductStockInfo: React.FC<Props> = ({ register }) => {
  const { t } = useTranslation();
  return (
    <>
      <Input 
        label={t('opening_balance')}
        type="number" 
        {...register('stock_quantity', { valueAsNumber: true })} 
        dir="ltr"
        icon={<Box className="text-blue-500" />}
        className="font-black text-blue-600 dark:text-blue-400"
      />
      <Input 
        label={t('alert_limit')}
        type="number" 
        {...register('min_stock_level', { valueAsNumber: true })} 
        dir="ltr"
        icon={<BellRing className="text-amber-500" />}
        className="font-black text-amber-600 dark:text-amber-400"
      />
    </>
  );
};

export default ProductStockInfo;
