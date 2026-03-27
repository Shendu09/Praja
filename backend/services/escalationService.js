import Complaint from '../models/Complaint.model.js';
import { sendRealTimeNotification } from './realtimeNotification.service.js';

/**
 * Escalation thresholds based on severity
 * Days until auto-escalation if unresolved
 */
const ESCALATION_THRESHOLDS = {
  critical: 1,      // 1 day
  urgent: 1,        // 1 day
  high: 3,          // 3 days
  medium: 7,        // 7 days
  low: 14           // 14 days
};

/**
 * Map priority to escalation threshold
 */
const getEscalationThreshold = (severity) => {
  return ESCALATION_THRESHOLDS[severity] || ESCALATION_THRESHOLDS.medium;
};

/**
 * Check and escalate unresolved complaints based on severity thresholds
 * @returns {Object} { escalated: number, errors: number }
 */
export const checkAndEscalateComplaints = async () => {
  let escalatedCount = 0;
  let errorCount = 0;
  const results = [];

  try {
    // Get all unresolved, non-escalated complaints
    const complaints = await Complaint.find({
      status: {
        $nin: ['resolved', 'Resolved', 'rejected', 'Rejected', 'closed', 'Closed', 'escalated', 'Escalated', 'final_resolution', 'Final Resolution']
      },
      isEscalated: false
    }).populate('user', 'phone');

    console.log(`[Escalation] Found ${complaints.length} unresolved complaints to check`);

    for (const complaint of complaints) {
      try {
        // Determine severity - use aiVerification if available, otherwise use priority
        const severity = complaint.aiVerification?.severity || complaint.priority || 'medium';
        const thresholdDays = getEscalationThreshold(severity);
        const thresholdMs = thresholdDays * 24 * 60 * 60 * 1000;
        
        // Check if complaint is overdue for escalation
        const createdTime = new Date(complaint.createdAt).getTime();
        const currentTime = Date.now();
        const ageMs = currentTime - createdTime;

        if (ageMs >= thresholdMs) {
          // Escalate this complaint
          const daysOld = Math.floor(ageMs / (24 * 60 * 60 * 1000));
          const escalationNote = `Auto-escalated after ${daysOld} days due to no resolution`;

          // Update complaint
          complaint.isEscalated = true;
          complaint.escalatedAt = new Date();
          complaint.escalationReason = escalationNote;
          complaint.escalationStatus = 'Pending';

          // Add to timeline
          complaint.timeline.push({
            status: 'Escalated',
            comment: escalationNote,
            updatedAt: new Date()
          });

          // Update status to Escalated if not already
          if (!['escalated', 'Escalated'].includes(complaint.status)) {
            complaint.status = 'Escalated';
          }

          await complaint.save();

          // Notify the citizen
          try {
            if (complaint.user) {
              await sendRealTimeNotification(complaint.user._id, {
                type: 'warning',
                title: '⚠️ Complaint Escalated',
                message: `Your complaint "${complaint.categoryLabel}" has been escalated to senior authorities due to delay`,
                complaintId: complaint._id
              });
            }
          } catch (notifyError) {
            console.error(`[Escalation] Failed to notify user for complaint ${complaint._id}:`, notifyError.message);
            errorCount++;
          }

          escalatedCount++;
          results.push({
            complaintId: complaint._id,
            title: complaint.categoryLabel,
            daysOld,
            severity
          });

          console.log(`✓ Escalated complaint ${complaint._id} - ${complaint.categoryLabel} (${daysOld} days old, severity: ${severity})`);
        }
      } catch (error) {
        console.error(`[Escalation] Error processing complaint ${complaint._id}:`, error.message);
        errorCount++;
      }
    }

    console.log(`[Escalation] Complete: ${escalatedCount} escalated, ${errorCount} errors`);
    
    return {
      escalated: escalatedCount,
      errors: errorCount,
      details: results
    };
  } catch (error) {
    console.error('[Escalation] Critical error in checkAndEscalateComplaints:', error);
    throw error;
  }
};

/**
 * Get escalation statistics
 */
export const getEscalationStats = async () => {
  try {
    const escalatedComplaints = await Complaint.countDocuments({ isEscalated: true });
    const pendingEscalations = await Complaint.countDocuments({
      isEscalated: true,
      escalationStatus: 'Pending'
    });
    const underReview = await Complaint.countDocuments({
      isEscalated: true,
      escalationStatus: 'Under Review'
    });
    const resolved = await Complaint.countDocuments({
      isEscalated: true,
      escalationStatus: 'Final Resolution'
    });

    return {
      total: escalatedComplaints,
      pending: pendingEscalations,
      underReview,
      resolved
    };
  } catch (error) {
    console.error('[Escalation] Error getting stats:', error);
    throw error;
  }
};
