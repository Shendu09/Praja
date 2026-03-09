import { ChevronLeft } from 'lucide-react';

export default function TealHeader({ title, onBack }) {
  return (
    <div className="bg-teal text-white px-4 py-3.5 flex items-center gap-3 shrink-0">
      {onBack && (
        <button
          onClick={onBack}
          className="p-0 bg-transparent border-none text-white text-xl cursor-pointer hover:opacity-80 transition-opacity"
        >
          <ChevronLeft size={24} />
        </button>
      )}
      <span className="font-bold text-lg font-nunito">{title}</span>
    </div>
  );
}
