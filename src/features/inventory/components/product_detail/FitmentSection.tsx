import React, { useState } from 'react';
import { Car, Plus, X, Trash2, Search, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../../auth/store';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi } from '../../api';
import { useTranslation } from '../../../../lib/hooks/useTranslation';
import { cn } from '../../../../core/utils';

interface Props {
    productId: string;
}

const FitmentSection: React.FC<Props> = ({ productId }) => {
    const { t } = useTranslation();
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const [isAdding, setIsAdding] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [foundVehicles, setFoundVehicles] = useState<any[]>([]);

    const { data: fitments, isLoading } = useQuery({
        queryKey: ['product_fitment', productId],
        queryFn: () => inventoryApi.getFitment(productId)
    });

    const addMutation = useMutation({
        mutationFn: inventoryApi.addFitment,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['product_fitment', productId] });
            setIsAdding(false);
            setSearchTerm('');
        }
    });

    const removeMutation = useMutation({
        mutationFn: inventoryApi.removeFitment,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['product_fitment', productId] })
    });

    const handleSearch = async (term: string) => {
        setSearchTerm(term);
        if (term.length > 2) {
            const res = await inventoryApi.searchVehicles(term);
            setFoundVehicles(res.data || []);
        } else {
            setFoundVehicles([]);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-950">
            {/* Toolbar */}
            <div className="flex justify-between items-center px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-2">
                    <Search size={12} className="text-slate-400" />
                    <input
                        type="text"
                        placeholder="بحث سريعة..."
                        className="bg-transparent border-none outline-none text-[10px] w-32 focus:w-48 transition-all font-bold"
                        value={searchTerm}
                        onChange={e => handleSearch(e.target.value)}
                    />
                </div>
                <button 
                    onClick={() => setIsAdding(!isAdding)} 
                    className={cn(
                        "flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded transition-colors",
                        isAdding ? "bg-rose-50 text-rose-600 dark:bg-rose-900/20" : "bg-blue-50 text-blue-600 dark:bg-blue-900/20 hover:bg-blue-100"
                    )}
                >
                    {isAdding ? <><X size={12} /> إلغاء</> : <><Plus size={12} /> {t('add')}</>}
                </button>
            </div>

            {/* Results for adding */}
            {isAdding && foundVehicles.length > 0 && (
                <div className="max-h-32 overflow-y-auto border-b border-slate-200 dark:border-slate-800 bg-blue-50/30 dark:bg-blue-900/10">
                    {foundVehicles.map((v: any) => (
                        <button
                            key={v.id}
                            onClick={() => addMutation.mutate({ company_id: user?.company_id || '', product_id: productId, vehicle_id: v.id })}
                            className="w-full text-right px-4 py-2 text-[10px] hover:bg-white dark:hover:bg-slate-900 flex justify-between items-center group border-b border-slate-100 dark:border-slate-800 last:border-0"
                        >
                            <span className="font-bold text-slate-700 dark:text-slate-300">{v.make} {v.model}</span>
                            <span className="text-slate-400 font-mono">{v.year_start}-{v.year_end}</span>
                        </button>
                    ))}
                </div>
            )}

            {/* Main Table */}
            <div className="flex-1 overflow-auto">
                <table className="w-full border-collapse">
                    <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 z-10">
                        <tr className="border-b border-slate-200 dark:border-slate-800">
                            <th className="text-right px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-tight w-1/2">{t('vehicle')}</th>
                            <th className="text-right px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-tight">{t('years')}</th>
                            <th className="w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
                        {isLoading ? (
                            <tr><td colSpan={3} className="text-center py-8 text-[10px] text-slate-400 font-bold uppercase tracking-widest">{t('loading')}</td></tr>
                        ) : fitments?.data?.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="text-center py-12 text-slate-300">
                                    <Car size={24} className="mx-auto mb-2 opacity-20" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">{t('no_fitment')}</span>
                                </td>
                            </tr>
                        ) : (
                            fitments?.data?.map((fit: any) => (
                                <tr key={fit.id} className="group hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                    <td className="px-4 py-2 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                        {fit.vehicle.make} {fit.vehicle.model}
                                    </td>
                                    <td className="px-4 py-2 text-[10px] font-bold text-slate-400 font-mono">
                                        {fit.vehicle.year_start} - {fit.vehicle.year_end}
                                    </td>
                                    <td className="px-2 py-2">
                                        <button
                                            onClick={() => removeMutation.mutate(fit.id)}
                                            className="opacity-0 group-hover:opacity-100 p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded transition-all"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default FitmentSection;
