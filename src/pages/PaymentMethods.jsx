import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, Wallet, CreditCard, Banknote, ChevronRight } from 'lucide-react';

export default function PaymentMethods() {
    const { rideId } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    const [ride, setRide] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [selectedMethod, setSelectedMethod] = useState(null);

    useEffect(() => {
        const fetchRide = async () => {
            if (!rideId) {
                setLoading(false);
                return;
            }
            try {
                const docRef = doc(db, 'rides', rideId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setRide({ id: docSnap.id, ...docSnap.data() });
                }
            } catch (error) {
                console.error("Error fetching ride details:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchRide();
    }, [rideId]);

    const handlePayment = async () => {
        if (!selectedMethod) {
            alert("Please select a payment method.");
            return;
        }
        setProcessing(true);
        // Simulate payment processing delay
        setTimeout(async () => {
            try {
                if (rideId && currentUser) {
                    // In a real app, update payment status here.
                    // For now, we just mark it done for the UI flow and return home.
                    alert(`Payment of ₹${ride?.price || 0} via ${selectedMethod} successful!`);
                }
                navigate('/');
            } catch (error) {
                console.error("Payment error:", error);
                alert("Payment failed. Please try again.");
            } finally {
                setProcessing(false);
            }
        }, 1500);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    // Default fare if accessed without a specific ride context
    const fare = ride?.price || 0;

    return (
        <div className="min-h-screen bg-gray-50 p-6 flex flex-col pt-12">
            <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-4">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-lg">
                    <CheckCircle className="w-10 h-10 text-green-500" />
                </div>
                <h1 className="text-3xl font-black text-gray-900 mb-2">Ride Completed!</h1>
                <p className="text-gray-500">How would you like to pay?</p>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 mb-8 animate-in fade-in slide-in-from-bottom-4 delay-100">
                <p className="text-center text-gray-500 text-sm font-bold uppercase tracking-wider mb-2">Total Fare</p>
                <p className="text-center text-5xl font-black text-teal-600 mb-6">₹{fare}</p>

                <div className="space-y-4">
                    <button
                        onClick={() => setSelectedMethod('UPI')}
                        className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${selectedMethod === 'UPI' ? 'border-teal-500 bg-teal-50' : 'border-gray-100 hover:border-teal-200'}`}
                    >
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                <CreditCard className="w-6 h-6" />
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-gray-900">UPI / QR Code</p>
                                <p className="text-xs text-gray-500">Google Pay, PhonePe, Paytm</p>
                            </div>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedMethod === 'UPI' ? 'border-teal-500 bg-teal-500' : 'border-gray-300'}`}>
                            {selectedMethod === 'UPI' && <div className="w-2.5 h-2.5 bg-white rounded-full"></div>}
                        </div>
                    </button>

                    <button
                        onClick={() => setSelectedMethod('Cash')}
                        className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${selectedMethod === 'Cash' ? 'border-teal-500 bg-teal-50' : 'border-gray-100 hover:border-teal-200'}`}
                    >
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                <Banknote className="w-6 h-6" />
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-gray-900">Cash</p>
                                <p className="text-xs text-gray-500">Pay driver directly</p>
                            </div>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedMethod === 'Cash' ? 'border-teal-500 bg-teal-500' : 'border-gray-300'}`}>
                            {selectedMethod === 'Cash' && <div className="w-2.5 h-2.5 bg-white rounded-full"></div>}
                        </div>
                    </button>

                    <button
                        onClick={() => setSelectedMethod('MetroMiles')}
                        className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${selectedMethod === 'MetroMiles' ? 'border-teal-500 bg-teal-50' : 'border-gray-100 hover:border-teal-200'}`}
                    >
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                                <Wallet className="w-6 h-6" />
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-gray-900">MetroMiles Balance</p>
                                <p className="text-xs text-gray-500">Available: ₹540</p>
                            </div>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedMethod === 'MetroMiles' ? 'border-teal-500 bg-teal-500' : 'border-gray-300'}`}>
                            {selectedMethod === 'MetroMiles' && <div className="w-2.5 h-2.5 bg-white rounded-full"></div>}
                        </div>
                    </button>
                </div>
            </div>

            <button
                onClick={handlePayment}
                disabled={!selectedMethod || processing}
                className="w-full mt-auto mb-8 py-5 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-black text-lg rounded-2xl shadow-xl hover:shadow-2xl transition-all flex items-center justify-center"
            >
                {processing ? (
                    <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                    <>
                        Confirm Payment <ChevronRight className="w-6 h-6 ml-2" />
                    </>
                )}
            </button>
        </div>
    );
}
