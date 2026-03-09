// Government Officials Notification Service
// Handles alerting appropriate government departments about complaints

// Department contact configurations (In production, these would come from database)
const departmentContacts = {
  sanitation: {
    name: 'Sanitation Department',
    email: 'sanitation@municipality.gov.in',
    phone: '+91-1800-XXX-XXXX',
    officers: [
      { name: 'Sanitation Officer', email: 'sanitation.officer@municipality.gov.in', role: 'head' },
      { name: 'Area Supervisor', email: 'area.supervisor@municipality.gov.in', role: 'supervisor' }
    ]
  },
  health: {
    name: 'Health Department',
    email: 'health@municipality.gov.in',
    phone: '+91-1800-XXX-XXXY',
    officers: [
      { name: 'Health Officer', email: 'health.officer@municipality.gov.in', role: 'head' },
      { name: 'Sanitary Inspector', email: 'sanitary.inspector@municipality.gov.in', role: 'inspector' }
    ]
  },
  municipal: {
    name: 'Municipal Corporation',
    email: 'municipal@municipality.gov.in',
    phone: '+91-1800-XXX-XXXZ',
    officers: [
      { name: 'Municipal Commissioner', email: 'commissioner@municipality.gov.in', role: 'head' },
      { name: 'Ward Officer', email: 'ward.officer@municipality.gov.in', role: 'ward' }
    ]
  },
  environment: {
    name: 'Environment Department',
    email: 'environment@municipality.gov.in',
    phone: '+91-1800-XXX-XXXA',
    officers: [
      { name: 'Environment Officer', email: 'env.officer@municipality.gov.in', role: 'head' },
      { name: 'Pollution Control Officer', email: 'pollution.control@municipality.gov.in', role: 'specialist' }
    ]
  }
};

// Priority escalation timelines (in hours)
const escalationTimelines = {
  urgent: { initial: 1, escalate: 4, final: 12 },
  high: { initial: 4, escalate: 12, final: 24 },
  medium: { initial: 12, escalate: 24, final: 48 },
  low: { initial: 24, escalate: 48, final: 72 }
};

/**
 * Get department contacts
 */
export const getDepartmentContacts = (department) => {
  return departmentContacts[department] || departmentContacts.sanitation;
};

/**
 * Notify government officials about a new complaint
 */
export const notifyOfficials = async (complaint, aiAnalysis) => {
  const department = getDepartmentContacts(aiAnalysis.department);
  const escalation = escalationTimelines[aiAnalysis.priority];

  // Create notification record
  const notification = {
    complaintId: complaint._id,
    complaintNumber: complaint.complaintId,
    category: complaint.category,
    categoryLabel: complaint.categoryLabel,
    location: complaint.location,
    description: complaint.description,
    photo: complaint.photo,
    priority: aiAnalysis.priority,
    severity: aiAnalysis.severity,
    department: department.name,
    aiAnalysis: {
      confidence: aiAnalysis.confidence,
      detectedIssues: aiAnalysis.detectedIssues,
      notes: aiAnalysis.aiNotes,
      requiresUrgentAction: aiAnalysis.requiresUrgentAction
    },
    notifiedOfficers: department.officers.map(o => ({
      name: o.name,
      email: o.email,
      role: o.role,
      notifiedAt: new Date()
    })),
    escalation: {
      initialResponseDeadline: new Date(Date.now() + escalation.initial * 60 * 60 * 1000),
      escalationDeadline: new Date(Date.now() + escalation.escalate * 60 * 60 * 1000),
      finalDeadline: new Date(Date.now() + escalation.final * 60 * 60 * 1000)
    },
    status: 'notified',
    createdAt: new Date()
  };

  // In production: Send actual emails/SMS
  // For now, log and return the notification
  console.log('\n📧 GOVERNMENT NOTIFICATION SENT');
  console.log('================================');
  console.log(`Complaint: ${notification.complaintNumber}`);
  console.log(`Category: ${notification.categoryLabel}`);
  console.log(`Priority: ${notification.priority.toUpperCase()}`);
  console.log(`Department: ${notification.department}`);
  console.log(`Location: ${notification.location.address}`);
  console.log('--------------------------------');
  console.log('AI Analysis:');
  console.log(`  Confidence: ${(notification.aiAnalysis.confidence * 100).toFixed(0)}%`);
  console.log(`  Issues: ${notification.aiAnalysis.detectedIssues.join(', ')}`);
  console.log(`  Notes: ${notification.aiAnalysis.notes}`);
  console.log('--------------------------------');
  console.log('Notified Officers:');
  notification.notifiedOfficers.forEach(officer => {
    console.log(`  - ${officer.name} (${officer.role}): ${officer.email}`);
  });
  console.log('--------------------------------');
  console.log('Escalation Timeline:');
  console.log(`  Initial Response: ${notification.escalation.initialResponseDeadline.toLocaleString()}`);
  console.log(`  Escalation: ${notification.escalation.escalationDeadline.toLocaleString()}`);
  console.log(`  Final Deadline: ${notification.escalation.finalDeadline.toLocaleString()}`);
  console.log('================================\n');

  return notification;
};

