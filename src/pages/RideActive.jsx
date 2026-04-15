import { useState, useRef, useEffect } from 'react';
import { Shield, AlertTriangle, Phone, MapPin, Navigation, ChevronRight, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, increment, arrayRemove } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import SmartSpotGuide from '../components/SmartSpotGuide';

export default function RideActive() {
    const navigate = useNavigate();
    const { rideId } = useParams();
    const { currentUser } = useAuth();
    const [isDeviated, setIsDeviated] = useState(false);
    const [status, setStatus] = useState('active'); // active, completed
    const [showPayment, setShowPayment] = useState(false);

    // Live Database State
    const [activeRide, setActiveRide] = useState(null);
    const [isDriver, setIsDriver] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [canceling, setCanceling] = useState(false);
    const previousPassengerCountRef = useRef(0);

    // Slider state
    const [sliderValue, setSliderValue] = useState(0);
    const sliderRef = useRef(null);

    const handleSimulateDeviation = () => {
        setIsDeviated(true);
        setTimeout(() => {
            alert("⚠️ DEVIATION DETECTED! \n\nSafety Protocols Initiated. \nSMS sent to Emergency Contacts: +91-98XXX...");
        }, 500);
    };

    const handleSliderChange = (e) => {
        setSliderValue(e.target.value);
        if (e.target.value > 95) {
            handleCompleteRide();
        }
    };

    const handleCompleteRide = () => {
        setStatus('completed');
        setSliderValue(100);
        setTimeout(() => {
            setShowPayment(true);
        }, 500);
    };

    const handlePaymentClose = () => {
        setShowPayment(false);
        navigate('/'); // Go home after payment
    };

    // Listen to live ride data
    useEffect(() => {
        if (!currentUser) return;

        let myRideRef;
        let unsubscribe;

        if (rideId) {
            // Listen to specific ride
            myRideRef = doc(db, "rides", rideId);
            unsubscribe = onSnapshot(myRideRef, (docSnapshot) => {
                if (docSnapshot.exists()) {
                    const rideData = { id: docSnapshot.id, ...docSnapshot.data() };
                    setActiveRide(rideData);
                    
                    const userIsDriver = rideData.driverId === currentUser.uid;
                    setIsDriver(userIsDriver);

                    // Auto-redirect passenger to payment if completed
                    if (!userIsDriver && rideData.status === 'completed') {
                        navigate('/payment/' + rideData.id);
                    }

                    // Driver notification logic
                    if (userIsDriver) {
                        const currentCount = rideData.passengers?.length || 0;
                        if (currentCount < previousPassengerCountRef.current) {
                            alert("Alert: A passenger has cancelled their booking.");
                        }
                        previousPassengerCountRef.current = currentCount;
                    }
                } else {
                    setActiveRide(null);
                }
            });
        } else {
             // Fallback: Find most recent ride user is involved in
             const q = query(collection(db, "rides"), orderBy("createdAt", "desc"));
             unsubscribe = onSnapshot(q, (snapshot) => {
                 const allRides = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                 const myRide = allRides.find(r =>
                     r.driverId === currentUser.uid ||
                     (r.passengers && r.passengers.includes(currentUser.uid))
                 );
 
                 if (myRide) {
                     setActiveRide(myRide);
                     const userIsDriver = myRide.driverId === currentUser.uid;
                     setIsDriver(userIsDriver);
 
                     if (!userIsDriver && myRide.status === 'completed') {
                         navigate('/payment/' + myRide.id);
                     }
 
                     if (userIsDriver) {
                         const currentCount = myRide.passengers?.length || 0;
                         if (currentCount < previousPassengerCountRef.current) {
                             alert("Alert: A passenger has cancelled their booking.");
                         }
                         previousPassengerCountRef.current = currentCount;
                     }
                 } else {
                     setActiveRide(null);
                 }
             });
        }

        return () => { if (unsubscribe) unsubscribe(); }
    }, [currentUser, rideId, navigate]);

    const handleCancelRide = async () => {
        if (!activeRide || isDriver) return;
        setCanceling(true);
        try {
            const rideRef = doc(db, "rides", activeRide.id);
            await updateDoc(rideRef, {
                passengers: arrayRemove(currentUser.uid),
                seats: increment(1)
            });
            setShowCancelModal(false);
            alert("Ride cancelled successfully.");
            navigate('/');
        } catch (error) {
            console.error("Error cancelling ride: ", error);
            alert("Could not cancel ride. Try again.");
        } finally {
            setCanceling(false);
        }
    };

    // If no ride is found yet
    if (!activeRide) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50 text-center">
                <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-500">Loading active ride details...</p>
                <button onClick={() => navigate('/')} className="mt-8 text-teal-600 font-bold">Go Back</button>
            </div>
        )
    }

    return (
        <div className={`min-h-screen flex flex-col items-center justify-between p-6 transition-colors duration-500 ${isDeviated ? 'bg-red-50' : 'bg-white'}`}>

            {showPayment && (
                <PaymentModal
                    ride={{ price: 120, seatsBooked: 2 }}
                    onClose={handlePaymentClose}
                />
            )}

            {showCancelModal && !isDriver && (
                <div className="fixed inset-0 z-[6000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-600 mx-auto mb-4">
                            <AlertTriangle className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-center text-gray-900 mb-2">Cancel Ride?</h3>
                        <p className="text-center text-gray-500 mb-6">Are you sure you want to cancel this ride? The driver will be notified.</p>

                        <div className="space-y-3">
                            <button
                                onClick={handleCancelRide}
                                disabled={canceling}
                                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl shadow-lg transition-colors disabled:opacity-50"
                            >
                                {canceling ? 'Cancelling...' : 'Yes, Cancel'}
                            </button>
                            <button
                                onClick={() => setShowCancelModal(false)}
                                disabled={canceling}
                                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-4 rounded-xl transition-colors"
                            >
                                Go Back
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Top Status Bar */}
            <div className="w-full flex justify-between items-center mt-8">
                <button onClick={() => navigate('/')} className="text-gray-500 font-medium">Close</button>
                <div className={`px-4 py-1.5 rounded-full flex items-center space-x-2 shadow-sm ${isDeviated ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-green-100 text-green-700 border border-green-200'}`}>
                    <div className={`w-2.5 h-2.5 rounded-full ${isDeviated ? 'bg-red-600 animate-bounce' : 'bg-green-600 animate-pulse'}`}></div>
                    <span className="text-xs font-bold uppercase tracking-wider">
                        {isDeviated ? 'Safe-Stream: Alert' : 'Safe-Stream: Active'}
                    </span>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm text-center space-y-8">

                {/* Visual Icon */}
                <div className={`relative flex items-center justify-center w-40 h-40 rounded-full transition-all duration-500 ${isDeviated ? 'bg-red-100' : 'bg-teal-50'}`}>
                    {isDeviated ? (
                        <AlertTriangle className="w-20 h-20 text-red-600 animate-pulse" />
                    ) : status === 'completed' ? (
                        <CheckCircle className="w-20 h-20 text-green-500" />
                    ) : (
                        <Shield className="w-20 h-20 text-[#008080]" />
                    )}

                    {/* Ripple Effect for Safe State */}
                    {!isDeviated && status !== 'completed' && (
                        <>
                            <div className="absolute inset-0 rounded-full border-2 border-[#008080]/20 animate-ping opacity-75"></div>
                            <div className="absolute inset-0 rounded-full border border-[#008080]/40 animate-pulse delay-75"></div>
                        </>
                    )}
                </div>

                <div>
                    <h2 className={`text-2xl font-bold mb-2 ${isDeviated ? 'text-red-700' : 'text-gray-900'}`}>
                        {isDeviated ? 'Route Deviation!' : status === 'completed' ? 'Arrived at Destination' : 'Ride in Progress'}
                    </h2>
                    <p className="text-gray-500">
                        {isDeviated
                            ? 'We have detected a significant detour. Emergency contacts are being notified.'
                            : status === 'completed'
                                ? 'Hope you had a great ride!'
                                : 'You are safe. We are monitoring your route in real-time.'}
                    </p>
                </div>

                {/* Smart-Spot AI Guide */}
                {!isDeviated && status !== 'completed' && (
                    <div className="w-full">
                        <SmartSpotGuide locationName="JNTU Metro Station" />
                    </div>
                )}

                {/* Ride Details Card */}
                <div className="w-full bg-white rounded-2xl shadow-lg border border-gray-100 p-4 text-left">
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-50">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center font-bold text-teal-700 uppercase">
                                {isDriver ? 'DR' : activeRide?.driverName?.substring(0, 2) || 'SJ'}
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">{isDriver ? 'You are Driving' : activeRide?.driverName || 'Driver'}</h3>
                                <p className="text-xs text-gray-500">{activeRide?.vehicleModel || 'Vehicle'} • {activeRide?.numberPlate || 'Plate'}</p>
                            </div>
                        </div>
                        <div className="bg-gray-100 p-2 rounded-full">
                            <Phone className="w-4 h-4 text-gray-600" />
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-start space-x-3">
                            <div className="mt-1"><Navigation className="w-4 h-4 text-[#008080]" /></div>
                            <div>
                                <p className="text-xs text-gray-400">{isDriver ? 'Driving to' : 'Heading to'}</p>
                                <p className="font-medium text-gray-800">{activeRide?.destination}</p>
                            </div>
                        </div>
                        {isDriver && (
                            <div className="mt-4 pt-4 border-t border-gray-50">
                                <h4 className="text-sm font-bold text-gray-700 mb-2">My Passengers</h4>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500">{activeRide?.passengers?.length || 0} Boarded</span>
                                    <span className="text-teal-600 font-medium">{activeRide?.seats} Seats Left</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* Actions */}
            <div className="w-full space-y-3 mb-6">
                {!isDeviated && status !== 'completed' && (
                    <>
                        {isDriver && (
                            <div className="relative w-full h-14 bg-gray-100 rounded-full overflow-hidden flex items-center shadow-inner">
                                <div
                                    className="absolute left-0 top-0 bottom-0 bg-[#008080]/20 transition-all"
                                    style={{ width: `${sliderValue}%` }}
                                ></div>
                                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-400 pointer-events-none uppercase tracking-widest">
                                    Swipe to Complete
                                </span>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={sliderValue}
                                    onChange={handleSliderChange}
                                    className="absolute inset-0 w-full opacity-0 cursor-pointer"
                                />
                                <div
                                    className="absolute left-1 top-1 bottom-1 w-12 bg-[#008080] rounded-full flex items-center justify-center shadow-md pointer-events-none transition-all"
                                    style={{ left: `calc(${sliderValue}% - ${sliderValue > 90 ? 48 : 0}px + 4px)` }}
                                >
                                    <ChevronRight className="w-6 h-6 text-white" />
                                </div>
                            </div>
                        )}

                        {!isDriver && (
                            <button
                                onClick={() => setShowCancelModal(true)}
                                className="w-full py-4 text-sm font-bold border-2 border-red-500 text-red-600 rounded-xl hover:bg-red-50 transition-colors flex items-center justify-center space-x-2"
                            >
                                <XCircle className="w-5 h-5" />
                                <span>Cancel Booking</span>
                            </button>
                        )}>
                    </>
                )}

                {isDeviated && (
                    <button
                        onClick={() => {
                            setIsDeviated(false);
                            alert("Safety alert resolved.");
                        }}
                        className="w-full bg-white border border-gray-200 text-gray-700 font-bold py-4 rounded-xl shadow-sm hover:bg-gray-50"
                    >
                        Mark Safe
                    </button>
                )}

                <button className={`w-full font-bold py-4 rounded-xl shadow-lg transition-colors text-white ${isDeviated ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-900 hover:bg-gray-800'}`}>
                    {isDeviated ? 'SOS - Call Police' : 'Share Live Location'}
                </button>
            </div>
        </div>
    );
}
