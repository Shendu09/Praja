import { useState } from 'react';
import { ChevronDown, ChevronUp, MessageCircle, Phone, Mail, FileText, AlertCircle, CheckCircle, HelpCircle } from 'lucide-react';
import TealHeader from '../TealHeader';
import toast from 'react-hot-toast';

const faqs = [
  {
    q: 'How do I submit a complaint?',
    a: 'Tap the orange + button at the bottom, select a category, take or upload a photo, add a description with your location, and submit. Your complaint will be verified by AI and forwarded to the concerned department.',
  },
  {
    q: 'How long does it take to resolve a complaint?',
    a: 'Most complaints are acknowledged within 24 hours and resolved within 3–7 working days depending on the issue category and priority assigned by the AI.',
  },
  {
    q: 'How do I track my complaint status?',
    a: 'Go to the Complaints tab to see all your submitted complaints and their current status. You will also receive real-time notifications when an official updates your complaint.',
  },
  {
    q: 'What are Points and how do I earn them?',
    a: 'You earn 10 points for every complaint you submit and 5 points for leaving feedback. Points reflect your contribution to improving your city and appear on the leaderboard.',
  },
  {
    q: 'Can I submit a complaint anonymously?',
    a: 'Yes! When filling the complaint form, toggle the "Submit Anonymously" option. Your identity will not be shown to officials, but you can still track the complaint.',
  },
  {
    q: 'What if my complaint is rejected?',
    a: 'Officials may reject complaints if the issue is outside their jurisdiction or the photo doesn\'t match the category. You\'ll receive a notification with the reason, and you can resubmit with a clearer photo.',
  },
  {
    q: 'How do notifications work?',
    a: 'You receive a notification whenever an official updates your complaint status (e.g., Acknowledged, In Progress, Resolved). Tap the bell icon or go to the Notifications tab to view them.',
  },
  {
    q: 'How do I rate a public service?',
    a: 'Tap "Rate Service" on the Home screen. You can scan a QR code at the service location or browse nearby services and submit your rating and feedback.',
  },
];

const contactCards = [
  { icon: Phone, label: 'Helpline', value: '1800-103-1234', color: 'bg-green-50 border-green-200', iconColor: 'text-green-600', action: () => window.open('tel:18001031234') },
  { icon: Mail, label: 'Email', value: 'support@praja.gov.in', color: 'bg-blue-50 border-blue-200', iconColor: 'text-blue-600', action: () => window.open('mailto:support@praja.gov.in') },
  { icon: MessageCircle, label: 'Live Chat', value: 'Mon–Sat, 9am–6pm', color: 'bg-purple-50 border-purple-200', iconColor: 'text-purple-600', action: () => toast('Live chat opening soon!', { icon: '💬' }) },
];

const statusGuide = [
  { status: 'Pending', color: 'bg-yellow-100 text-yellow-700', desc: 'Your complaint has been submitted and is awaiting review.' },
  { status: 'Acknowledged', color: 'bg-blue-100 text-blue-700', desc: 'An official has acknowledged your complaint.' },
  { status: 'In Progress', color: 'bg-orange-100 text-orange-700', desc: 'Work has been initiated to resolve the issue.' },
  { status: 'Under Inspection', color: 'bg-purple-100 text-purple-700', desc: 'Officials are inspecting the site.' },
  { status: 'Work Scheduled', color: 'bg-indigo-100 text-indigo-700', desc: 'A resolution date has been scheduled.' },
  { status: 'Resolved', color: 'bg-green-100 text-green-700', desc: 'The issue has been fixed. You can leave feedback.' },
  { status: 'Rejected', color: 'bg-red-100 text-red-700', desc: 'The complaint could not be addressed. Check the official\'s note.' },
];

export default function HelpSupportScreen({ onBack }) {
  const [openFaq, setOpenFaq] = useState(null);
  const [activeTab, setActiveTab] = useState('faq');

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      <TealHeader title="Help & Support" onBack={onBack} />

      {/* Tabs */}
      <div className="flex bg-white border-b border-gray-100 px-4">
        {[
          { id: 'faq', label: 'FAQ', icon: HelpCircle },
          { id: 'status', label: 'Status Guide', icon: CheckCircle },
          { id: 'contact', label: 'Contact Us', icon: MessageCircle },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold border-b-2 mr-2 transition-colors ${
              activeTab === id ? 'border-teal text-teal' : 'border-transparent text-gray-500'
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24">

        {/* FAQ Tab */}
        {activeTab === 'faq' && (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-gray-400 mb-2">Tap a question to expand the answer.</p>
            {faqs.map((item, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-4 py-3.5 text-left"
                >
                  <span className="font-semibold text-gray-800 text-sm pr-4 leading-snug">{item.q}</span>
                  {openFaq === i ? (
                    <ChevronUp size={18} className="text-teal flex-shrink-0" />
                  ) : (
                    <ChevronDown size={18} className="text-gray-400 flex-shrink-0" />
                  )}
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-50 pt-3">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Status Guide Tab */}
        {activeTab === 'status' && (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-gray-400 mb-1">Understanding your complaint status:</p>
            {statusGuide.map(({ status, color, desc }) => (
              <div key={status} className="bg-white rounded-xl shadow-sm p-4 flex items-start gap-3">
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex-shrink-0 ${color}`}>{status}</span>
                <p className="text-sm text-gray-600 leading-relaxed">{desc}</p>
              </div>
            ))}
            <div className="bg-teal-50 border border-teal/20 rounded-xl p-4 mt-2">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle size={16} className="text-teal" />
                <span className="text-sm font-bold text-teal">Tip</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                You'll receive a push notification on the bell icon every time your complaint status changes. Make sure you check the Notifications tab regularly.
              </p>
            </div>
          </div>
        )}

        {/* Contact Tab */}
        {activeTab === 'contact' && (
          <div className="flex flex-col gap-4">
            <p className="text-xs text-gray-400">Choose how you'd like to reach us:</p>
            {contactCards.map(({ icon: Icon, label, value, color, iconColor, action }) => (
              <button
                key={label}
                onClick={action}
                className={`flex items-center gap-4 p-4 rounded-xl border ${color} text-left active:scale-[0.98] transition-transform`}
              >
                <div className={`w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm`}>
                  <Icon size={22} className={iconColor} />
                </div>
                <div>
                  <div className="font-bold text-gray-800 text-sm">{label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{value}</div>
                </div>
                <ChevronDown size={16} className="text-gray-400 ml-auto -rotate-90" />
              </button>
            ))}

            {/* Report Issue */}
            <div className="bg-white rounded-xl shadow-sm p-4 mt-2">
              <div className="flex items-center gap-2 mb-3">
                <FileText size={18} className="text-teal" />
                <span className="font-bold text-gray-800 text-sm">Report an App Issue</span>
              </div>
              <textarea
                placeholder="Describe the problem you're facing..."
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-teal"
              />
              <button
                onClick={() => toast.success('Issue report submitted! We\'ll get back to you within 24 hours.', { duration: 4000 })}
                className="mt-3 w-full py-2.5 bg-teal text-white rounded-lg text-sm font-semibold hover:bg-teal-600 transition-colors"
              >
                Submit Report
              </button>
            </div>

            <div className="text-center text-xs text-gray-400 mt-2">
              Support hours: Monday – Saturday, 9:00 AM – 6:00 PM IST
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
