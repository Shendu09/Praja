import TealHeader from '../TealHeader';
import { useUIStore, useComplaintsStore } from '../../store';

const categories = [
  { id: 'dirty_spot', icon: '🗑️', label: 'Cleanliness Target Unit (Dirty Spot)' },
  { id: 'garbage_dump', icon: '🏔️', label: 'Garbage Dump' },
  { id: 'garbage_vehicle', icon: '🚛', label: 'Garbage Vehicle Not Arrived' },
  { id: 'burning_garbage', icon: '🔥', label: 'Burning of Garbage in Open Space' },
  { id: 'sweeping_not_done', icon: '🧹', label: 'Sweeping Not Done' },
  { id: 'dustbins_not_cleaned', icon: '🗑️', label: 'Dustbins Not Cleaned' },
  { id: 'open_defecation', icon: '🚽', label: 'Open Defecation' },
  { id: 'sewerage_overflow', icon: '💧', label: 'Overflow of Sewerage or Storm Water' },
  { id: 'stagnant_water', icon: '🌊', label: 'Stagnant Water on Road / Open Area' },
  { id: 'slum_not_clean', icon: '🏚️', label: 'Slum Area Not Clean' },
  { id: 'overgrown_vegetation', icon: '🌿', label: 'Overgrown Vegetation on Road' },
  { id: 'stray_animals', icon: '🐄', label: 'Stray Animals' },
];

export default function CategoryScreen() {
  const { setScreen, setSelectedCategory, setActiveTab } = useUIStore();

  const handleBack = () => {
    setScreen('home');
    setActiveTab('home');
  };

  const handleSelect = (category) => {
    setSelectedCategory(category);
    setScreen('form');
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TealHeader title="Choose Category" onBack={handleBack} />
      
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="py-2">
          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => handleSelect(cat)}
              className="flex items-center gap-4 px-5 py-4 border-b border-gray-100 bg-white cursor-pointer hover:bg-teal-50 transition-colors"
            >
              <div className="w-[52px] h-[52px] rounded-full bg-gray-100 flex items-center justify-center text-2xl shrink-0 border border-gray-200">
                {cat.icon}
              </div>
              <span className="font-semibold text-[15px] text-gray-800">
                {cat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
