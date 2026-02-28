import { Crown, Zap, BarChart2, BookOpen, Bell, Shield, Star, ArrowLeft } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import MadeByDevBadge from '../components/MadeByDevBadge';

const features = [
  {
    icon: BookOpen,
    title: 'Unlimited Mock Tests',
    description: 'Create and attempt unlimited mock tests across all subjects.',
    color: 'text-blue-600 bg-blue-50',
  },
  {
    icon: BarChart2,
    title: 'Advanced Analytics',
    description: 'Deep insights into your performance trends and weak areas.',
    color: 'text-purple-600 bg-purple-50',
  },
  {
    icon: Bell,
    title: 'Smart Reminders',
    description: 'AI-powered study reminders based on your schedule and targets.',
    color: 'text-orange-600 bg-orange-50',
  },
  {
    icon: Shield,
    title: 'Ad-Free Experience',
    description: 'Study without distractions. Pure, clean interface.',
    color: 'text-green-600 bg-green-50',
  },
  {
    icon: Star,
    title: 'Custom Study Plans',
    description: 'Personalized study plans tailored to your exam date and goals.',
    color: 'text-yellow-600 bg-yellow-50',
  },
  {
    icon: Zap,
    title: 'Priority Support',
    description: 'Get help faster with dedicated priority support.',
    color: 'text-teal-600 bg-teal-50',
  },
];

export default function ProUpgradePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 p-4 md:p-8">
      {/* Back button */}
      <button
        onClick={() => navigate({ to: '/dashboard' })}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Dashboard
      </button>

      {/* Hero */}
      <div className="max-w-3xl mx-auto text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg mb-4">
          <Crown size={32} className="text-white" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
          Upgrade to <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600">Board Saathi Pro</span>
        </h1>
        <p className="text-gray-500 text-base md:text-lg max-w-xl mx-auto">
          Unlock the full potential of your CBSE Class 10 preparation with premium features designed to help you score higher.
        </p>
      </div>

      {/* Pricing Card */}
      <div className="max-w-sm mx-auto mb-10">
        <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-6 text-white text-center shadow-xl">
          <div className="text-sm font-medium text-amber-100 mb-1">Pro Plan</div>
          <div className="text-4xl font-bold mb-1">₹299<span className="text-xl font-normal text-amber-200">/year</span></div>
          <div className="text-amber-100 text-sm mb-4">Less than ₹1 per day</div>
          <Button
            className="w-full bg-white text-orange-600 hover:bg-amber-50 font-bold text-base py-5 rounded-xl shadow"
            onClick={() => alert('Payment processing coming soon! 🚀')}
          >
            <Zap size={18} className="mr-2" />
            Get Pro Now
          </Button>
          <p className="text-xs text-amber-200 mt-3">Payment processing not yet available</p>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-3xl mx-auto">
        <h2 className="text-xl font-bold text-gray-800 text-center mb-6">Everything in Pro</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {features.map(({ icon: Icon, title, description, color }) => (
            <div key={title} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${color}`}>
                <Icon size={20} />
              </div>
              <h3 className="font-semibold text-gray-800 text-sm mb-1">{title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center mt-4">
        <MadeByDevBadge />
      </div>
    </div>
  );
}