/**
 * Generate email content for officials
 */
export const generateEmailContent = (complaint, aiAnalysis, department) => {
  const priorityColors = {
    urgent: '#dc2626',
    high: '#ea580c',
    medium: '#ca8a04',
    low: '#16a34a'
  };

  return {
    subject: `[${aiAnalysis.priority.toUpperCase()}] New Complaint: ${complaint.complaintId} - ${complaint.categoryLabel}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #2a9d8f; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">🇮🇳 PRAJA Alert</h1>
          <p style="margin: 5px 0 0;">प्रजा - Citizen Grievance Portal</p>
        </div>
        
        <div style="padding: 20px; background: #f5f5f5;">
          <div style="background: ${priorityColors[aiAnalysis.priority]}; color: white; padding: 10px; border-radius: 5px; text-align: center; margin-bottom: 15px;">
            <strong>Priority: ${aiAnalysis.priority.toUpperCase()}</strong>
            ${aiAnalysis.requiresUrgentAction ? ' - URGENT ACTION REQUIRED' : ''}
          </div>
          
          <div style="background: white; padding: 15px; border-radius: 5px; margin-bottom: 15px;">
            <h3 style="color: #2a9d8f; margin-top: 0;">Complaint Details</h3>
            <p><strong>ID:</strong> ${complaint.complaintId}</p>
            <p><strong>Category:</strong> ${complaint.categoryLabel}</p>
            <p><strong>Description:</strong> ${complaint.description}</p>
            <p><strong>Location:</strong> ${complaint.location.address}</p>
            <p><strong>City:</strong> ${complaint.location.city || 'N/A'}</p>
          </div>
          
          <div style="background: white; padding: 15px; border-radius: 5px; margin-bottom: 15px;">
            <h3 style="color: #2a9d8f; margin-top: 0;">AI Verification Report</h3>
            <p><strong>Confidence Score:</strong> ${(aiAnalysis.confidence * 100).toFixed(0)}%</p>
            <p><strong>Severity:</strong> ${aiAnalysis.severity}</p>
            <p><strong>Detected Issues:</strong></p>
            <ul>
              ${aiAnalysis.detectedIssues.map(issue => `<li>${issue}</li>`).join('')}
            </ul>
            <p><strong>AI Notes:</strong> ${aiAnalysis.aiNotes}</p>
          </div>
          
          <div style="background: white; padding: 15px; border-radius: 5px;">
            <h3 style="color: #2a9d8f; margin-top: 0;">Action Required</h3>
            <p>Please take necessary action within the stipulated time frame.</p>
            <p><strong>Assigned Department:</strong> ${department.name}</p>
          </div>
        </div>
        
        <div style="background: #2a9d8f; color: white; padding: 15px; text-align: center;">
          <p style="margin: 0;">PRAJA - Making Citizens Heard</p>
        </div>
      </div>
    `,
    text: `
PRAJA ALERT - ${aiAnalysis.priority.toUpperCase()} PRIORITY

Complaint ID: ${complaint.complaintId}
Category: ${complaint.categoryLabel}
Description: ${complaint.description}
Location: ${complaint.location.address}

AI VERIFICATION:
- Confidence: ${(aiAnalysis.confidence * 100).toFixed(0)}%
- Severity: ${aiAnalysis.severity}
- Issues: ${aiAnalysis.detectedIssues.join(', ')}

Please take immediate action.

- PRAJA Portal
    `
  };
};

/**
 * Send SMS notification (placeholder)
 */
export const sendSMSNotification = async (phone, message) => {
  // In production: Integrate with SMS gateway (Twilio, MSG91, etc.)
  console.log(`📱 SMS sent to ${phone}: ${message.substring(0, 50)}...`);
  return { success: true, phone, sentAt: new Date() };
};

export default {
  notifyOfficials,
  getDepartmentContacts,
  generateEmailContent,
  sendSMSNotification
};
