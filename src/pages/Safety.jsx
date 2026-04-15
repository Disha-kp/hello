import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    ShieldCheck,
    Phone,
    UserPlus,
    AlertTriangle,
    Eye,
    Lock,
    MapPin,
    AlertCircle,
    ChevronRight
} from 'lucide-react';

export default function Safety() {
    const navigate = useNavigate();
    const [privacySettings, setPrivacySettings] = useState({
        locationSharing: true,
        profileVisibility: true,
        dataSharing: false
    });

    const toggleSetting = (key) => {
        setPrivacySettings(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
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

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            <div className="bg-[#008080] px-4 py-4 sticky top-0 z-10 shadow-md flex items-center text-white">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 rounded-full hover:bg-white/20 transition"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-bold ml-2">Safety & Privacy</h1>
            </div>

            <div className="px-4 py-6 space-y-6">

                {/* Emergency Assistance Card */}
                <div className="bg-red-50 border border-red-100 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="bg-red-100 p-2 rounded-full">
                            <AlertTriangle className="w-6 h-6 text-red-600" />
                        </div>
                        <h2 className="text-lg font-bold text-red-800">Emergency Assistance</h2>
                    </div>
                    <p className="text-sm text-red-700 mb-4">
                        Use this in case of an immediate threat or emergency during a ride.
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                        <button className="bg-red-600 text-white font-bold py-3 px-4 rounded-xl shadow-md hover:bg-red-700 transition flex items-center justify-center">
                            <Phone className="w-4 h-4 mr-2" /> Call 112
                        </button>
                        <button className="bg-white text-red-600 border border-red-200 font-bold py-3 px-4 rounded-xl shadow-sm hover:bg-red-50 transition flex items-center justify-center">
                            <ShieldCheck className="w-4 h-4 mr-2" /> Safety Grid
                        </button>
                    </div>
                </div>

                {/* Trusted Contacts */}
                <div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-1">Trusted Contacts</h3>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 border-b border-gray-50 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-teal-50 rounded-full flex items-center justify-center text-[#008080] font-bold">
                                    M
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">Mom</p>
                                    <p className="text-xs text-gray-500">+91 98765 43210</p>
                                </div>
                            </div>
                            <button className="text-xs text-red-500 font-medium hover:underline">Remove</button>
                        </div>
                        <button className="w-full p-4 flex items-center justify-center text-[#008080] font-bold hover:bg-teal-50 transition">
                            <UserPlus className="w-5 h-5 mr-2" /> Add Trusted Contact
                        </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-2 px-1">
                        Trusted contacts can view your ride details and live location.
                    </p>
                </div>

                {/* Privacy Settings */}
                <div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-1">Privacy Controls</h3>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 border-b border-gray-50 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <MapPin className="w-5 h-5 text-gray-400" />
                                <div>
                                    <p className="font-medium text-gray-900">Share Live Location</p>
                                    <p className="text-xs text-gray-500">With trusted contacts during rides</p>
                                </div>
                            </div>
                            <Toggle
                                checked={privacySettings.locationSharing}
                                onChange={() => toggleSetting('locationSharing')}
                            />
                        </div>
                        <div className="p-4 border-b border-gray-50 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <Eye className="w-5 h-5 text-gray-400" />
                                <div>
                                    <p className="font-medium text-gray-900">Profile Visibility</p>
                                    <p className="text-xs text-gray-500">Show profile to other riders</p>
                                </div>
                            </div>
                            <Toggle
                                checked={privacySettings.profileVisibility}
                                onChange={() => toggleSetting('profileVisibility')}
                            />
                        </div>
                        <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <Lock className="w-5 h-5 text-gray-400" />
                                <div>
                                    <p className="font-medium text-gray-900">Data Sharing</p>
                                    <p className="text-xs text-gray-500">Allow detailed usage analytics</p>
                                </div>
                            </div>
                            <Toggle
                                checked={privacySettings.dataSharing}
                                onChange={() => toggleSetting('dataSharing')}
                            />
                        </div>
                    </div>
                </div>

                {/* Safety Tips */}
                <div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-1">Safety Guide</h3>
                    <div className="space-y-3">
                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-start space-x-3">
                            <AlertCircle className="w-5 h-5 text-[#008080] mt-0.5" />
                            <div>
                                <h4 className="font-bold text-gray-900 text-sm">Verify Vehicle Details</h4>
                                <p className="text-xs text-gray-600 mt-1">Always check the car number plate and driver photo before entering the vehicle.</p>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-start space-x-3">
                            <MapPin className="w-5 h-5 text-[#008080] mt-0.5" />
                            <div>
                                <h4 className="font-bold text-gray-900 text-sm">Share Your Ride</h4>
                                <p className="text-xs text-gray-600 mt-1">Use the 'Share Ride' feature to send your live location to friends or family.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-4 text-center">
                    <button className="text-sm text-[#008080] font-bold hover:underline flex items-center justify-center mx-auto">
                        View Community Guidelines <ChevronRight className="w-4 h-4" />
                    </button>
                </div>

            </div>
        </div>
    );
}
