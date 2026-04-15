import { useState, useEffect } from 'react';
import { User, Settings, CreditCard, Shield, LogOut, X, CircleHelp, ChevronRight, Car, Map as MapIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import RouteMapModal from '../components/RouteMapModal';
import { useRideTracking } from '../hooks/useRideTracking';

// Inner component so the hook gets a stable rideId
function DriverTrackingModal({ ride, currentUser, onClose }) {
    const { driverLocation, passengerPickups, startBroadcast, stopBroadcast } = useRideTracking(
        ride.id, currentUser, true
    );

    useEffect(() => {
        startBroadcast();
        return () => stopBroadcast();
    }, []);

    return (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-md">
                <RouteMapModal
                    isOpen={true}
                    onClose={onClose}
                    origin={ride.origin}
                    destination={ride.destination}
                    driverLocation={driverLocation}
                    passengerPickups={passengerPickups}
                />
                <div className="bg-white px-5 pb-5 -mt-1 rounded-b-3xl">
                    <p className="text-center text-xs text-teal-600 font-medium py-2">
                        📡 Broadcasting your location to passengers in real-time
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function Profile() {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const [showRedeemModal, setShowRedeemModal] = useState(false);
    const [wakeWordEnabled, setWakeWordEnabled] = useState(localStorage.getItem('wakeWordEnabled') === 'true');

    // Driver's active rides
    const [activeDriverRides, setActiveDriverRides] = useState([]);
    const [trackingRide, setTrackingRide] = useState(null);

    // Fetch driver's active rides so they can pick which one to track
    useEffect(() => {
        if (!currentUser) return;
        const q = query(collection(db, 'rides'), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            const rides = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            const mine = rides.filter(r =>
                r.driverId === currentUser.uid &&
                r.status !== 'completed' &&
                r.status !== 'cancelled'
            );
            setActiveDriverRides(mine);
        });
        return () => unsub();
    }, [currentUser]);

    const handleWakeWordToggle = () => {
        const next = !wakeWordEnabled;
        setWakeWordEnabled(next);
        localStorage.setItem('wakeWordEnabled', next);
        if (next) alert("Voice Wake Word Enabled. Say 'Hey Car' to activate.");
    };

    const handleLogout = async () => {
        try { await logout(); navigate('/login'); }
        catch (e) { console.error('Logout failed', e); }
    };

    return (
        <div className="min-h-full pb-24 p-6 space-y-6">

            {/* Driver Tracking Modal */}
            {trackingRide && (
                <DriverTrackingModal
                    ride={trackingRide}
                    currentUser={currentUser}
                    onClose={() => setTrackingRide(null)}
                />
            )}

            {/* Header */}
            <div className="flex items-center space-x-4 pt-4 animate-in fade-in slide-in-from-top-4 duration-700">
                <div className="relative group">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-teal-400 to-blue-500 p-1 shadow-lg group-hover:scale-105 transition-transform duration-300">
                        <div className="w-full h-full rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/50">
                            <span className="text-3xl font-bold text-white drop-shadow-md">
                                {currentUser?.displayName?.charAt(0).toUpperCase() || 'U'}
                            </span>
                        </div>
                    </div>
                    <div className="absolute bottom-0 right-0 bg-green-400 w-5 h-5 rounded-full border-4 border-white shadow-sm" />
                </div>
                <div>
                    <h1 className="text-3xl font-black text-gray-800 tracking-tight">
                        {currentUser?.displayName || 'User'}
                    </h1>
                    <span className="bg-white/40 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-teal-800 border border-white/40 shadow-sm uppercase tracking-wider">
                        Rider & Driver
                    </span>
                </div>
            </div>

            {/* Scan for Vouchers */}
            <div className="glass-card p-6 animate-in zoom-in-95 duration-500 delay-100">
                <h2 className="text-sm font-bold text-gray-500 tracking-widest uppercase mb-4">Rewards</h2>
                <button
                    onClick={() => setShowRedeemModal(true)}
                    className="w-full glass-button bg-teal-500/10 hover:bg-teal-500/20 text-teal-900 font-bold py-3 rounded-xl text-sm transition-all border border-teal-500/20"
                >
                    Scan for Vouchers
                </button>
            </div>

            {/* Driver: Live Ride Tracking from Profile */}
            {activeDriverRides.length > 0 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-1">Your Active Rides</p>
                    <div className="space-y-2">
                        {activeDriverRides.map(ride => (
                            <button
                                key={ride.id}
                                onClick={() => setTrackingRide(ride)}
                                className="w-full glass-button p-4 rounded-xl flex items-center justify-between hover:bg-white/80 transition-all duration-300 group shadow-sm hover:shadow-md border border-teal-100"
                            >
                                <div className="flex items-center space-x-4">
                                    <div className="bg-teal-50 p-2 rounded-lg text-teal-600">
                                        <MapIcon className="w-5 h-5" />
                                    </div>
                                    <div className="text-left">
                                        <span className="block text-sm font-bold text-gray-800">{ride.origin} → {ride.destination}</span>
                                        <span className="block text-xs text-teal-600 font-medium">Tap to broadcast live location</span>
                                    </div>
                                </div>
                                <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Menu */}
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                {[
                    { label: 'Your Rides', icon: Car, path: '/your-rides' },
                    { label: 'Settings', icon: Settings, path: '/settings' },
                    { label: 'Payment Methods', icon: CreditCard, path: '/payment' },
                    { label: 'Safety & Privacy', icon: Shield, path: '/safety' },
                    { label: 'Help & Support', icon: CircleHelp, path: '/faq' },
                ].map((item) => (
                    <button
                        key={item.label}
                        onClick={() => navigate(item.path)}
                        className="w-full glass-button p-4 rounded-xl flex items-center justify-between hover:bg-white/80 transition-all duration-300 group shadow-sm hover:shadow-md border border-white/60"
                    >
                        <div className="flex items-center space-x-4">
                            <div className="bg-white p-2 rounded-lg shadow-sm text-gray-600 group-hover:text-teal-600 transition-colors">
                                <item.icon className="w-5 h-5" />
                            </div>
                            <span className="text-base font-semibold text-gray-700 group-hover:text-gray-900">{item.label}</span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
                    </button>
                ))}

                {/* Voice Wake Word */}
                <div className="w-full glass-button p-4 rounded-xl flex items-center justify-between shadow-sm border border-white/60">
                    <div className="flex items-center space-x-4">
                        <div className="bg-yellow-100 p-2 rounded-lg text-yellow-600">
                            <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" x2="12" y1="19" y2="22" /></svg>
                        </div>
                        <div className="text-left">
                            <span className="block text-base font-semibold text-gray-700">Enable Voice Wake Word</span>
                            <span className="block text-xs text-gray-400">Say "Hey Car" to listen</span>
                        </div>
                    </div>
                    <button
                        onClick={handleWakeWordToggle}
                        className={`w-12 h-6 rounded-full transition-colors relative ${wakeWordEnabled ? 'bg-teal-500' : 'bg-gray-300'}`}
                    >
                        <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${wakeWordEnabled ? 'left-7' : 'left-1'}`} />
                    </button>
                </div>

                <button
                    onClick={handleLogout}
                    className="w-full glass-button p-4 rounded-xl flex items-center justify-between hover:bg-red-50/80 transition-all duration-300 group mt-6 border border-red-100/50"
                >
                    <div className="flex items-center space-x-4">
                        <div className="bg-red-50 p-2 rounded-lg text-red-500 group-hover:bg-red-100 transition-colors">
                            <LogOut className="w-5 h-5" />
                        </div>
                        <span className="text-base font-semibold text-gray-700 group-hover:text-red-700">Log Out</span>
                    </div>
                </button>
            </div>

            <div className="mt-8 text-center text-gray-400 text-xs">Version 1.1.0</div>

            {/* Voucher Modal */}
            {showRedeemModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="bg-[#008080] p-4 flex justify-between items-center">
                            <h3 className="text-white font-bold text-lg">Scan at Gate</h3>
                            <button onClick={() => setShowRedeemModal(false)} className="bg-white/20 p-1 rounded-full text-white hover:bg-white/30">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-8 flex flex-col items-center">
                            <div className="bg-white p-4 rounded-xl border-2 border-dashed border-gray-300 mb-4">
                                <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=ThrivetripMetroRedeem" alt="QR Code" className="w-48 h-48" />
                            </div>
                            <p className="text-center text-gray-600 font-medium">Travel 100 Miles for a special voucher.</p>
                            <p className="text-center text-gray-400 text-xs mt-2">Valid for 1 hour from generation.</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
