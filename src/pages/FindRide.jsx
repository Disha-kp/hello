import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, increment, arrayUnion } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import SearchBar from '../components/SearchBar';
import RideCard from '../components/RideCard';
import Map from '../components/Map';
import SmartSpotGuide from '../components/SmartSpotGuide';
import RouteMapModal from '../components/RouteMapModal';
import { useRideTracking } from '../hooks/useRideTracking';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

// ── Inline Toast Component ────────────────────────────────────────────────────
function BookingToast({ toast }) {
    if (!toast.show) return null;
    const isSuccess = toast.type === 'success';
    const isError = toast.type === 'error';

    return (
        <div
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-[99999] flex items-center space-x-3 px-5 py-4 rounded-2xl shadow-2xl border animate-in fade-in slide-in-from-top-4 duration-300 max-w-[90vw]
                ${isSuccess ? 'bg-white border-green-200 text-green-800' : ''}
                ${isError ? 'bg-white border-red-200 text-red-700' : ''}
                ${!isSuccess && !isError ? 'bg-white border-gray-200 text-gray-800' : ''}`}
        >
            {isSuccess && <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />}
            {isError && <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />}
            {!isSuccess && !isError && <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0" />}
            <span className="font-semibold text-sm">{toast.message}</span>

            {/* Progress bar */}
            {isSuccess && (
                <div className="absolute bottom-0 left-0 h-1 bg-green-400 rounded-b-2xl animate-[shrink_3.5s_linear_forwards]"
                    style={{ animation: 'toast-shrink 3.5s linear forwards' }}
                />
            )}
        </div>
    );
}

export default function FindRide() {
    const { currentUser } = useAuth();
    const [isDriverView, setIsDriverView] = useState(false);
    const [rides, setRides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // The ride the user is previewing before booking
    const [previewRide, setPreviewRide] = useState(null);
    const [booking, setBooking] = useState(false);

    // Toast notification state
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    // Tracking hook — rideId null until user picks a ride to preview
    const { savePassengerLocation } = useRideTracking(null, currentUser, false);

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3500);
    };

    useEffect(() => {
        const q = query(collection(db, 'rides'), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            setRides(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const filteredRides = rides.filter(ride => {
        if (ride.status === 'completed' || ride.status === 'cancelled') return false;
        const q = searchQuery.toLowerCase();
        return ride.origin?.toLowerCase().includes(q) || ride.destination?.toLowerCase().includes(q);
    });

    // Step 1: Validate then open map preview
    const handleOpenPreview = (ride) => {
        if (!currentUser) {
            showToast('Please log in to book a ride.', 'error');
            return;
        }
        if (ride.passengers?.includes(currentUser.uid)) {
            showToast('You have already booked this ride.', 'warning');
            return;
        }
        if (!ride.seats || ride.seats <= 0) {
            showToast('Sorry, this ride is fully booked.', 'error');
            return;
        }
        setPreviewRide(ride);
    };

    // Step 2: User confirms → book + save GPS
    const handleConfirmBook = async () => {
        if (!currentUser || !previewRide) return;

        // Re-validate against the latest ride data (race condition guard)
        const latestRide = rides.find(r => r.id === previewRide.id);

        if (!latestRide) {
            showToast('Ride no longer available.', 'error');
            setPreviewRide(null);
            return;
        }

        if (latestRide.passengers?.includes(currentUser.uid)) {
            showToast('You have already booked this ride.', 'warning');
            setPreviewRide(null);
            return;
        }

        if (!latestRide.seats || latestRide.seats <= 0) {
            showToast('Sorry, no seats left on this ride.', 'error');
            setPreviewRide(null);
            return;
        }

        setBooking(true);
        try {
            const rideRef = doc(db, 'rides', previewRide.id);
            await updateDoc(rideRef, {
                seats: increment(-1),
                passengers: arrayUnion(currentUser.uid),
            });

            // Save this passenger's GPS location to Firestore
            await savePassengerLocation(
                previewRide.id,
                currentUser.uid,
                currentUser.displayName || 'Rider'
            );

            setPreviewRide(null);
            showToast('Your ride has been successfully booked.', 'success');

        } catch (err) {
            console.error('Booking error:', err);
            showToast('Error booking ride. Please try again.', 'error');
        } finally {
            setBooking(false);
        }
    };

    // Voice assistant
    useEffect(() => {
        const handler = (e) => {
            const { command, speak } = e.detail;
            const cmd = command.toLowerCase();
            if (cmd.includes('book') || cmd.includes('yes')) {
                if (filteredRides.length > 0) {
                    setPreviewRide(filteredRides[0]);
                    speak('Opening route preview. Confirm to book.');
                } else {
                    speak('No rides available to book.');
                }
            } else {
                setSearchQuery(cmd);
                setTimeout(() => {
                    const results = rides.filter(r =>
                        r.origin?.toLowerCase().includes(cmd) || r.destination?.toLowerCase().includes(cmd)
                    );
                    if (results.length > 0) {
                        speak(`Ride available with ${results[0].driverName} for ${results[0].price} rupees. Say Book to confirm.`);
                    } else {
                        speak('Sorry, no rides found for that location.');
                    }
                }, 500);
            }
        };
        window.addEventListener('voice-command', handler);
        return () => window.removeEventListener('voice-command', handler);
    }, [rides, filteredRides]);

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col pb-[80px] relative">
            <div className="absolute inset-0 pointer-events-none radiant-background opacity-20 z-0" />

            {/* ── Toast Notification ─────────────────────────────────── */}
            <BookingToast toast={toast} />

            {/* ── Book Ride Map Popup ──────────────────────────────────── */}
            {previewRide && (
                <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md flex flex-col">
                        <RouteMapModal
                            isOpen={!!previewRide}
                            onClose={() => setPreviewRide(null)}
                            origin={previewRide.origin}
                            destination={previewRide.destination}
                        />

                        {/* Ride Summary Bar */}
                        <div className="bg-white px-5 pt-4 pb-2 -mt-1 rounded-b-3xl border-x border-b border-gray-100">
                            <div className="grid grid-cols-3 divide-x divide-gray-100 mb-4 text-center">
                                <div className="pr-3">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Driver</p>
                                    <p className="text-sm font-bold text-gray-800 truncate">{previewRide.driverName}</p>
                                </div>
                                <div className="px-3">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Price</p>
                                    <p className="text-sm font-bold text-teal-600">₹{previewRide.price}</p>
                                </div>
                                <div className="pl-3">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Seats</p>
                                    <p className="text-sm font-bold text-gray-800">{previewRide.seats} left</p>
                                </div>
                            </div>
                            <button
                                onClick={handleConfirmBook}
                                disabled={booking}
                                className="w-full bg-[#008080] hover:bg-teal-700 disabled:opacity-60 text-white font-bold py-4 rounded-2xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center space-x-2 mb-2"
                            >
                                {booking ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        <span>Booking...</span>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-5 h-5" />
                                        <span>Confirm &amp; Book Ride</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toggle */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[500] w-11/12 max-w-xs">
                <div className="glass p-1.5 rounded-2xl flex relative">
                    <div className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-teal-600 rounded-xl shadow-md transition-all duration-300 ${isDriverView ? 'left-[calc(50%+3px)]' : 'left-1.5'}`} />
                    <button onClick={() => setIsDriverView(false)} className={`flex-1 py-3 text-sm font-bold rounded-xl relative z-10 transition-colors duration-300 ${!isDriverView ? 'text-white' : 'text-gray-500 hover:text-gray-900'}`}>Rider</button>
                    <button onClick={() => setIsDriverView(true)} className={`flex-1 py-3 text-sm font-bold rounded-xl relative z-10 transition-colors duration-300 ${isDriverView ? 'text-white' : 'text-gray-500 hover:text-gray-900'}`}>Driver</button>
                </div>
            </div>

            {!isDriverView ? (
                <>
                    <div className="h-[55%] w-full relative z-0 shadow-inner">
                        <Map />
                        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white/20 to-transparent pointer-events-none" />
                    </div>

                    <div className="flex-1 -mt-8 relative z-10 px-4">
                        <div className="glass-card h-full flex flex-col shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] border-t border-white/50">
                            <div className="mx-auto w-12 h-1.5 bg-gray-300/50 rounded-full mt-3 mb-2" />
                            <div className="px-4 pb-2 space-y-4">
                                <SearchBar value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                                {searchQuery && (
                                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <div className="glass-card bg-teal-50/50 border-teal-100/50">
                                            <SmartSpotGuide locationName={searchQuery} />
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3 scrollbar-hide">
                                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider ml-1 mb-2">Available Rides</h2>
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center py-8 space-y-3">
                                        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
                                        <p className="text-gray-400 text-sm">Finding nearby rides...</p>
                                    </div>
                                ) : filteredRides.length === 0 ? (
                                    <div className="text-center py-8">
                                        <p className="text-gray-500 font-medium">No rides found.</p>
                                        <p className="text-gray-400 text-sm mt-1">Try a different location.</p>
                                    </div>
                                ) : (
                                    filteredRides.map((ride) => (
                                        <div key={ride.id} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                                            <RideCard
                                                {...ride}
                                                driver={ride.driverName}
                                                start={ride.origin}
                                                end={ride.destination}
                                                rating={ride.rating || 5.0}
                                                isBooked={currentUser && ride.passengers?.includes(currentUser.uid)}
                                                onBook={() => handleOpenPreview(ride)}
                                            />
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex-1 flex flex-col">
                    <div className="h-[45%] w-full relative opacity-60 pointer-events-none grayscale"><Map /></div>
                    <div className="flex-1 -mt-10 relative z-10 px-4">
                        <div className="glass-card h-full flex flex-col items-center justify-center p-8 text-center shadow-2xl border-t border-white/60">
                            <div className="bg-teal-50/50 p-6 rounded-full mb-6 ring-4 ring-teal-50/30 animate-pulse">
                                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#008080" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
                                    <circle cx="7" cy="17" r="2" /><path d="M9 17h6" /><circle cx="17" cy="17" r="2" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-black text-gray-800 mb-3 tracking-tight">Driving somewhere?</h3>
                            <p className="text-gray-500 mb-8 max-w-xs leading-relaxed">Share your empty seats, save on fuel, and make new friends along the way.</p>
                            <a href="/offer" className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 px-8 rounded-2xl shadow-lg shadow-teal-600/20 transition-all active:scale-[0.98] flex items-center justify-center space-x-2">
                                <span>Offer a Ride</span>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
