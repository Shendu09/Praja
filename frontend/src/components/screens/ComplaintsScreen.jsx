import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Clock, CheckCircle, XCircle, AlertCircle, Star, MessageSquare, AlertTriangle, X, ChevronRight } from 'lucide-react';
import TealHeader from '../TealHeader';
import { useComplaintsStore, useUIStore } from '../../store';
import { complaintsAPI } from '../../services/api';
import toast from 'react-hot-toast';

const statusConfig = {
  Submitted: { color: 'bg-gray-100 text-gray-700', icon: Clock, label: 'Submitted' },
  pending: { color: 'bg-amber-100 text-amber-700', icon: Clock, label: 'Pending' },
  Assigned: { color: 'bg-blue-100 text-blue-700', icon: AlertCircle, label: 'Assigned' },
  'In Progress': { color: 'bg-amber-100 text-amber-700', icon: AlertCircle, label: 'In Progress' },
  in_progress: { color: 'bg-blue-100 text-blue-700', icon: AlertCircle, label: 'In Progress' },
  Resolved: { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Resolved' },
  resolved: { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Resolved' },
  rejected: { color: 'bg-red-100 text-red-700', icon: XCircle, label: 'Rejected' },
  Closed: { color: 'bg-gray-200 text-gray-600', icon: CheckCircle, label: 'Closed' },
  closed: { color: 'bg-gray-200 text-gray-600', icon: CheckCircle, label: 'Closed' },
  Escalated: { color: 'bg-orange-100 text-orange-700', icon: AlertTriangle, label: 'Escalated' },
  'Final Resolution': { color: 'bg-purple-100 text-purple-700', icon: CheckCircle, label: 'Final Resolution' },
};

const timelineStages = [
  { key: 'Submitted', label: 'Complaint Submitted', icon: '📋', description: 'Your complaint has been registered' },
  { key: 'Assigned', label: 'Assigned to Department', icon: '🏛️', description: 'Assigned to department' },
  { key: 'In Progress', label: 'Work In Progress', icon: '🔧', description: 'Official is working on it' },
  { key: 'Resolved', label: 'Issue Resolved', icon: '✅', description: 'Issue has been resolved' },
  { key: 'Closed', label: 'Complaint Closed', icon: '🔒', description: 'Citizen satisfied. Case closed.' },
  { key: 'Escalated', label: 'Escalated to Authority', icon: '🚨', description: 'Under review by higher authority' },
  { key: 'Final Resolution', label: 'Final Resolution', icon: '⚖️', description: 'Final authority decision' },
];

export default function ComplaintsScreen() {
  const { myComplaints, fetchMyComplaints, isLoading } = useComplaintsStore();
  const { setScreen, setShowAuthModal } = useUIStore();
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({ rating: 0, feedbackText: '', isSatisfied: null });
  const [escalateReason, setEscalateReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchMyComplaints();
  }, []);

  const handleNewComplaint = () => {
    setScreen('category');
  };

  const openComplaintDetail = (complaint) => {
    setSelectedComplaint(complaint);
  };

  const handleFeedbackSubmit = async (isSatisfied) => {
    if (feedbackForm.rating === 0) {
      toast.error('Please provide a rating');
      return;
    }

    setIsSubmitting(true);
    try {
      await complaintsAPI.addFeedback(selectedComplaint._id, {
        rating: feedbackForm.rating,
        feedbackText: feedbackForm.feedbackText,
        isSatisfied
      });

      if (isSatisfied) {
        toast.success('🎉 Thank you! Complaint closed. You earned 10 XP!');
        setShowFeedbackModal(false);
        setSelectedComplaint(null);
      } else {
        toast('You can now escalate the complaint', { icon: '⚠️' });
        setFeedbackForm(prev => ({ ...prev, isSatisfied: false }));
      }
      
      fetchMyComplaints();
    } catch (error) {
      toast.error(error.error || 'Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEscalate = async () => {
    if (escalateReason.trim().length < 10) {
      toast.error('Please provide a detailed reason (minimum 10 characters)');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await complaintsAPI.escalate(selectedComplaint._id, { reason: escalateReason });
      toast.success(`Complaint escalated. Reference: ${response.data?.escalationRef || 'ESC-XXXX'}`);
      setShowEscalateModal(false);
      setShowFeedbackModal(false);
      setSelectedComplaint(null);
      setEscalateReason('');
      fetchMyComplaints();
    } catch (error) {
      toast.error(error.error || 'Failed to escalate complaint');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStageIndex = (status) => {
    const index = timelineStages.findIndex(s => s.key === status);
    return index >= 0 ? index : 0;
  };

  const canProvideFeedback = (complaint) => {
    return (complaint.status === 'Resolved' || complaint.status === 'resolved') && 
           complaint.feedbackRating === null;
  };

  const canEscalate = (complaint) => {
    return complaint.isSatisfied === false && !complaint.isEscalated;
  };

  const StarRating = ({ rating, onRate }) => (
    <div className="flex gap-2 justify-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => onRate(star)}
          className="transition-transform hover:scale-110"
        >
          <Star
            size={36}
            className={star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
          />
        </button>
      ))}
    </div>
  );

  const Timeline = ({ complaint }) => {
    const currentStageIndex = getStageIndex(complaint.status);
    const showEscalated = complaint.isEscalated;
    
    const stages = showEscalated 
      ? timelineStages 
      : timelineStages.filter(s => !['Escalated', 'Final Resolution'].includes(s.key));

    return (
      <div className="py-4">
        {stages.map((stage, index) => {
          const isCompleted = index < currentStageIndex || 
            (stage.key === complaint.status && complaint.status === 'Closed');
          const isCurrent = stage.key === complaint.status;
          const isFuture = index > currentStageIndex && !isCompleted;

          return (
            <div key={stage.key} className="flex items-start gap-3 relative">
              {/* Connector Line */}
              {index < stages.length - 1 && (
                <div className={`absolute left-[15px] top-8 w-0.5 h-8 ${
                  isCompleted || isCurrent ? 'bg-green-500' : 'border-l-2 border-dashed border-gray-300'
                }`} />
              )}
              
              {/* Status Circle */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${
                isCompleted ? 'bg-green-500 text-white' :
                isCurrent ? 'bg-green-500 text-white ring-4 ring-green-100 animate-pulse' :
                'bg-gray-200 text-gray-500'
              }`}>
                {isCompleted ? '✓' : stage.icon}
              </div>
              
              {/* Content */}
              <div className="pb-6">
                <p className={`font-medium ${isCurrent ? 'text-green-700' : isCompleted ? 'text-gray-800' : 'text-gray-400'}`}>
                  {stage.label}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {isCurrent && complaint.assignedDepartment 
                    ? `Assigned to ${complaint.assignedDepartment}` 
                    : stage.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    );
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
              <motion.div
                key={complaint._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl p-4 mb-3 shadow-sm"
                onClick={() => openComplaintDetail(complaint)}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-bold text-gray-800 text-sm">
                      {complaint.grv_id || complaint.complaintId}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {complaint.categoryLabel}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${status.color}`}>
                      <StatusIcon size={12} />
                      {status.label}
                    </div>
                    {complaint.isEscalated && (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-700">
                        🚨 Escalated
                      </span>
                    )}
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

                {/* Action Buttons */}
                {canProvideFeedback(complaint) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedComplaint(complaint);
                      setShowFeedbackModal(true);
                    }}
                    className="w-full mt-3 py-2.5 bg-teal text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <MessageSquare size={16} />
                    Rate Resolution
                  </button>
                )}

                {canEscalate(complaint) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedComplaint(complaint);
                      setShowEscalateModal(true);
                    }}
                    className="w-full mt-3 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <AlertTriangle size={16} />
                    Escalate to Higher Authority
                  </button>
                )}
              </motion.div>
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

      {/* Complaint Detail Modal */}
      <AnimatePresence>
        {selectedComplaint && !showFeedbackModal && !showEscalateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
            onClick={() => setSelectedComplaint(null)}
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-lg">{selectedComplaint.grv_id || selectedComplaint.complaintId}</h3>
                  <p className="text-sm text-gray-500">{selectedComplaint.categoryLabel}</p>
                </div>
                <button onClick={() => setSelectedComplaint(null)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-4 space-y-4">
                {selectedComplaint.photo && (
                  <img src={selectedComplaint.photo} alt="" className="w-full h-48 object-cover rounded-xl" />
                )}
                
                <div className="flex gap-2 flex-wrap">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    statusConfig[selectedComplaint.status]?.color || 'bg-gray-100'
                  }`}>
                    {selectedComplaint.status}
                  </span>
                  {selectedComplaint.isEscalated && (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                      🚨 Escalated
                    </span>
                  )}
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">Description</p>
                  <p className="text-gray-700">{selectedComplaint.description}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">Location</p>
                  <p className="text-gray-700">{selectedComplaint.location?.address}</p>
                </div>

                {selectedComplaint.assignedDepartment && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-800">Assigned to</p>
                    <p className="text-blue-700">{selectedComplaint.assignedDepartment}</p>
                  </div>
                )}

                {/* Timeline */}
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Status Timeline</p>
                  <Timeline complaint={selectedComplaint} />
                </div>

                {/* Escalation Info */}
                {selectedComplaint.isEscalated && (
                  <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <p className="text-sm font-semibold text-orange-800 mb-1">Escalation Details</p>
                    <p className="text-sm text-orange-700"><strong>Reason:</strong> {selectedComplaint.escalationReason}</p>
                    <p className="text-sm text-orange-600 mt-1"><strong>Status:</strong> {selectedComplaint.escalationStatus}</p>
                    {selectedComplaint.escalationRemarks && (
                      <p className="text-sm text-orange-600 mt-1"><strong>Remarks:</strong> {selectedComplaint.escalationRemarks}</p>
                    )}
                  </div>
                )}

                {/* Feedback Info */}
                {selectedComplaint.feedbackRating && (
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm font-medium text-green-800">Your Feedback</p>
                    <div className="flex items-center gap-1 mt-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={16} className={i < selectedComplaint.feedbackRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />
                      ))}
                    </div>
                    {selectedComplaint.feedbackText && (
                      <p className="text-sm text-green-700 mt-1">{selectedComplaint.feedbackText}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="sticky bottom-0 bg-white p-4 border-t">
                {canProvideFeedback(selectedComplaint) && (
                  <button
                    onClick={() => setShowFeedbackModal(true)}
                    className="w-full py-3 bg-teal text-white rounded-xl font-medium flex items-center justify-center gap-2"
                  >
                    <MessageSquare size={18} />
                    Rate Resolution
                  </button>
                )}
                {canEscalate(selectedComplaint) && (
                  <button
                    onClick={() => setShowEscalateModal(true)}
                    className="w-full py-3 bg-orange-500 text-white rounded-xl font-medium flex items-center justify-center gap-2"
                  >
                    <AlertTriangle size={18} />
                    Escalate
                  </button>
                )}
                {!canProvideFeedback(selectedComplaint) && !canEscalate(selectedComplaint) && (
                  <button
                    onClick={() => setSelectedComplaint(null)}
                    className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium"
                  >
                    Close
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feedback Modal */}
      <AnimatePresence>
        {showFeedbackModal && selectedComplaint && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowFeedbackModal(false);
              setFeedbackForm({ rating: 0, feedbackText: '', isSatisfied: null });
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              {feedbackForm.isSatisfied === null ? (
                <>
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CheckCircle className="text-green-600" size={32} />
                    </div>
                    <h3 className="font-bold text-xl text-gray-800">Your complaint has been resolved</h3>
                    <p className="text-gray-500 mt-2">How satisfied are you with the resolution?</p>
                  </div>

                  <StarRating 
                    rating={feedbackForm.rating} 
                    onRate={(r) => setFeedbackForm(prev => ({ ...prev, rating: r }))} 
                  />

                  <textarea
                    value={feedbackForm.feedbackText}
                    onChange={(e) => setFeedbackForm(prev => ({ ...prev, feedbackText: e.target.value }))}
                    placeholder="Tell us more (optional)"
                    className="w-full mt-4 p-3 border border-gray-200 rounded-xl resize-none h-24 focus:outline-none focus:border-teal"
                  />

                  <p className="text-center text-gray-600 mt-4 mb-3 font-medium">
                    Are you satisfied with the resolution?
                  </p>

                  <div className="space-y-3">
                    <button
                      onClick={() => handleFeedbackSubmit(true)}
                      disabled={isSubmitting || feedbackForm.rating === 0}
                      className="w-full py-3 bg-green-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <CheckCircle size={18} />
                      Yes, Close Complaint
                    </button>
                    <button
                      onClick={() => handleFeedbackSubmit(false)}
                      disabled={isSubmitting || feedbackForm.rating === 0}
                      className="w-full py-3 bg-red-50 text-red-600 border border-red-200 rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <XCircle size={18} />
                      No, I'm not satisfied
                    </button>
                  </div>
                </>
              ) : (
                /* Show escalation option after negative feedback */
                <div className="text-center">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <AlertTriangle className="text-orange-600" size={32} />
                  </div>
                  <h3 className="font-bold text-xl text-gray-800">Feedback Submitted</h3>
                  <p className="text-gray-500 mt-2">Your feedback has been recorded. You can now escalate this complaint to higher authority.</p>
                  
                  <div className="space-y-3 mt-6">
                    <button
                      onClick={() => {
                        setShowFeedbackModal(false);
                        setShowEscalateModal(true);
                      }}
                      className="w-full py-3 bg-orange-500 text-white rounded-xl font-medium flex items-center justify-center gap-2"
                    >
                      <AlertTriangle size={18} />
                      Escalate to Higher Authority
                    </button>
                    <button
                      onClick={() => {
                        setShowFeedbackModal(false);
                        setSelectedComplaint(null);
                        setFeedbackForm({ rating: 0, feedbackText: '', isSatisfied: null });
                      }}
                      className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium"
                    >
                      Maybe Later
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Escalate Modal */}
      <AnimatePresence>
        {showEscalateModal && selectedComplaint && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowEscalateModal(false);
              setEscalateReason('');
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <AlertTriangle className="text-orange-600" size={32} />
                </div>
                <h3 className="font-bold text-xl text-gray-800">Escalate to Higher Authority</h3>
                <p className="text-gray-500 mt-2 text-sm">
                  We're sorry the issue wasn't resolved to your satisfaction. Your complaint will be escalated to the Nodal Appellate Authority.
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for escalation <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={escalateReason}
                  onChange={(e) => setEscalateReason(e.target.value)}
                  placeholder="Explain why the resolution was not satisfactory..."
                  className="w-full p-3 border border-gray-200 rounded-xl resize-none h-28 focus:outline-none focus:border-orange-400"
                />
              </div>

              <div className="p-3 bg-gray-50 rounded-lg mb-4 text-sm">
                <p className="text-gray-600">
                  <span className="font-medium">📋 Complaint ID:</span> {selectedComplaint.grv_id || selectedComplaint.complaintId}
                </p>
                <p className="text-gray-600 mt-1">
                  <span className="font-medium">🏛️ Escalating to:</span> Nodal Appellate Authority
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleEscalate}
                  disabled={isSubmitting || escalateReason.trim().length < 10}
                  className="w-full py-3 bg-orange-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <>
                      <AlertTriangle size={18} />
                      Escalate Now
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowEscalateModal(false);
                    setEscalateReason('');
                  }}
                  disabled={isSubmitting}
                  className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
