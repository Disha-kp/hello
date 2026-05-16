import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import {
    collection, query, orderBy, onSnapshot, doc, updateDoc,
    increment, arrayRemove, getDoc
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import {
    Car, User, Navigation, XCircle, ShieldAlert, Map as MapIcon,
    Calendar, Clock, Star, Banknote, MapPin, CheckCircle2
} from 'lucide-react';
import RouteMapModal from '../components/RouteMapModal';
import { useRideTracking } from '../hooks/useRideTracking';

// Inner component so we can call the hook per-ride
function RideTrackingModal({ ride, isDriver, currentUser, onClose }) {
    const { driverLocation, passengerPickups, startBroadcast, stopBroadcast } = useRideTracking(
        ride.id, currentUser, isDriver
    );

    useEffect(() => {
        if (isDriver) {
            startBroadcast();
            return () => stopBroadcast();
        }
    }, [isDriver]);

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
                {isDriver && (
                    <div className="bg-white px-5 pb-5 -mt-1 rounded-b-3xl">
                        <p className="text-center text-xs text-teal-600 font-medium py-2">
                            📡 Broadcasting your location to passengers...
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Booked Ride Card ──────────────────────────────────────────────────────────
function BookedRideCard({ ride, currentUser, driverDetails, onTrack, onCancelBooking }) {
    const driver = driverDetails?.[ride.driverId];
    const driverInitial = (ride.driverName || 'D')[0].toUpperCase();

    const formatDate = (dateStr) => {
        if (!dateStr) return 'Date TBD';
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
        } catch { return dateStr; }
    };

    const formatTime = (timeStr) => {
        if (!timeStr) return '';
        try {
            const [h, m] = timeStr.split(':');
            const hour = parseInt(h);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            return `${hour % 12 || 12}:${m} ${ampm}`;
        } catch { return timeStr; }
    };

    return (
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4">

            {/* Status Banner */}
            <div className="bg-gradient-to-r from-teal-600 to-teal-500 px-5 py-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span className="text-white text-xs font-bold uppercase tracking-wider">Booking Confirmed</span>
                </div>
                <span className="text-teal-100 text-xs font-bold">₹{ride.price}</span>
            </div>

            <div className="p-5 space-y-5">

                {/* ── Route ──────────────────────────────────────────────── */}
                <div className="relative">
                    <div className="absolute left-3 top-3 bottom-3 w-0.5 bg-gradient-to-b from-teal-500 to-red-400" />
                    <div className="space-y-4">
                        <div className="flex items-start space-x-4">
                            <div className="w-6 h-6 rounded-full bg-teal-500 border-2 border-white shadow flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Pickup</p>
                                <p className="font-semibold text-gray-800 truncate">{ride.origin}</p>
                            </div>
                        </div>
                        <div className="flex items-start space-x-4">
                            <div className="w-6 h-6 rounded-full bg-red-400 border-2 border-white shadow flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Drop-off</p>
                                <p className="font-semibold text-gray-800 truncate">{ride.destination}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Date & Time ────────────────────────────────────────── */}
                {(ride.date || ride.time) && (
                    <div className="flex items-center space-x-4 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                        {ride.date && (
                            <div className="flex items-center space-x-2 text-gray-700">
                                <Calendar className="w-4 h-4 text-teal-500 flex-shrink-0" />
                                <span className="text-sm font-semibold">{formatDate(ride.date)}</span>
                            </div>
                        )}
                        {ride.date && ride.time && <div className="w-px h-4 bg-gray-300" />}
                        {ride.time && (
                            <div className="flex items-center space-x-2 text-gray-700">
                                <Clock className="w-4 h-4 text-teal-500 flex-shrink-0" />
                                <span className="text-sm font-semibold">{formatTime(ride.time)}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Driver Info ────────────────────────────────────────── */}
                <div className="bg-teal-50/60 border border-teal-100 rounded-2xl p-4">
                    <p className="text-[10px] text-teal-600 font-bold uppercase tracking-wider mb-3">Your Driver</p>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white font-bold text-lg shadow-md">
                                {driverInitial}
                            </div>
                            <div>
                                <p className="font-bold text-gray-900">{ride.driverName || 'Driver'}</p>
                                <div className="flex items-center space-x-1 mt-0.5">
                                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                    <span className="text-xs text-gray-500 font-medium">{driver?.rating || '5.0'}</span>
                                    {driver?.totalRides && (
                                        <span className="text-xs text-gray-400">· {driver.totalRides} rides</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Vehicle Badge */}
                        {ride.vehicleModel && (
                            <div className="text-right">
                                <div className="flex items-center space-x-1.5 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
                                    <Car className="w-4 h-4 text-gray-500" />
                                    <div className="text-right">
                                        <p className="text-xs font-bold text-gray-800">{ride.vehicleModel}</p>
                                        {ride.numberPlate && (
                                            <p className="text-[10px] text-gray-400 font-mono">{ride.numberPlate}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Vehicle Color */}
                    {ride.vehicleColor && ride.vehicleColor !== 'Unknown' && (
                        <div className="mt-3 flex items-center space-x-2">
                            <div
                                className="w-4 h-4 rounded-full border border-gray-300 shadow-sm flex-shrink-0"
                                style={{ backgroundColor: ride.vehicleColor?.toLowerCase() || '#888' }}
                            />
                            <span className="text-xs text-gray-500">{ride.vehicleColor} vehicle</span>
                        </div>
                    )}
                </div>

                {/* ── Passenger Info (You) ───────────────────────────────── */}
                <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4">
                    <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider mb-3">Passenger</p>
                    <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm border-2 border-white shadow">
                            {(currentUser?.displayName || 'U')[0].toUpperCase()}
                        </div>
                        <div>
                            <p className="font-bold text-gray-900 text-sm">{currentUser?.displayName || 'You'}</p>
                            <p className="text-xs text-blue-500 font-medium">1 seat booked</p>
                        </div>
                        <div className="ml-auto">
                            <div className="flex items-center space-x-1.5 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 shadow-sm">
                                <Banknote className="w-3.5 h-3.5 text-green-600" />
                                <span className="text-xs font-bold text-gray-700">₹{ride.price}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Total Passengers (from this ride) ─────────────────── */}
                {ride.passengers && ride.passengers.length > 1 && (
                    <div className="flex items-center space-x-2 text-xs text-gray-500 px-1">
                        <User className="w-4 h-4 text-gray-400" />
                        <span>{ride.passengers.length} passenger{ride.passengers.length > 1 ? 's' : ''} booked total · {ride.seats} seat{ride.seats !== 1 ? 's' : ''} remaining</span>
                    </div>
                )}

                {/* ── Actions ───────────────────────────────────────────── */}
                <div className="space-y-2 pt-1">
                    <button
                        onClick={() => onTrack(ride)}
                        className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl flex items-center justify-center space-x-2 shadow-lg transition-colors"
                    >
                        <MapIcon className="w-4 h-4" />
                        <span>Track Ride (Live Map)</span>
                    </button>
                    <button
                        onClick={() => onCancelBooking(ride.id)}
                        className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl flex items-center justify-center space-x-2 transition-colors border border-red-100"
                    >
                        <XCircle className="w-4 h-4" />
                        <span>Cancel Booking</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Driver Ride Card ──────────────────────────────────────────────────────────
function DriverRideCard({ ride, passengerDetails, onTrack, onComplete, onCancel, onRemovePassenger }) {
    return (
        <div className="bg-white rounded-3xl p-5 shadow-xl border border-gray-100 animate-in fade-in slide-in-from-bottom-4">

            {/* Header */}
            <div className="flex justify-between items-start mb-4 border-b border-gray-50 pb-4">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold uppercase">
                        ME
                    </div>
                    <div>
                        <p className="font-bold text-gray-900">Your Ride</p>
                        <p className="text-xs text-gray-500 flex items-center mt-1">
                            <Navigation className="w-3 h-3 mr-1" />{ride.price}₹
                            <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 rounded-full">{ride.seats} Seats Left</span>
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-xs font-bold uppercase text-gray-400">Earnings</span>
                    <p className="text-lg font-black text-teal-600">₹{(ride.passengers?.length || 0) * ride.price}</p>
                </div>
            </div>

            {/* Route */}
            <div className="space-y-4 mb-5 relative">
                <div className="absolute left-3 top-3 bottom-3 w-0.5 bg-gray-200" />
                <div className="flex items-start space-x-4 relative z-10">
                    <div className="w-6 h-6 rounded-full bg-white border-4 border-teal-500 shadow-sm mt-0.5" />
                    <div className="flex-1">
                        <p className="text-xs text-gray-400 font-bold uppercase">Pickup</p>
                        <p className="font-semibold text-gray-800">{ride.origin}</p>
                    </div>
                </div>
                <div className="flex items-start space-x-4 relative z-10">
                    <div className="w-6 h-6 rounded-full bg-white border-4 border-red-500 shadow-sm mt-0.5" />
                    <div className="flex-1">
                        <p className="text-xs text-gray-400 font-bold uppercase">Dropoff</p>
                        <p className="font-semibold text-gray-800">{ride.destination}</p>
                    </div>
                </div>
            </div>

            {/* Date & Time */}
            {(ride.date || ride.time) && (
                <div className="flex items-center space-x-4 bg-gray-50 rounded-xl px-4 py-2.5 mb-4 border border-gray-100">
                    {ride.date && (
                        <div className="flex items-center space-x-1.5 text-gray-600">
                            <Calendar className="w-3.5 h-3.5 text-teal-500" />
                            <span className="text-xs font-semibold">{ride.date}</span>
                        </div>
                    )}
                    {ride.date && ride.time && <div className="w-px h-3 bg-gray-300" />}
                    {ride.time && (
                        <div className="flex items-center space-x-1.5 text-gray-600">
                            <Clock className="w-3.5 h-3.5 text-teal-500" />
                            <span className="text-xs font-semibold">{ride.time}</span>
                        </div>
                    )}
                </div>
            )}

            {/* Passengers */}
            <div className="bg-gray-50 rounded-2xl p-4 mb-4 border border-gray-100">
                <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    Passengers ({ride.passengers?.length || 0})
                    {ride.passengers?.length > 0 && (
                        <span className="ml-auto text-xs text-teal-600 font-normal">
                            +₹{(ride.passengers.length) * ride.price} earned
                        </span>
                    )}
                </h4>
                {(!ride.passengers || ride.passengers.length === 0) ? (
                    <p className="text-xs text-gray-500 italic">No passengers booked yet.</p>
                ) : (
                    <div className="space-y-2">
                        {ride.passengers.map(uid => (
                            <div key={uid} className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                                <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center text-xs font-bold uppercase">
                                        {passengerDetails[uid]?.name?.substring(0, 2) || passengerDetails[uid]?.displayName?.substring(0, 2) || 'PS'}
                                    </div>
                                    <div>
                                        <span className="text-sm font-bold text-gray-800 block">
                                            {passengerDetails[uid]?.name || passengerDetails[uid]?.displayName || 'Loading...'}
                                        </span>
                                        <span className="text-xs text-gray-400">1 seat · ₹{ride.price}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => onRemovePassenger(ride.id, uid)}
                                    className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                                    title="Remove passenger"
                                >
                                    <XCircle className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="pt-2 space-y-2">
                <button
                    onClick={() => onTrack(ride)}
                    className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl flex items-center justify-center space-x-2 shadow-lg transition-colors"
                >
                    <MapIcon className="w-4 h-4" />
                    <span>Start &amp; Track Ride (Live)</span>
                </button>
                <div className="flex space-x-3">
                    <button
                        onClick={() => onComplete(ride.id)}
                        className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl flex items-center justify-center transition-colors"
                    >
                        Complete Ride
                    </button>
                    <button
                        onClick={() => onCancel(ride.id)}
                        className="py-3 px-4 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl flex items-center justify-center transition-colors border border-red-100"
                    >
                        <ShieldAlert className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Main YourRides Page ───────────────────────────────────────────────────────
export default function YourRides() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState('booked');
    const [myRides, setMyRides] = useState([]);
    const [passengerDetails, setPassengerDetails] = useState({});
    const [driverDetails, setDriverDetails] = useState({});
    const [trackingRide, setTrackingRide] = useState(null);

    useEffect(() => {
        if (!currentUser) return;
        const q = query(collection(db, 'rides'), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            const filtered = all.filter(r => {
                if (r.status === 'completed' || r.status === 'cancelled') return false;
                return viewMode === 'driving'
                    ? r.driverId === currentUser.uid
                    : r.passengers?.includes(currentUser.uid);
            });
            setMyRides(filtered);

            // Fetch passenger details for driver view
            if (viewMode === 'driving') {
                (async () => {
                    const details = {};
                    for (const ride of filtered) {
                        for (const uid of (ride.passengers || [])) {
                            if (!details[uid]) {
                                const snap = await getDoc(doc(db, 'users', uid));
                                details[uid] = snap.exists() ? snap.data() : { displayName: 'Passenger' };
                            }
                        }
                    }
                    setPassengerDetails(prev => ({ ...prev, ...details }));
                })();
            }

            // Fetch driver details for booked view
            if (viewMode === 'booked') {
                (async () => {
                    const details = {};
                    for (const ride of filtered) {
                        if (ride.driverId && !details[ride.driverId]) {
                            const driverSnap = await getDoc(doc(db, 'users', ride.driverId));
                            details[ride.driverId] = driverSnap.exists() ? driverSnap.data() : null;
                        }
                    }
                    setDriverDetails(prev => ({ ...prev, ...details }));
                })();
            }
        });
        return () => unsub();
    }, [currentUser, viewMode]);

    const handleCancelRide = async (rideId) => {
        if (!window.confirm('Are you sure? All booked passengers will be notified.')) return;
        try {
            await updateDoc(doc(db, 'rides', rideId), { status: 'cancelled' });
            alert('Ride has been cancelled.');
        } catch (e) { alert('Failed to cancel ride.'); }
    };

    const handleCompleteRide = async (rideId) => {
        if (!window.confirm('Complete this ride? This will end the trip for all passengers.')) return;
        try {
            await updateDoc(doc(db, 'rides', rideId), { status: 'completed' });
            alert('Ride marked as completed.');
            navigate('/payment/' + rideId);
        } catch (e) { alert('Failed to complete ride.'); }
    };

    const handleCancelBooking = async (rideId) => {
        if (!window.confirm('Cancel your booking?')) return;
        try {
            await updateDoc(doc(db, 'rides', rideId), {
                passengers: arrayRemove(currentUser.uid),
                seats: increment(1),
            });
            alert('Booking cancelled.');
        } catch (e) { alert('Failed to cancel booking.'); }
    };

    const handleRemovePassenger = async (rideId, uid) => {
        if (!window.confirm('Remove this passenger?')) return;
        try {
            await updateDoc(doc(db, 'rides', rideId), {
                passengers: arrayRemove(uid),
                seats: increment(1),
            });
            alert('Passenger removed.');
        } catch (e) { alert('Failed to remove passenger.'); }
    };

    return (
        <div className="min-h-full pb-24 p-6 space-y-6">

            {/* Live Tracking Modal */}
            {trackingRide && (
                <RideTrackingModal
                    ride={trackingRide}
                    isDriver={viewMode === 'driving'}
                    currentUser={currentUser}
                    onClose={() => setTrackingRide(null)}
                />
            )}

            {/* Header */}
            <div className="flex items-center space-x-4 mb-6">
                <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-50">
                    <XCircle className="w-6 h-6 text-gray-500" />
                </button>
                <div>
                    <h1 className="text-2xl font-black text-gray-800 tracking-tight">Your Rides</h1>
                    <p className="text-xs text-gray-400 mt-0.5">
                        {myRides.length} active {viewMode === 'booked' ? 'booking' : 'ride'}{myRides.length !== 1 ? 's' : ''}
                    </p>
                </div>
            </div>

            {/* Toggle */}
            <div className="bg-gray-100 p-1 rounded-xl flex relative mb-6">
                <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-lg shadow-sm transition-all duration-300 ${viewMode === 'driving' ? 'left-[calc(50%+2px)]' : 'left-1'}`} />
                <button
                    onClick={() => setViewMode('booked')}
                    className={`flex-1 py-3 text-sm font-bold rounded-lg relative z-10 transition-colors duration-300 ${viewMode === 'booked' ? 'text-teal-700' : 'text-gray-500'}`}
                >
                    Rides I Booked
                </button>
                <button
                    onClick={() => setViewMode('driving')}
                    className={`flex-1 py-3 text-sm font-bold rounded-lg relative z-10 transition-colors duration-300 ${viewMode === 'driving' ? 'text-teal-700' : 'text-gray-500'}`}
                >
                    Driving
                </button>
            </div>

            {/* Ride Cards */}
            <div className="space-y-6">
                {myRides.length === 0 ? (
                    <div className="text-center py-16 text-gray-500">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Car className="w-8 h-8 text-gray-300" />
                        </div>
                        <p className="font-semibold text-gray-600">
                            {viewMode === 'booked' ? "You haven't booked any rides yet." : "You haven't posted any rides."}
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                            {viewMode === 'booked'
                                ? 'Find available rides on the home screen.'
                                : 'Share your empty seats and earn.'}
                        </p>
                        <button
                            onClick={() => navigate(viewMode === 'booked' ? '/' : '/offer')}
                            className="mt-6 bg-teal-600 text-white font-bold px-6 py-3 rounded-xl shadow-lg hover:bg-teal-700 transition-colors"
                        >
                            {viewMode === 'booked' ? 'Find a Ride' : 'Offer a Ride'}
                        </button>
                    </div>
                ) : viewMode === 'booked' ? (
                    myRides.map(ride => (
                        <BookedRideCard
                            key={ride.id}
                            ride={ride}
                            currentUser={currentUser}
                            driverDetails={driverDetails}
                            onTrack={setTrackingRide}
                            onCancelBooking={handleCancelBooking}
                        />
                    ))
                ) : (
                    myRides.map(ride => (
                        <DriverRideCard
                            key={ride.id}
                            ride={ride}
                            passengerDetails={passengerDetails}
                            onTrack={setTrackingRide}
                            onComplete={handleCompleteRide}
                            onCancel={handleCancelRide}
                            onRemovePassenger={handleRemovePassenger}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
