
import React, { useEffect, useRef } from 'react';
import { X, Zap, Maximize, Scan } from 'lucide-react';

interface Props {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

const ScannerOverlay: React.FC<Props> = ({ onScan, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        console.error("Camera access denied", err);
        alert("فشل الوصول للكاميرا. يرجى منح الصلاحية من إعدادات المتصفح.");
        onClose();
      }
    };
    startCamera();
    
    // Cleanup function
    return () => {
      const stream = videoRef.current?.srcObject as MediaStream;
      stream?.getTracks().forEach(track => track.stop());
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-in fade-in duration-500">
      <div className="p-6 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent text-white relative z-10">
        <div className="flex items-center gap-2">
           <div className="p-2 bg-blue-600 rounded-xl"><Scan size={20} /></div>
           <span className="text-[10px] font-black uppercase tracking-widest">Vision Scanner Pro</span>
        </div>
        <button onClick={onClose} className="p-2 bg-white/10 rounded-full"><X size={24}/></button>
      </div>

      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover grayscale opacity-60" />
        
        <div className="relative w-64 h-48 border-2 border-blue-500/50 rounded-[2rem] shadow-[0_0_0_1000px_rgba(0,0,0,0.6)]">
            <div className="absolute inset-0 animate-pulse bg-blue-500/10"></div>
            <div className="absolute left-4 right-4 h-0.5 bg-blue-500 shadow-[0_0_15px_#3b82f6] animate-scan-line"></div>
            
            <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-blue-500 rounded-tl-xl"></div>
            <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-blue-500 rounded-tr-xl"></div>
            <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-blue-500 rounded-bl-xl"></div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-blue-500 rounded-br-xl"></div>
        </div>
        
        <p className="absolute bottom-1/4 text-white/60 text-[10px] font-bold text-center w-full px-10">ضع باركود القطعة داخل الإطار للمسح التلقائي</p>
      </div>

      <div className="p-10 flex justify-center gap-6 bg-gradient-to-t from-black/80 to-transparent relative z-10">
         <button className="p-4 bg-white/10 rounded-3xl text-white active:scale-90 transition-all"><Zap size={24}/></button>
         <button className="p-4 bg-white/10 rounded-3xl text-white active:scale-90 transition-all"><Maximize size={24}/></button>
      </div>

      <style>{`
        @keyframes scan-line {
          0% { top: 10%; }
          100% { top: 90%; }
        }
        .animate-scan-line {
          animation: scan-line 2s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default ScannerOverlay;
