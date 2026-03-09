import { useEffect } from 'react';
import { Package, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import TealHeader from '../TealHeader';
import { useComplaintsStore, useUIStore } from '../../store';

const statusConfig = {
  pending: { color: 'bg-amber-100 text-amber-700', icon: Clock, label: 'Pending' },
  in_progress: { color: 'bg-blue-100 text-blue-700', icon: AlertCircle, label: 'In Progress' },
  resolved: { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Resolved' },
  rejected: { color: 'bg-red-100 text-red-700', icon: XCircle, label: 'Rejected' },
  closed: { color: 'bg-gray-100 text-gray-700', icon: CheckCircle, label: 'Closed' },
};

export default function ComplaintsScreen() {
  const { myComplaints, fetchMyComplaints, isLoading } = useComplaintsStore();
  const { setScreen, setShowAuthModal } = useUIStore();

  useEffect(() => {
    fetchMyComplaints();
  }, []);

  const handleNewComplaint = () => {
    setScreen('category');
  };

  return (
    <div className="flex-1 flex flex-col">
      <TealHeader title="Posted Complaints" />

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-teal border-t-transparent rounded-full" />
        </div>
      ) : myComplaints.length > 0 ? (
        <div className="flex-1 overflow-y-auto pb-20 p-3.5">
          {myComplaints.map((complaint) => {
            const status = statusConfig[complaint.status] || statusConfig.pending;
            const StatusIcon = status.icon;
            
            return (
              <div
                key={complaint._id}
                className="bg-white rounded-xl p-4 mb-3 shadow-sm"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-bold text-gray-800 text-sm">
                      {complaint.complaintId}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {complaint.categoryLabel}
                    </div>
                  </div>
                  <div className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${status.color}`}>
                    <StatusIcon size={12} />
                    {status.label}
                  </div>
                </div>

                {/* Photo and Description */}
                <div className="flex gap-3 mb-3">
                  {complaint.photo && (
                    <img
                      src={complaint.photo}
                      alt="Complaint"
                      className="w-16 h-16 rounded-lg object-cover shrink-0"
                    />
                  )}
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {complaint.description}
                  </p>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-100">
                  <span>📍 {complaint.location?.city || 'Location'}</span>
                  <span>
                    {new Date(complaint.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-3.5 pb-20">
          <div className="text-8xl">📦</div>
          <div className="font-semibold text-[15px] text-gray-400">
            No Records Found - Yet.
          </div>
          <div className="text-sm text-gray-300 text-center px-10">
            Post your first complaint to help keep your city clean.
          </div>
          <button
            onClick={handleNewComplaint}
            className="mt-4 px-6 py-2.5 bg-teal text-white rounded-full font-semibold text-sm hover:bg-teal-600 transition-colors"
          >
            Post a Complaint
          </button>
        </div>
      )}
    </div>
  );
}
