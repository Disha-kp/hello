import { useState, useEffect, useRef } from 'react';
import useVoiceAssistant from '../hooks/useVoiceAssistant';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, increment, arrayUnion, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function VoiceAssistant({ onCommand }) {
    const { isListening, transcript, speak, listen, stopListening, isSpeaking } = useVoiceAssistant();
    const [isActive, setIsActive] = useState(false);
    const [isWakeWordListening, setIsWakeWordListening] = useState(false);
    const wakeWordRecRef = useRef(null);
    const navigate = useNavigate();

    // Conversational State
    const [conversationStep, setConversationStep] = useState('idle');
    const [isProcessing, setIsProcessing] = useState(false);
    const [rides, setRides] = useState([]);
    const [history, setHistory] = useState([]);
    const { currentUser } = useAuth();
    const [selectedRideId, setSelectedRideId] = useState(null);
    const [pendingRide, setPendingRide] = useState({ origin: '', destination: '', date: '', time: '', price: '', seats: '', vehicleType: '', vehicleModel: '' });

    // Fetch live rides for the assistant to search
    useEffect(() => {
        const q = query(collection(db, "rides"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const ridesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setRides(ridesData);
        });
        return () => unsubscribe();
    }, []);

    const handleBookRide = async (rideId) => {
        if (!currentUser) {
            speak("Please log in to book a ride.");
            return false;
        }
        try {
            const rideRef = doc(db, "rides", rideId);
            await updateDoc(rideRef, {
                seats: increment(-1),
                passengers: arrayUnion(currentUser.uid)
            });
            return true;
        } catch (error) {
            console.error(error);
            return false;
        }
    };

    // Initial Greeting
    const handleStart = () => {
        if (isActive) return;

        if (navigator.vibrate) {
            navigator.vibrate([200]);
        }

        setIsActive(true);
        setIsActive(true);
        setConversationStep('main_menu');
        const welcomeText = "Hello! I am your Thrivetrip Car Assistant. Say 1 to Book a ride. Say 2 to Create a ride.";
        window.speechSynthesis.cancel();
        speak(welcomeText);
    };

    // Global Double-Tap Listener
    useEffect(() => {
        const handleDoubleTap = () => {
            handleStart();
        };
        window.addEventListener('dblclick', handleDoubleTap);
        return () => window.removeEventListener('dblclick', handleDoubleTap);
    }, [isActive]);

    // Wake Word listener initialization
    useEffect(() => {
        const wakeWordEnabled = localStorage.getItem('wakeWordEnabled') === 'true';
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (wakeWordEnabled && SpeechRecognition && !isActive && !isListening) {
            const wakeRec = new SpeechRecognition();
            wakeRec.continuous = true;
            wakeRec.interimResults = false;
            wakeRec.lang = 'en-US';

            wakeRec.onstart = () => setIsWakeWordListening(true);

            wakeRec.onresult = (event) => {
                const results = event.results;
                const latestTranscript = results[results.length - 1][0].transcript.toLowerCase();

                console.log("Heard:", latestTranscript);

                const wakeWords = ['hey car', 'hi car', 'hello car', 'okay car', 'ok car', 'car'];

                if (wakeWords.some(word => latestTranscript.includes(word))) {
                    // Play ding
                    playDing();
                    wakeRec.stop();
                    handleStart();
                }
            };

            wakeRec.onend = () => {
                setIsWakeWordListening(false);
                // Restart if still enabled and we aren't actively in a voice flow
                if (localStorage.getItem('wakeWordEnabled') === 'true' && !isActive) {
                    try { wakeRec.start(); } catch (e) { }
                }
            };

            wakeWordRecRef.current = wakeRec;
            try { wakeRec.start(); } catch (e) { }
        }

        return () => {
            if (wakeWordRecRef.current) {
                wakeWordRecRef.current.onend = null;
                wakeWordRecRef.current.stop();
            }
        };
    }, [isActive, isListening]);

    // helper for ding
    const playDing = () => {
        try {
            const context = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = context.createOscillator();
            const gainNode = context.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(context.destination);
            oscillator.type = 'sine';
            oscillator.frequency.value = 880; // A5
            gainNode.gain.setValueAtTime(0, context.currentTime);
            gainNode.gain.linearRampToValueAtTime(1, context.currentTime + 0.05);
            gainNode.gain.linearRampToValueAtTime(0, context.currentTime + 0.5);
            oscillator.start(context.currentTime);
            oscillator.stop(context.currentTime + 0.5);
        } catch (e) { console.error('AudioContext failed:', e); }
    };

    // Handle Transcript
    useEffect(() => {
        if (transcript) {
            setIsProcessing(true);
            const userText = transcript.toLowerCase();
            console.log("User said:", userText);

            setHistory(prev => [...prev, { sender: 'User', text: transcript }]);

            try {
                if (conversationStep === 'main_menu') {
                    if (['1', 'one'].some(word => userText.includes(word))) {
                        setConversationStep('booking_destination');
                        const aiText = "Booking a ride. Please say your destination.";
                        setHistory(prev => [...prev, { sender: 'AI', text: aiText }]);
                        window.speechSynthesis.cancel();
                        speak(aiText);
                    } else if (['2', 'two', 'too', 'to'].some(word => userText.includes(word))) {
                        setConversationStep('offering_origin');
                        const aiText = "Creating a ride. Where are you starting from?";
                        setHistory(prev => [...prev, { sender: 'AI', text: aiText }]);
                        window.speechSynthesis.cancel();
                        speak(aiText);
                    } else {
                        const aiText = "Sorry, I didn't get that. Please say 1 for booking, or 2 for creating.";
                        setHistory(prev => [...prev, { sender: 'AI', text: aiText }]);
                        window.speechSynthesis.cancel();
                        speak(aiText);
                    }
                } else if (conversationStep === 'booking_destination') {
                    const results = rides.filter(ride =>
                        ride.destination?.toLowerCase().includes(userText) ||
                        ride.origin?.toLowerCase().includes(userText)
                    );

                    if (results.length > 0) {
                        const ride = results[0];
                        setSelectedRideId(ride.id);
                        setConversationStep('booking_confirm');
                        const aiText = `I found a ride to ${ride.destination}. Say 1 to Confirm and Book. Say 2 to Cancel.`;
                        setHistory(prev => [...prev, { sender: 'AI', text: aiText }]);
                        window.speechSynthesis.cancel();
                        speak(aiText);
                    } else {
                        const aiText = `No rides found to ${userText}. Say your destination again.`;
                        setHistory(prev => [...prev, { sender: 'AI', text: aiText }]);
                        window.speechSynthesis.cancel();
                        speak(aiText);
                    }
                } else if (conversationStep === 'booking_confirm') {
                    if (['1', 'one'].some(word => userText.includes(word))) {
                        handleBookRide(selectedRideId).then(success => {
                            if (success) {
                                const aiText = "Ride booked successfully.";
                                setHistory(prev => [...prev, { sender: 'AI', text: aiText }]);
                                window.speechSynthesis.cancel();
                                speak(aiText);
                            } else {
                                const aiText = "Sorry, there was an error booking the ride.";
                                setHistory(prev => [...prev, { sender: 'AI', text: aiText }]);
                                window.speechSynthesis.cancel();
                                speak(aiText);
                            }
                            setConversationStep('idle');
                            setTimeout(() => {
                                setIsActive(false);
                                if (success) navigate('/active-ride/' + selectedRideId);
                            }, 3000);
                        });
                    } else if (['2', 'two', 'too', 'to'].some(word => userText.includes(word))) {
                        const aiText = "Booking cancelled.";
                        setHistory(prev => [...prev, { sender: 'AI', text: aiText }]);
                        window.speechSynthesis.cancel();
                        speak(aiText);
                        setConversationStep('idle');
                        setTimeout(() => setIsActive(false), 3000);
                    } else {
                        const aiText = "I didn't catch that. Say 1 to Confirm and Book. Say 2 to Cancel.";
                        setHistory(prev => [...prev, { sender: 'AI', text: aiText }]);
                        window.speechSynthesis.cancel();
                        speak(aiText);
                    }
                } else if (conversationStep === 'offering_origin') {
                    setPendingRide(prev => ({ ...prev, origin: transcript }));
                    setConversationStep('offering_destination');
                    const aiText = "Got it. What is your destination?";
                    setHistory(prev => [...prev, { sender: 'AI', text: aiText }]);
                    window.speechSynthesis.cancel();
                    speak(aiText);
                } else if (conversationStep === 'offering_destination') {
                    setPendingRide(prev => ({ ...prev, destination: transcript }));
                    setConversationStep('offering_date');
                    const aiText = "What date are you travelling? You can say 'Today', 'Tomorrow', or a specific date.";
                    setHistory(prev => [...prev, { sender: 'AI', text: aiText }]);
                    window.speechSynthesis.cancel();
                    speak(aiText);
                } else if (conversationStep === 'offering_date') {
                    setPendingRide(prev => ({ ...prev, date: transcript }));
                    setConversationStep('offering_time');
                    const aiText = "At what time?";
                    setHistory(prev => [...prev, { sender: 'AI', text: aiText }]);
                    window.speechSynthesis.cancel();
                    speak(aiText);
                } else if (conversationStep === 'offering_time') {
                    setPendingRide(prev => ({ ...prev, time: transcript }));
                    setConversationStep('offering_price');
                    const aiText = "How much will you charge per seat in rupees?";
                    setHistory(prev => [...prev, { sender: 'AI', text: aiText }]);
                    window.speechSynthesis.cancel();
                    speak(aiText);
                } else if (conversationStep === 'offering_price') {
                    const match = transcript.match(/\d+/);
                    const price = match ? parseInt(match[0], 10) : 100; // default 100 if missing
                    setPendingRide(prev => ({ ...prev, price }));
                    setConversationStep('offering_seats');
                    const aiText = "How many seats are available? The maximum is 6.";
                    setHistory(prev => [...prev, { sender: 'AI', text: aiText }]);
                    window.speechSynthesis.cancel();
                    speak(aiText);
                    setTimeout(() => listen(), 4000);
                } else if (conversationStep === 'offering_seats') {
                    const match = transcript.match(/\d+/);
                    const seats = match ? parseInt(match[0], 10) : 3;

                    if (seats > 6) {
                        const aiText = "The maximum seats allowed is 6. Please say a valid number.";
                        setHistory(prev => [...prev, { sender: 'AI', text: aiText }]);
                        window.speechSynthesis.cancel();
                        speak(aiText);
                    } else {
                        setPendingRide(prev => ({ ...prev, seats }));
                        setConversationStep('offering_vehicle_type');
                        const aiText = "Will you be driving a Car or a Bike? Say 1 for Car, or 2 for Bike.";
                        setHistory(prev => [...prev, { sender: 'AI', text: aiText }]);
                        window.speechSynthesis.cancel();
                        speak(aiText);
                    }
                } else if (conversationStep === 'offering_vehicle_type') {
                    if (['1', 'one'].some(word => userText.includes(word))) {
                        setPendingRide(prev => ({ ...prev, vehicleType: 'Car' }));
                    } else if (['2', 'two', 'too', 'to'].some(word => userText.includes(word))) {
                        setPendingRide(prev => ({ ...prev, vehicleType: 'Bike', seats: 1 }));
                    } else {
                        setPendingRide(prev => ({ ...prev, vehicleType: 'Car' })); // Default fallback
                    }

                    setConversationStep('offering_vehicle_model');
                    const aiText = "Please say your vehicle model and number plate. For example, 'Swift TS 08 AB 1234'.";
                    setHistory(prev => [...prev, { sender: 'AI', text: aiText }]);
                    window.speechSynthesis.cancel();
                    speak(aiText);
                } else if (conversationStep === 'offering_vehicle_model') {
                    setPendingRide(prev => ({ ...prev, vehicleModel: transcript }));
                    setConversationStep('offering_confirm');
                    const aiText = `Let's confirm. You are driving a ${pendingRide.vehicleType} from ${pendingRide.origin} to ${pendingRide.destination} with ${pendingRide.seats} seats. Say 1 to Confirm and Post. Say 2 to Cancel.`;
                    setHistory(prev => [...prev, { sender: 'AI', text: aiText }]);
                    window.speechSynthesis.cancel();
                    speak(aiText);
                } else if (conversationStep === 'offering_confirm') {
                    if (['1', 'one'].some(word => userText.includes(word))) {
                        if (!currentUser) {
                            const aiText = "You must be logged in to post a ride.";
                            setHistory(prev => [...prev, { sender: 'AI', text: aiText }]);
                            window.speechSynthesis.cancel();
                            speak(aiText);
                            setConversationStep('idle');
                            return;
                        }

                        // Parse out potential license plate from vehicleModel string
                        const words = pendingRide.vehicleModel.split(' ');
                        const maybePlate = words.length > 1 ? words.slice(-2).join(' ').toUpperCase() : 'UNKNOWN';
                        const maybeModel = words.length > 2 ? words.slice(0, -2).join(' ') : words[0];

                        addDoc(collection(db, "rides"), {
                            driverId: currentUser.uid,
                            driverName: currentUser.displayName || "Driver",
                            origin: pendingRide.origin,
                            destination: pendingRide.destination,
                            date: pendingRide.date,
                            time: pendingRide.time,
                            price: pendingRide.price,
                            seats: pendingRide.seats,
                            vehicleType: pendingRide.vehicleType,
                            vehicleModel: maybeModel,
                            numberPlate: maybePlate,
                            passengers: [],
                            createdAt: serverTimestamp(),
                            vehicleColor: "Unknown"
                        }).then(() => {
                            const aiText = "Ride successfully posted.";
                            setHistory(prev => [...prev, { sender: 'AI', text: aiText }]);
                            window.speechSynthesis.cancel();
                            speak(aiText);
                            setConversationStep('idle');
                            setPendingRide({ origin: '', destination: '', date: '', time: '', price: '', seats: '', vehicleType: '', vehicleModel: '' });
                            setTimeout(() => setIsActive(false), 3000);
                        });
                    } else if (['2', 'two', 'too', 'to'].some(word => userText.includes(word))) {
                        const aiText = "Ride creation cancelled.";
                        setHistory(prev => [...prev, { sender: 'AI', text: aiText }]);
                        window.speechSynthesis.cancel();
                        speak(aiText);
                        setConversationStep('idle');
                        setPendingRide({ origin: '', destination: '', date: '', time: '', price: '', seats: '', vehicleType: '', vehicleModel: '' });
                        setTimeout(() => setIsActive(false), 3000);
                    } else {
                        const aiText = "I didn't quite catch that. Say 1 to Confirm and Post. Say 2 to Cancel.";
                        setHistory(prev => [...prev, { sender: 'AI', text: aiText }]);
                        window.speechSynthesis.cancel();
                        speak(aiText);
                    }
                } else {
                    if (onCommand) {
                        onCommand(transcript.toLowerCase(), speak);
                    }
                    window.dispatchEvent(new CustomEvent('voice-command', {
                        detail: { command: userText, speak }
                    }));
                }
            } finally {
                setIsProcessing(false);
            }
        }
    }, [transcript]);

    if (!isActive) {
        return (
            <button
                role="button"
                onClick={handleStart}
                className="fixed bottom-24 right-4 bg-yellow-400 hover:bg-yellow-500 text-black p-4 rounded-full shadow-2xl z-[1000] border-4 border-black transition-transform hover:scale-110 flex items-center justify-center group"
                aria-label="Activate Voice Booking Assistant"
            >
                {isWakeWordListening && (
                    <div className="absolute top-0 right-0 w-4 h-4 rounded-full bg-red-500 animate-pulse border-2 border-black" title="Wake Word Active"></div>
                )}
                <div className="absolute -top-12 right-0 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    Blind Mode / Voice Assist
                </div>
                <Mic className="w-8 h-8" />
            </button>
        );
    }

    return (
        <div className="fixed bottom-24 right-4 z-[1000] flex flex-col items-end space-y-2">

            {/* Conversation Overlay */}
            <div className="bg-black/90 backdrop-blur-md p-4 rounded-2xl rounded-br-none shadow-2xl w-80 max-h-96 overflow-y-auto border-2 border-yellow-400 flex flex-col space-y-3 animate-in slide-in-from-bottom-5">
                <div className="sticky top-0 bg-transparent pb-2 border-b border-yellow-400/30">
                    <p className="font-bold text-lg text-yellow-400 flex items-center">
                        {isSpeaking ? "🗣 Speaking..." : isProcessing ? "🤖 Processing..." : isListening ? "👂 Listening..." : "🤖 Idle"}
                    </p>
                </div>

                <div className="flex-1 space-y-3 pt-2">
                    {history.map((msg, idx) => (
                        <div key={idx} className={`flex flex-col ${msg.sender === 'User' ? 'items-end' : 'items-start'}`}>
                            <span className={`text-[10px] font-bold uppercase mb-1 ${msg.sender === 'User' ? 'text-gray-400' : 'text-yellow-400'}`}>
                                {msg.sender}
                            </span>
                            <div className={`p-2 rounded-xl max-w-[90%] text-sm ${msg.sender === 'User' ? 'bg-gray-800 text-white rounded-tr-none' : 'bg-yellow-400 text-black rounded-tl-none font-medium'}`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    {isListening && !transcript && (
                        <div className="flex items-end">
                            <div className="p-2 bg-gray-800 text-gray-400 rounded-xl rounded-tr-none text-sm animate-pulse">
                                ...
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Controls */}
            <div className="flex space-x-2">
                <button
                    onClick={() => setIsActive(false)}
                    className="bg-gray-800 text-white p-3 rounded-full shadow-lg border border-gray-600"
                >
                    <MicOff className="w-6 h-6" />
                </button>
                <button
                    onClick={isListening ? stopListening : listen}
                    className={`p-4 rounded-full shadow-xl border-4 border-black transition-all ${isListening
                        ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                        : 'bg-yellow-400 hover:bg-yellow-500'
                        }`}
                >
                    {isListening ? <Volume2 className="w-8 h-8 text-white" /> : <Mic className="w-8 h-8 text-black" />}
                </button>
            </div>
        </div>
    );
}
