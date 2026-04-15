import { useState } from 'react';
import { X, Check, Banknote, Smartphone, Wallet, QrCode } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function PaymentModal({ ride, onClose }) {
    const { metroMiles } = useAuth();
    const [activeTab, setActiveTab] = useState('cash');
    const [isPaid, setIsPaid] = useState(false);

    // Mock data if ride is not fully populated
    const price = ride?.price || 150;
    const seats = ride?.seatsBooked || 1;
    const total = price * seats;

    const handlePayment = () => {
        setIsPaid(true);
        setTimeout(() => {
            onClose();
        }, 2000); // Close after 2 seconds
    };

    if (!ride) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 duration-300">

                {/* Header */}
                <div className="bg-[#008080] p-6 text-center text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                    <h2 className="text-2xl font-bold mb-1">Ride Completed! 🎉</h2>
                    <p className="text-teal-100 text-sm">Thank you for riding with Thrivetrip.</p>
                </div>

                {/* Bill Breakdown */}
                <div className="p-6">
                    <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100">
                        <div className="flex justify-between items-center text-gray-500 text-sm mb-2">
                            <span>Base Fare</span>
                            <span>₹{price} x {seats}</span>
                        </div>
                        <div className="flex justify-between items-center text-gray-500 text-sm mb-4 pb-4 border-b border-gray-200">
                            <span>Booking Fee</span>
                            <span>₹0</span>
                        </div>
                        <div className="flex justify-between items-center font-bold text-gray-900 text-lg">
                            <span>Total to Pay</span>
                            <span>₹{total}</span>
                        </div>
                    </div>

                    {/* Payment Tabs */}
                    <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
                        <button
                            onClick={() => setActiveTab('cash')}
                            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'cash' ? 'bg-white text-[#008080] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Cash
                        </button>
                        <button
                            onClick={() => setActiveTab('upi')}
                            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'upi' ? 'bg-white text-[#008080] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            UPI
                        </button>
                        <button
                            onClick={() => setActiveTab('miles')}
                            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'miles' ? 'bg-white text-[#008080] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Miles
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="mb-8 min-h-[120px] flex items-center justify-center">
                        {activeTab === 'cash' && (
                            <div className="text-center">
                                <div className="bg-teal-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 text-[#008080]">
                                    <Banknote className="w-8 h-8" />
                                </div>
                                <p className="text-gray-600 font-medium">Please hand over <span className="text-gray-900 font-bold">₹{total}</span> to the driver.</p>
                            </div>
                        )}

                        {activeTab === 'upi' && (
                            <div className="text-center w-full">
                                <div className="bg-white border-2 border-gray-200 w-32 h-32 mx-auto rounded-xl flex items-center justify-center mb-3 relative overflow-hidden group">
                                    <QrCode className="w-20 h-20 text-gray-800" />
                                    <div className="absolute inset-0 bg-black/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                        <span className="text-xs font-bold bg-white px-2 py-1 rounded shadow">Scan</span>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-500">Scan to pay directly to <span className="font-medium text-gray-900">Sarah Jenkins</span></p>
                            </div>
                        )}

                        {activeTab === 'miles' && (
                            <div className="text-center w-full">
                                <div className="bg-indigo-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 text-indigo-600">
                                    <Wallet className="w-8 h-8" />
                                </div>
                                <p className="text-sm text-gray-500 mb-3">Balance: <span className="font-bold text-gray-900">{metroMiles} Miles</span></p>
                                <button className="bg-indigo-600 text-white text-xs font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition">
                                    Pay with {total * 10} Miles
                                </button>
                                <p className="text-[10px] text-gray-400 mt-2">*Only if driver accepts barter</p>
                            </div>
                        )}
                    </div>

                    {/* Action Button */}
                    <button
                        onClick={handlePayment}
                        disabled={isPaid}
                        className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center transition-all ${isPaid ? 'bg-green-500 text-white' : 'bg-[#008080] text-white hover:bg-teal-700'}`}
                    >
                        {isPaid ? (
                            <>
                                <Check className="w-6 h-6 mr-2" /> Paid Successfully
                            </>
                        ) : (
                            "I have Paid"
                        )}
                    </button>

                </div>
            </div>
        </div>
    );
}
