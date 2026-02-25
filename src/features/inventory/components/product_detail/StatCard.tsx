import React from 'react';
import { cn } from '../../../../core/utils';

interface Props {
    icon: any;
    label: string;
    value: string | number;
    color: string;
}

const StatCard: React.FC<Props> = ({ icon: Icon, label, value, color }) => (
    <div className={cn("bg-opacity-10 p-4 rounded-2xl border flex items-start gap-3", color.replace('text-', 'bg-').replace('600', '50'), color.replace('text-', 'border-'))}>
        <div className={cn("p-2 rounded-xl bg-opacity-20", color.replace('text-', 'bg-'))}>
            <Icon size={16} className={color} />
        </div>
        <div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{label}</p>
            <h3 dir="ltr" className={cn("text-lg font-black font-mono leading-none tracking-tight", color)}>{value}</h3>
        </div>
    </div>
);

export default StatCard;
