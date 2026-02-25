import React, { useState } from 'react';
import { Car, Plus, X, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi } from '../../api';
import { useTranslation } from '../../../../lib/hooks/useTranslation';

interface Props {
    productId: string;
}

const FitmentSection: React.FC<Props> = ({ productId }) => {
    const { t } = useTranslation();
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
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border dark:border-slate-800 flex flex-col h-full">
            <div className="flex justify-between items-center mb-3">
                <h4 className="text-[10px] font-black text-gray-400 uppercase flex items-center gap-1.5"><Car size={12} /> {t('fitment')}</h4>
                <button onClick={() => setIsAdding(!isAdding)} className="text-xs text-indigo-600 font-bold hover:bg-indigo-50 p-1 rounded">
                    {isAdding ? <X size={14} /> : <div className="flex items-center gap-1"><Plus size={14} /> {t('add')}</div>}
                </button>
            </div>

            {isAdding && (
                <div className="mb-3 relative">
                    <input
                        autoFocus
                        placeholder={t('search_vehicles')}
                        className="w-full text-xs p-2 rounded-lg border dark:border-slate-700 dark:bg-slate-800"
                        value={searchTerm}
                        onChange={e => handleSearch(e.target.value)}
                    />
                    {foundVehicles.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg shadow-xl max-h-40 overflow-y-auto">
                            {foundVehicles.map(v => (
                                <button
                                    key={v.id}
                                    onClick={() => addMutation.mutate({ product_id: productId, vehicle_id: v.id })}
                                    className="w-full text-right p-2 text-xs hover:bg-gray-100 dark:hover:bg-slate-700 border-b dark:border-slate-700 last:border-0"
                                >
                                    <span className="font-bold">{v.make} {v.model}</span> <span className="text-gray-400">{v.year_start}-{v.year_end}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <div className="space-y-2 flex-1 overflow-y-auto max-h-40 custom-scrollbar pr-1">
                {isLoading ? (
                    <div className="text-center p-2 text-xs text-gray-400">{t('loading')}</div>
                ) : fitments?.data?.length === 0 ? (
                    <div className="text-center py-6 text-xs text-gray-400 flex flex-col items-center gap-2">
                        <Car size={24} className="opacity-20" />
                        {t('no_fitment')}
                    </div>
                ) : (
                    fitments?.data?.map((fit: any) => (
                        <div key={fit.id} className="group flex justify-between items-center bg-gray-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-transparent hover:border-indigo-100 dark:hover:border-slate-700 transition-all">
                            <div>
                                <div className="text-xs font-bold text-gray-800 dark:text-slate-200">
                                    {fit.vehicle.make} {fit.vehicle.model}
                                </div>
                                <div className="text-[10px] font-bold text-gray-400 font-mono mt-0.5">
                                    {fit.vehicle.year_start} - {fit.vehicle.year_end}
                                </div>
                            </div>
                            <button
                                onClick={() => removeMutation.mutate(fit.id)}
                                className="opacity-0 group-hover:opacity-100 p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all"
                            >
                                <Trash2 size={12} />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default FitmentSection;
