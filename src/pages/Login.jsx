import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Phone, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { RecaptchaVerifier } from 'firebase/auth';
import { auth } from '../firebase';

export default function Login() {
    const { loginWithPhone, checkCreateUser } = useAuth(); // Assuming checkCreateUser is exposed or handled within loginWithPhone flow? 
    // Wait, checkCreateUser is internal to AuthContext usually, but for phone auth, the confirmationResult.confirm() returns the user.
    // I need to make sure AuthContext handles the user creation after confirmation. 
    // Actually, I can't call checkCreateUser from here easily if it's not exposed. 
    // Let's rely on onAuthStateChanged in AuthContext to trigger checkCreateUser? 
    // No, onAuthStateChanged triggers checkCreateUser in my implementation.

    const navigate = useNavigate();
    const [phoneNumber, setPhoneNumber] = useState('+91');
    const [otp, setOtp] = useState('');
    const [expandForm, setExpandForm] = useState(false);
    const [verificationId, setVerificationId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const checkProfileStatus = async (uid) => {
        try {
            const { doc, getDoc } = await import('firebase/firestore'); // Dynamic import to avoid top-level if needed, or better just import at top. 
            // Actually, let's use the standard import since we already have 'auth' imported from ../firebase
            // But Login.jsx doesn't import db. Let's add it.
            const { db } = await import('../firebase');
            const userRef = doc(db, 'users', uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                return userSnap.data().isProfileComplete === true;
            }
            return false;
        } catch (error) {
            console.error("Error checking profile:", error);
            return false;
        }
    };

    useEffect(() => {
        if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                'size': 'invisible',
                'callback': (response) => {
                    // reCAPTCHA solved, allow signInWithPhoneNumber.
                },
                'expired-callback': () => {
                    // Response expired. Ask user to solve reCAPTCHA again.
                }
            });
        }
    }, []);

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setError('');

        if (phoneNumber.length < 13) {
            setError('Please enter a valid phone number with country code (+91...)');
            return;
        }

        setLoading(true);
        try {
            const appVerifier = window.recaptchaVerifier;
            const confirmationResult = await loginWithPhone(phoneNumber, appVerifier);
            window.confirmationResult = confirmationResult;
            setVerificationId(confirmationResult.verificationId);
            setExpandForm(true);
        } catch (err) {
            console.error(err);
            setError('Failed to send OTP. Try again.');
            // Reset recaptcha
            if (window.recaptchaVerifier) {
                window.recaptchaVerifier.render().then(widgetId => {
                    grecaptcha.reset(widgetId);
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await window.confirmationResult.confirm(otp);
            // User signed in. AuthContext onAuthStateChanged will handle the rest (creating user doc)

            // Check if profile is complete
            const isProfileComplete = await checkProfileStatus(result.user.uid);
            if (isProfileComplete) {
                navigate('/');
            } else {
                navigate('/onboarding');
            }
        } catch (err) {
            console.error(err);
            setError('Invalid OTP. Please check properly.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#008080] px-6 relative overflow-hidden">

            {/* Background Texture */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                <div className="absolute top-10 left-10 w-64 h-64 bg-white rounded-full mix-blend-overlay filter blur-3xl animate-blob"></div>
                <div className="absolute top-10 right-10 w-64 h-64 bg-teal-300 rounded-full mix-blend-overlay filter blur-3xl animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-8 left-20 w-64 h-64 bg-teal-600 rounded-full mix-blend-overlay filter blur-3xl animate-blob animation-delay-4000"></div>
            </div>

            <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8 relative z-10">
                <div className="text-center mb-8">
                    <div className="bg-teal-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transform rotate-3">
                        <Phone className="w-8 h-8 text-[#008080]" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Welcome!</h1>
                    <p className="text-gray-500 text-sm mt-1">Enter your mobile number to continue</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-6 text-sm flex items-center justify-center animate-in fade-in slide-in-from-top-2">
                        {error}
                    </div>
                )}

                {!expandForm ? (
                    <form onSubmit={handleSendOtp} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1">Mobile Number</label>
                            <div className="relative">
                                <input
                                    type="tel"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    placeholder="+91 98765 43210"
                                    className="block w-full px-4 py-4 border-2 border-gray-100 rounded-xl text-lg font-medium text-gray-900 focus:ring-[#008080] focus:border-[#008080] outline-none transition-all placeholder-gray-300 bg-gray-50 focus:bg-white"
                                    required
                                />
                            </div>
                        </div>

                        <div id="recaptcha-container"></div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#008080] text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-teal-700 active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Send OTP'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleVerifyOtp} className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                        <div className="space-y-1">
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1">Enter OTP</label>
                                <button
                                    type="button"
                                    onClick={() => setExpandForm(false)}
                                    className="text-xs text-[#008080] font-medium hover:underline"
                                >
                                    Change Number?
                                </button>
                            </div>
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                placeholder="123456"
                                className="block w-full px-4 py-4 border-2 border-gray-100 rounded-xl text-center text-2xl font-bold text-gray-900 focus:ring-[#008080] focus:border-[#008080] outline-none transition-all tracking-[0.5em] placeholder-gray-200"
                                maxLength={6}
                                required
                                autoFocus
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#008080] text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-teal-700 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 disabled:opacity-70"
                        >
                            {loading ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                <>
                                    <span>Verify & Login</span>
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>
                )}

                <p className="text-center text-gray-400 text-xs mt-8">
                    By continuing, you agree to our Terms & Privacy Policy.
                </p>
            </div>
        </div>
    );
}
