import React from 'react';
import { Sparkles } from 'lucide-react';
import Button from '../../../ui/base/Button';
import Modal from '../../../ui/base/Modal';
import { useInventoryDedupe } from '../hooks/useInventoryDedupe';
import ScanningState from './dedupe/ScanningState';
import EmptyDuplicatesState from './dedupe/EmptyDuplicatesState';
import DuplicateList from './dedupe/DuplicateList';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onEdit: (id: string) => void;
}

const DeduplicationTool: React.FC<Props> = ({ isOpen, onClose, onEdit }) => {
    const { duplicates, isScanning, error } = useInventoryDedupe(isOpen);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="فحص جودة الأسماء والمكررات"
            icon={Sparkles}
            description="نقوم بمقارنة جميع الأصناف في مخزنك لاكتشاف الأسماء المتشابهة التي قد تكون مكررة بنفس المنتج."
            footer={
                <div className="p-1 w-full flex justify-end">
                    <Button variant="outline" className="w-full" onClick={onClose}>إغلاق</Button>
                </div>
            }
        >
            <div className="flex flex-col min-h-[400px]">
                {error && (
                    <div className="p-4 m-4 bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-600 text-xs font-bold text-center">
                        {error}
                    </div>
                )}
                
                {isScanning ? (
                    <ScanningState />
                ) : duplicates.length === 0 ? (
                    <EmptyDuplicatesState />
                ) : (
                    <DuplicateList duplicates={duplicates} onEdit={onEdit} />
                )}
            </div>
        </Modal>
    );
};

export default DeduplicationTool;
