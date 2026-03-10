import { useEffect, useCallback } from 'react';
import { Package, Clock, CheckCircle, XCircle, AlertCircle, Search, Calendar } from 'lucide-react';
import TealHeader from '../TealHeader';
import { useComplaintsStore, useUIStore, useAuthStore } from '../../store';

const statusConfig = {
  pending: { color: 'bg-amber-100 text-amber-700', icon: Clock, label: 'Pending' },
  acknowledged: { color: 'bg-sky-100 text-sky-700', icon: CheckCircle, label: 'Acknowledged' },
  in_progress: { color: 'bg-blue-100 text-blue-700', icon: AlertCircle, label: 'In Progress' },
  under_inspection: { color: 'bg-purple-100 text-purple-700', icon: Search, label: 'Under Inspection' },
  work_scheduled: { color: 'bg-indigo-100 text-indigo-700', icon: Calendar, label: 'Work Scheduled' },
  resolved: { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Resolved' },
  rejected: { color: 'bg-red-100 text-red-700', icon: XCircle, label: 'Rejected' },
  closed: { color: 'bg-gray-100 text-gray-700', icon: CheckCircle, label: 'Closed' },
};

const timelineStatusLabel = {
  pending: 'Complaint Filed',
  acknowledged: 'Acknowledged by Official',
  in_progress: 'Work In Progress',
  under_inspection: 'Under Inspection',
  work_scheduled: 'Work Scheduled',
  resolved: 'Resolved',
  rejected: 'Rejected',
  closed: 'Closed',
};

// Steps for the visual progress stepper (normal flow)
const STEPPER_STEPS = [
  { key: 'pending',          label: 'Filed',        icon: '📝' },
  { key: 'acknowledged',     label: 'Received',     icon: '📬' },
  { key: 'under_inspection', label: 'Inspection',   icon: '🔍' },
  { key: 'in_progress',      label: 'In Progress',  icon: '🔧' },
  { key: 'resolved',         label: 'Resolved',     icon: '✅' },
];

// Index of each status in the stepper (-1 = outside normal flow)
const stepperIndex = (status) => {
  if (status === 'work_scheduled') return 2; // same level as inspection
  if (status === 'rejected' || status === 'closed') return -1;
  return STEPPER_STEPS.findIndex(s => s.key === status);
};

function StatusStepper({ status }) {
  const currentIdx = stepperIndex(status);
  if (status === 'rejected') {
    return (
      <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">
        <span className="text-lg">❌</span>
        <div>
          <p className="text-xs font-bold text-red-700">Complaint Rejected</p>
          <p className="text-xs text-red-500">The official has rejected this complaint</p>
        </div>
      </div>
    );
  }
  if (status === 'closed') {
    return (
      <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 mb-3">
        <span className="text-lg">🔒</span>
        <div>
          <p className="text-xs font-bold text-gray-700">Complaint Closed</p>
          <p className="text-xs text-gray-500">This complaint has been closed</p>
        </div>
      </div>
    );
  }
  return (
    <div className="mb-3">
      <div className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">⚡ Live Status</div>
      <div className="flex items-center">
        {STEPPER_STEPS.map((step, idx) => {
          const done = idx < currentIdx;
          const active = idx === currentIdx;
          const future = idx > currentIdx;
          return (
            <div key={step.key} className="flex items-center flex-1 min-w-0">
              {/* Node */}
              <div className="flex flex-col items-center shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 transition-all ${
                  done ? 'bg-teal border-teal text-white' :
                  active ? 'bg-white border-teal text-teal shadow-md shadow-teal/30 scale-110' :
                  'bg-gray-100 border-gray-200 text-gray-400'
                }`}>
                  {done ? '✓' : step.icon}
                </div>
                <span className={`text-[9px] mt-1 font-medium text-center leading-tight max-w-[44px] truncate ${
                  done ? 'text-teal' : active ? 'text-teal font-bold' : 'text-gray-400'
                }`}>{step.label}</span>
              </div>
              {/* Connector line (not after last) */}
              {idx < STEPPER_STEPS.length - 1 && (
                <div className={`h-0.5 flex-1 mx-1 transition-all ${done ? 'bg-teal' : 'bg-gray-200'}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ComplaintsScreen() {
  const { myComplaints, fetchMyComplaints, isLoading } = useComplaintsStore();
  const { setScreen } = useUIStore();
  const { user } = useAuthStore();

  // Only poll if the logged-in user is a citizen (prevents official's token
  // from hitting /complaints/my and returning an empty list that overwrites
  // the citizen's persisted complaints)
  const isCitizen = !user?.role || user?.role === 'citizen';

  const refreshComplaints = useCallback(() => {
    if (isCitizen) fetchMyComplaints();
  }, [fetchMyComplaints, isCitizen]);

  useEffect(() => {
    refreshComplaints();

    const interval = setInterval(refreshComplaints, 10000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        refreshComplaints();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [refreshComplaints]);

  const handleNewComplaint = () => {
    setScreen('category');
  };

  return (
    <div className="flex-1 flex flex-col">
      <TealHeader title="Posted Complaints" />

      {isLoading && myComplaints.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-teal border-t-transparent rounded-full" />
        </div>
      ) : myComplaints.length > 0 ? (
        <div className="flex-1 overflow-y-auto pb-20 p-3.5">
          {myComplaints.map((complaint) => {
            const status = statusConfig[complaint.status] || statusConfig.pending;
            const StatusIcon = status.icon;
            // Latest official update = last timeline entry that isn't the initial 'pending' filing
            const timeline = complaint.timeline || [];
            const officialUpdates = timeline.filter(e => e.status !== 'pending' || timeline.indexOf(e) > 0);
            const latestUpdate = officialUpdates.length > 0 ? officialUpdates[officialUpdates.length - 1] : null;
            
            return (
              <div
                key={complaint._id}
                className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100"
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

                {/* Visual Status Stepper */}
                <StatusStepper status={complaint.status} />

                {/* Latest Official Update Banner */}
                {latestUpdate && (
                  <div className="mb-3 px-3 py-2 bg-teal/10 border border-teal/20 rounded-lg">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-xs font-bold text-teal-700">🏛️ Official Update</span>
                      <span className="text-xs text-gray-400">
                        · {new Date(latestUpdate.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-xs text-gray-700 font-medium">
                      {timelineStatusLabel[latestUpdate.status] || latestUpdate.status}
                    </p>
                    {latestUpdate.comment && (
                      <p className="text-xs text-gray-500 mt-0.5">{latestUpdate.comment}</p>
                    )}
                  </div>
                )}

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

                {/* Full Timeline */}
                {timeline.length > 1 && (
                  <div className="mb-3">
                    <div className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
                      <span>📋</span> Status History
                    </div>
                    <div className="space-y-2">
                      {timeline.map((entry, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${idx === timeline.length - 1 ? 'bg-teal' : 'bg-gray-300'}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className={`text-xs font-semibold truncate ${idx === timeline.length - 1 ? 'text-teal-700' : 'text-gray-600'}`}>
                                {timelineStatusLabel[entry.status] || entry.status}
                              </span>
                              <span className="text-xs text-gray-400 shrink-0">
                                {new Date(entry.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                              </span>
                            </div>
                            {entry.comment && (
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{entry.comment}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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
