import { motion } from 'framer-motion';
import { User, Shield, Building2, ChevronRight } from 'lucide-react';

const roles = [
  {
    id: 'citizen',
    title: 'Citizen',
    subtitle: 'Report & Track Issues',
    description: 'Submit complaints, track status, and provide feedback',
    icon: User,
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  {
    id: 'official',
    title: 'Government Official',
    subtitle: 'Resolve Complaints',
    description: 'View assigned complaints and update resolution status',
    icon: Building2,
    color: 'from-green-500 to-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
  {
    id: 'admin',
    title: 'Administrator',
    subtitle: 'Manage Platform',
    description: 'Assign complaints, manage departments, view analytics',
    icon: Shield,
    color: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
  },
];

export default function RoleSelectionScreen({ onSelectRole }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header with Indian colors */}
      <div className="h-2 flex">
        <div className="flex-1 bg-[#FF9933]" />
        <div className="flex-1 bg-white" />
        <div className="flex-1 bg-[#138808]" />
      </div>

      <div className="max-w-md mx-auto px-6 py-10">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-xl">
            <span className="text-3xl">🏛️</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">
            Citizen Grievance Portal
          </h1>
          <p className="text-gray-500 mt-1">Select your role to continue</p>
        </motion.div>

        {/* Role Cards */}
        <div className="space-y-4">
          {roles.map((role, index) => (
            <motion.button
              key={role.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => onSelectRole(role.id)}
              className={`w-full p-5 rounded-2xl border-2 ${role.borderColor} ${role.bgColor} text-left transition-all hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${role.color} flex items-center justify-center shadow-md`}>
                  <role.icon size={28} className="text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800 text-lg">{role.title}</h3>
                  <p className="text-sm text-gray-600">{role.subtitle}</p>
                </div>
                <ChevronRight size={24} className="text-gray-400" />
              </div>
              <p className="text-xs text-gray-500 mt-3 ml-[72px]">
                {role.description}
              </p>
            </motion.button>
          ))}
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-10 text-center"
        >
          <p className="text-xs text-gray-400">
            A Digital India Initiative
          </p>
          <p className="text-xs text-gray-400 mt-1">
            स्वच्छ भारत अभियान
          </p>
        </motion.div>
      </div>

      {/* Bottom Indian colors */}
      <div className="fixed bottom-0 left-0 right-0 h-1 flex">
        <div className="flex-1 bg-[#FF9933]" />
        <div className="flex-1 bg-white" />
        <div className="flex-1 bg-[#138808]" />
      </div>
    </div>
  );
}
