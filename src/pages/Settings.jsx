import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    User,
    Globe,
    Bell,
    Mail,
    MessageSquare,
    Shield,
    MapPin,
    LogOut,
    Trash2,
    ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
    const navigate = useNavigate();
    const { logout } = useAuth();

    const [notifications, setNotifications] = useState({
        push: true,
        email: false,
        sms: true
    });

    const [privacy, setPrivacy] = useState({
        profileVisibility: true,
        locationHistory: true
    });

    const handleToggle = (category, setting) => {
        if (category === 'notifications') {
            setNotifications(prev => ({ ...prev, [setting]: !prev[setting] }));
        } else if (category === 'privacy') {
            setPrivacy(prev => ({ ...prev, [setting]: !prev[setting] }));
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error("Failed to log out", error);
        }
    };

    const Toggle = ({ checked, onChange }) => (
        <button
            onClick={onChange}
            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out ${checked ? 'bg-[#008080]' : 'bg-gray-300'}`}
        >
            <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`}
            />
        </button>
    );

    const SectionHeader = ({ title }) => (
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 mt-6 px-2">{title}</h2>
    );

    const SettingItem = ({ icon: Icon, label, value, onClick, isDestructive = false }) => (
        <button
            onClick={onClick}
            className="w-full flex items-center justify-between p-4 bg-white border-b border-gray-50 last:border-0 active:bg-gray-50 transition-colors"
        >
            <div className="flex items-center">
                <div className={`p-2 rounded-lg mr-3 ${isDestructive ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-600'}`}>
                    <Icon className="w-5 h-5" />
                </div>
                <span className={`font-medium ${isDestructive ? 'text-red-600' : 'text-gray-900'}`}>{label}</span>
            </div>
            <div className="flex items-center text-gray-400">
                {value && <span className="text-sm mr-2">{value}</span>}
                <ChevronRight className="w-4 h-4" />
            </div>
        </button>
    );

    const ToggleItem = ({ icon: Icon, label, checked, onChange }) => (
        <div className="w-full flex items-center justify-between p-4 bg-white border-b border-gray-50 last:border-0">
            <div className="flex items-center">
                <div className="p-2 rounded-lg mr-3 bg-gray-50 text-gray-600">
                    <Icon className="w-5 h-5" />
                </div>
                <span className="font-medium text-gray-900">{label}</span>
            </div>
            <Toggle checked={checked} onChange={onChange} />
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            <div className="bg-white px-4 py-4 sticky top-0 z-10 shadow-sm flex items-center">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 rounded-full hover:bg-gray-100 transition"
                >
                    <ArrowLeft className="w-6 h-6 text-gray-700" />
                </button>
                <h1 className="text-xl font-bold text-gray-900 ml-2">Settings</h1>
            </div>

            <div className="px-4 pb-8">
                {/* Account Section */}
                <SectionHeader title="Account" />
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    <SettingItem
                        icon={User}
                        label="Edit Profile"
                        onClick={() => navigate('/onboarding')}
                    />
                    <SettingItem
                        icon={Globe}
                        label="Language"
                        value="English"
                        onClick={() => { }}
                    />
                </div>

                {/* Notifications Section */}
                <SectionHeader title="Notifications" />
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    <ToggleItem
                        icon={Bell}
                        label="Push Notifications"
                        checked={notifications.push}
                        onChange={() => handleToggle('notifications', 'push')}
                    />
                    <ToggleItem
                        icon={Mail}
                        label="Email Updates"
                        checked={notifications.email}
                        onChange={() => handleToggle('notifications', 'email')}
                    />
                    <ToggleItem
                        icon={MessageSquare}
                        label="SMS Alerts"
                        checked={notifications.sms}
                        onChange={() => handleToggle('notifications', 'sms')}
                    />
                </div>

                {/* Privacy & Security Section */}
                <SectionHeader title="Privacy & Security" />
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    <SettingItem
                        icon={MapPin}
                        label="Saved Addresses"
                        onClick={() => { }}
                    />
                    <ToggleItem
                        icon={Shield}
                        label="Profile Visibility"
                        checked={privacy.profileVisibility}
                        onChange={() => handleToggle('privacy', 'profileVisibility')}
                    />
                </div>

                {/* About Section - Terms & Privacy Policy removed */}
                <SectionHeader title="About" />
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-4 bg-white flex justify-between items-center text-sm text-gray-500">
                        <span>App Version</span>
                        <span>1.1.0</span>
                    </div>
                </div>

                {/* Danger Zone */}
                <SectionHeader title="Actions" />
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    <SettingItem
                        icon={LogOut}
                        label="Log Out"
                        onClick={handleLogout}
                        isDestructive
                    />
                    <SettingItem
                        icon={Trash2}
                        label="Delete Account"
                        onClick={() => alert('This action is permanent!')}
                        isDestructive
                    />
                </div>
            </div>
        </div>
    );
}
