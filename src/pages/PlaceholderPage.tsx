import React from 'react';
import { useTranslation } from '../lib/hooks/useTranslation';

interface PlaceholderPageProps {
  title: string;
}

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title }) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-slate-600 bg-[#f8fafc] dark:bg-slate-950 transition-colors duration-300">
      <div className="text-6xl mb-4 opacity-20">🚧</div>
      <h2 className="text-2xl font-bold text-gray-600 dark:text-slate-400">{title}</h2>
      <p className="mt-2 text-sm">{t('placeholder_page_under_dev')}</p>
    </div>
  );
};

export default PlaceholderPage;
