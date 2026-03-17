import { 
    Box, 
    Layers, 
    FileSearch, 
    Warehouse, 
    Car, 
    ArrowLeftRight, 
    Archive, 
    TrendingUp, 
    History,
    Activity,
    Sparkles
} from 'lucide-react';

export const getInventoryTabs = (t: (key: string, params?: any) => string) => [
    { id: 'products', label: t('products'), icon: Box },
    { id: 'low_stock', label: 'منخفض المخزون', icon: Activity },
    { id: 'smart_import', label: 'إدخال ذكي (AI)', icon: Sparkles },
    { id: 'categories', label: t('categories'), icon: Layers },
    { id: 'history', label: t('history'), icon: FileSearch },
    { id: 'warehouses', label: t('warehouses'), icon: Warehouse },
    { id: 'vehicles', label: t('common_vehicles'), icon: Car },
    { id: 'transfers', label: t('transfers'), icon: ArrowLeftRight },
    { id: 'dead_stock', label: t('dead_stock'), icon: Archive },
    { id: 'analysis', label: t('intelligence'), icon: TrendingUp },
    { id: 'audit', label: t('audit'), icon: History },
];
