import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Car, Plus, X, Search, Loader2 } from 'lucide-react';
import { inventoryApi } from '../../api';
import { Vehicle } from '../../types';
import { useTranslation } from '../../../../lib/hooks/useTranslation';

interface Props {
    productId?: string;
}

const ProductFitment: React.FC<Props> = ({ productId }) => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<Vehicle[]>([]);

    // Fetch existing fitment
    const { data: fitments, isLoading } = useQuery({
        queryKey: ['product_fitment', productId],
        queryFn: () => productId ? inventoryApi.getFitment(productId) : Promise.resolve([]),
        enabled: !!productId
    });

    // Search vehicles
    const handleSearch = async (term: string) => {
        setSearchTerm(term);
        if (term.length < 2) {
            setSearchResults([]);
            return;
        }
        setIsSearching(true);
        try {
            const { data } = await inventoryApi.searchVehicles(term);
            setSearchResults(data || []);
        } finally {
            setIsSearching(false);
        }
    };

    // Add fitment
    const addMutation = useMutation({
        mutationFn: (vehicleId: string) => inventoryApi.addFitment({
            product_id: productId,
            vehicle_id: vehicleId
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['product_fitment', productId] });
            setSearchTerm('');
            setSearchResults([]);
        }
    });

    // Remove fitment
    const removeMutation = useMutation({
        mutationFn: (id: string) => inventoryApi.removeFitment(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['product_fitment', productId] });
        }
    });

    if (!productId) {
        return (
            <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-xl text-center border border-dashed border-gray-300 dark:border-slate-700">
                <Car className="mx-auto text-gray-400 mb-2" />
                <p className="text-xs text-gray-500 font-bold">يرجى حفظ المنتج أولاً لإضافة السيارات المتوافقة</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 px-1">
                <Car size={14} className="text-indigo-500" /> السيارات المتوافقة (Fitment)
            </h4>

            {/* Search & Add */}
            <div className="relative">
                <div className="relative">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)}
                        placeholder="ابحث عن سيارة (مثال: Toyota Camry)..."
                        className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    {isSearching && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-500 animate-spin" />}
                </div>

                {/* Search Results Dropdown */}
                {searchResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                        {searchResults.map(vehicle => (
                            <button
                                key={vehicle.id}
                                onClick={() => addMutation.mutate(vehicle.id)}
                                disabled={addMutation.isPending}
                                className="w-full text-right p-2 hover:bg-indigo-50 dark:hover:bg-slate-700 text-xs flex justify-between items-center border-b dark:border-slate-700 last:border-0"
                            >
                                <span className="font-bold text-gray-700 dark:text-gray-200">
                                    {vehicle.make} {vehicle.model} ({vehicle.year_start}-{vehicle.year_end})
                                </span>
                                <Plus size={14} className="text-indigo-500" />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* List of Linked Vehicles */}
            <div className="border border-gray-100 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 overflow-hidden">
                {isLoading ? (
                    <div className="p-4 text-center"><Loader2 className="animate-spin mx-auto text-indigo-500" /></div>
                ) : fitments?.data?.length === 0 ? (
                    <div className="p-4 text-center text-gray-400 text-xs">لا توجد سيارات مضافة</div>
                ) : (
                    <div className="divide-y dark:divide-slate-800">
                        {fitments?.data?.map((fit: any) => (
                            <div key={fit.id} className="p-2 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-slate-800/50">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                        <Car size={12} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-gray-800 dark:text-gray-100">
                                            {fit.vehicle.make} {fit.vehicle.model}
                                        </p>
                                        <p className="text-[10px] text-gray-500">
                                            {fit.vehicle.year_start} - {fit.vehicle.year_end} {fit.vehicle.submodel && `• ${fit.vehicle.submodel}`}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => removeMutation.mutate(fit.id)}
                                    disabled={removeMutation.isPending}
                                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductFitment;
