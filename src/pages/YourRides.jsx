import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, increment, arrayRemove, getDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { Car, User, Navigation, XCircle, ShieldAlert, Map as MapIcon } from 'lucide-react';
import RouteMapModal from '../components/RouteMapModal';
import { useRideTracking } from '../hooks/useRideTracking';

// Inner component so we can call the hook per-ride (hook needs stable rideId)
function RideTrackingModal({ ride, isDriver, currentUser, onClose }) {
    const { driverLocation, passengerPickups, startBroadcast, stopBroadcast } = useRideTracking(
        ride.id, currentUser, isDriver
    );

    // Driver starts broadcasting as soon as they open this modal
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

export default function YourRides() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState('driving');
    const [myRides, setMyRides] = useState([]);
    const [passengerDetails, setPassengerDetails] = useState({});
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

            <div className="flex items-center space-x-4 mb-6">
                <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-50">
                    <XCircle className="w-6 h-6 text-gray-500" />
                </button>
                <h1 className="text-2xl font-black text-gray-800 tracking-tight">Manage Rides</h1>
            </div>

            {/* Toggle */}
            <div className="bg-gray-100 p-1 rounded-xl flex relative mb-6">
                <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-lg shadow-sm transition-all duration-300 ${viewMode === 'driving' ? 'left-[calc(50%+2px)]' : 'left-1'}`} />
                <button onClick={() => setViewMode('booked')} className={`flex-1 py-3 text-sm font-bold rounded-lg relative z-10 transition-colors duration-300 ${viewMode === 'booked' ? 'text-teal-700' : 'text-gray-500'}`}>Rides I Booked</button>
                <button onClick={() => setViewMode('driving')} className={`flex-1 py-3 text-sm font-bold rounded-lg relative z-10 transition-colors duration-300 ${viewMode === 'driving' ? 'text-teal-700' : 'text-gray-500'}`}>Rides I'm Driving</button>
            </div>

            <div className="space-y-6">
                {myRides.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <Car className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>No active rides found in this category.</p>
                    </div>
                ) : myRides.map(ride => (
                    <div key={ride.id} className="bg-white rounded-3xl p-5 shadow-xl border border-gray-100 animate-in fade-in slide-in-from-bottom-4">

                        {/* Header */}
                        <div className="flex justify-between items-start mb-4 border-b border-gray-50 pb-4">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold uppercase">
                                    {viewMode === 'driving' ? 'ME' : ride.driverName?.substring(0, 2) || 'DR'}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">{viewMode === 'driving' ? 'Your Ride' : ride.driverName}</p>
                                    <p className="text-xs text-gray-500 flex items-center mt-1">
                                        <Navigation className="w-3 h-3 mr-1" />{ride.price}₹
                                        {viewMode === 'driving' && <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 rounded-full">{ride.seats} Seats Left</span>}
                                    </p>
                                </div>
                            </div>
                            {viewMode === 'driving' && (
                                <div className="text-right">
                                    <span className="text-xs font-bold uppercase text-gray-400">Earnings</span>
                                    <p className="text-lg font-black text-teal-600">₹{(ride.passengers?.length || 0) * ride.price}</p>
                                </div>
                            )}
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

                        {/* Passengers (driver only) */}
                        {viewMode === 'driving' && (
                            <div className="bg-gray-50 rounded-2xl p-4 mb-4 border border-gray-100">
                                <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center"><User className="w-4 h-4 mr-2" /> Passengers ({ride.passengers?.length || 0})</h4>
                                {(!ride.passengers || ride.passengers.length === 0) ? (
                                    <p className="text-xs text-gray-500 italic">No passengers booked yet.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {ride.passengers.map(uid => (
                                            <div key={uid} className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-8 h-8 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center text-xs font-bold uppercase">
                                                        {passengerDetails[uid]?.displayName?.substring(0, 2) || 'PS'}
                                                    </div>
                                                    <span className="text-sm font-bold text-gray-800">{passengerDetails[uid]?.displayName || 'Loading...'}</span>
                                                </div>
                                                <button onClick={() => handleRemovePassenger(ride.id, uid)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors">
                                                    <XCircle className="w-5 h-5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Actions */}
                        <div className="pt-2 space-y-2">
                            {/* Track / Live Map button — available to both driver and rider */}
                            <button
                                onClick={() => setTrackingRide(ride)}
                                className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl flex items-center justify-center space-x-2 shadow-lg transition-colors"
                            >
                                <MapIcon className="w-4 h-4" />
                                <span>{viewMode === 'driving' ? 'Start & Track Ride (Live)' : 'Track Ride (Live Map)'}</span>
                            </button>

                            {viewMode === 'driving' ? (
                                <div className="flex space-x-3">
                                    <button onClick={() => handleCompleteRide(ride.id)} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl flex items-center justify-center transition-colors">
                                        Complete Ride
                                    </button>
                                    <button onClick={() => handleCancelRide(ride.id)} className="py-3 px-4 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl flex items-center justify-center transition-colors border border-red-100">
                                        <ShieldAlert className="w-5 h-5" />
                                    </button>
                                </div>
                            ) : (
                                <button onClick={() => handleCancelBooking(ride.id)} className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl flex items-center justify-center transition-colors border border-red-100">
                                    <XCircle className="w-4 h-4 mr-2" /> Cancel Booking
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
