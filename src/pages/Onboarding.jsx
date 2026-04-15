import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Calendar, ArrowRight, Loader2 } from 'lucide-react';
import { updateProfile } from "firebase/auth";
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function Onboarding() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    // Initialize with existing data if available
    const [formData, setFormData] = useState({
        name: currentUser?.displayName || '',
        email: currentUser?.email || '',
        gender: '',
        dob: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Update Auth Profile
            if (currentUser.displayName !== formData.name) {
                await updateProfile(currentUser, {
                    displayName: formData.name
                });
            }

            // Update Firestore
            const userRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userRef, {
                name: formData.name,
                email: formData.email,
                gender: formData.gender,
                dob: formData.dob,
                isProfileComplete: true // Flag to mark completion
            });
            navigate('/');
        } catch (error) {
            console.error("Error updating profile:", error);
            alert("Failed to save details. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-[#008080]">Complete Your Profile</h1>
                    <p className="text-gray-500 text-sm mt-2">Tell us a bit more about yourself to get started.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Full Name */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1">Full Name</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <User className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-[#008080] focus:border-[#008080] outline-none"
                                placeholder="John Doe"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1">Email Address <span className="text-xs text-gray-400 font-normal normal-case">(Optional)</span></label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-[#008080] focus:border-[#008080] outline-none"
                                placeholder="john@example.com"
                            />
                        </div>
                    </div>

                    {/* Gender */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1">Gender</label>
                        <div className="relative">
                            <select
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                                className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-[#008080] focus:border-[#008080] outline-none bg-white"
                                required
                            >
                                <option value="" disabled>Select Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                                <option value="Prefer not to say">Prefer not to say</option>
                            </select>
                        </div>
                    </div>

                    {/* Date of Birth */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1">Date of Birth</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Calendar className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="date"
                                name="dob"
                                value={formData.dob}
                                onChange={handleChange}
                                className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-[#008080] focus:border-[#008080] outline-none"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#008080] text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-teal-700 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 mt-6 disabled:opacity-70"
                    >
                        {loading ? (
                            <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                            <>
                                <span>Complete Profile</span>
                                <ArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
