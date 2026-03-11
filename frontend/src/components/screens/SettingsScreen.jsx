import { useState } from 'react';
import { Bell, Moon, Globe, Lock, Trash2, ChevronRight, ShieldCheck, Smartphone } from 'lucide-react';
import TealHeader from '../TealHeader';
import { useAuthStore, useUIStore } from '../../store';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function SettingsScreen({ onBack }) {
  const { user, updateUser } = useAuthStore();
  const { setScreen } = useUIStore();

  const [notifComplaints, setNotifComplaints] = useState(true);
  const [notifUpdates, setNotifUpdates] = useState(true);
  const [notifCommunity, setNotifCommunity] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState('English');
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [pwdForm, setPwdForm] = useState({ current: '', newPwd: '', confirm: '' });
  const [pwdLoading, setPwdLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!pwdForm.current || !pwdForm.newPwd) {
      toast.error('Please fill all password fields');
      return;
    }
    if (pwdForm.newPwd.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (pwdForm.newPwd !== pwdForm.confirm) {
      toast.error('Passwords do not match');
      return;
    }
    setPwdLoading(true);
    try {
      await api.put('/auth/password', { currentPassword: pwdForm.current, newPassword: pwdForm.newPwd });
      toast.success('Password changed successfully!');
      setShowChangePwd(false);
      setPwdForm({ current: '', newPwd: '', confirm: '' });
    } catch (err) {
      toast.error(err?.error || 'Failed to change password');
    } finally {
      setPwdLoading(false);
    }
  };

  const Toggle = ({ value, onChange }) => (
    <button
      onClick={() => onChange(!value)}
      className={`w-12 h-6 rounded-full transition-colors flex items-center px-1 ${value ? 'bg-teal' : 'bg-gray-300'}`}
    >
      <span className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-6' : 'translate-x-0'}`} />
    </button>
  );

  const Section = ({ title, children }) => (
    <div className="mb-4">
      <div className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1 mb-2">{title}</div>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {children}
      </div>
    </div>
  );

  const Row = ({ icon: Icon, iconColor = 'text-gray-500', label, right, onClick, border = true }) => (
    <div
      onClick={onClick}
      className={`flex items-center justify-between px-4 py-3.5 ${onClick ? 'cursor-pointer hover:bg-gray-50 active:bg-gray-100' : ''} ${border ? 'border-b border-gray-100 last:border-0' : ''}`}
    >
      <div className="flex items-center gap-3">
        <Icon size={19} className={iconColor} />
        <span className="text-sm font-semibold text-gray-700">{label}</span>
      </div>
      {right}
    </div>
  );

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      <TealHeader title="Settings" onBack={onBack} />

      <div className="flex-1 overflow-y-auto p-4 pb-24">

        {/* Notifications */}
        <Section title="Notifications">
          <Row
            icon={Bell}
            iconColor="text-teal"
            label="Complaint Updates"
            right={<Toggle value={notifComplaints} onChange={setNotifComplaints} />}
          />
          <Row
            icon={Bell}
            iconColor="text-blue-500"
            label="Status Updates"
            right={<Toggle value={notifUpdates} onChange={setNotifUpdates} />}
          />
          <Row
            icon={Bell}
            iconColor="text-purple-500"
            label="Community Activity"
            right={<Toggle value={notifCommunity} onChange={setNotifCommunity} />}
          />
        </Section>

        {/* Appearance */}
        <Section title="Appearance">
          <Row
            icon={Moon}
            iconColor="text-indigo-500"
            label="Dark Mode"
            right={
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Coming soon</span>
                <Toggle value={darkMode} onChange={() => toast('Dark mode coming soon!', { icon: '🌙' })} />
              </div>
            }
          />
          <Row
            icon={Globe}
            iconColor="text-green-500"
            label="Language"
            right={
              <div className="flex items-center gap-1 text-gray-400">
                <span className="text-sm text-gray-500">{language}</span>
                <ChevronRight size={16} />
              </div>
            }
            onClick={() => toast('More languages coming soon!', { icon: '🌐' })}
          />
        </Section>

        {/* Security */}
        <Section title="Security">
          <Row
            icon={Lock}
            iconColor="text-orange-500"
            label="Change Password"
            right={<ChevronRight size={16} className="text-gray-400" />}
            onClick={() => setShowChangePwd(v => !v)}
          />
          <Row
            icon={ShieldCheck}
            iconColor="text-green-500"
            label="Two-Factor Authentication"
            right={<span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Coming soon</span>}
          />
          <Row
            icon={Smartphone}
            iconColor="text-blue-500"
            label="Active Sessions"
            right={<ChevronRight size={16} className="text-gray-400" />}
            onClick={() => toast('1 active session on this device', { icon: '📱' })}
          />
        </Section>

        {/* Change Password Form */}
        {showChangePwd && (
          <div className="bg-white rounded-xl shadow-sm p-4 mb-4 border border-teal/30">
            <p className="text-sm font-bold text-gray-700 mb-3">Change Password</p>
            {[
              { key: 'current', placeholder: 'Current password' },
              { key: 'newPwd', placeholder: 'New password (min 6 chars)' },
              { key: 'confirm', placeholder: 'Confirm new password' },
            ].map(({ key, placeholder }) => (
              <input
                key={key}
                type="password"
                placeholder={placeholder}
                value={pwdForm[key]}
                onChange={e => setPwdForm(p => ({ ...p, [key]: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:border-teal"
              />
            ))}
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => setShowChangePwd(false)}
                className="flex-1 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                disabled={pwdLoading}
                className="flex-1 py-2 rounded-lg bg-teal text-white text-sm font-semibold disabled:opacity-60"
              >
                {pwdLoading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        )}

        {/* Danger Zone */}
        <Section title="Account">
          <Row
            icon={Trash2}
            iconColor="text-red-400"
            label="Delete Account"
            right={<ChevronRight size={16} className="text-gray-400" />}
            onClick={() => toast.error('Please contact support to delete your account.')}
          />
        </Section>

        {/* App Version */}
        <div className="text-center text-xs text-gray-400 mt-4">
          PRAJA App v1.0.0 · Build 2026.03
        </div>
      </div>
    </div>
  );
}
