import { useState, useEffect } from 'react';
import {
    Check,
    Banknote,
    Smartphone,
    Wallet,
    Star,
    User,
    CheckCircle
} from 'lucide-react';

export default function DriverPaymentCollection({ ride, onComplete }) {
    // Mock passengers data
    const [passengers, setPassengers] = useState([
        { id: 1, name: "Alice M.", amount: 40, method: 'cash', status: 'pending' },
        { id: 2, name: "Bob D.", amount: 40, method: 'upi', status: 'pending' },
        { id: 3, name: "Charlie", amount: 50, method: 'miles', status: 'paid' } // Auto-confirmed
    ]);

    const allPaid = passengers.every(p => p.status === 'paid');

    const handleConfirmPayment = (id) => {
        setPassengers(prev => prev.map(p =>
            p.id === id ? { ...p, status: 'paid' } : p
        ));
    };

    const getMethodIcon = (method) => {
        switch (method) {
            case 'cash': return <Banknote className="w-4 h-4 text-green-600" />;
            case 'upi': return <Smartphone className="w-4 h-4 text-blue-600" />;
            case 'miles': return <Wallet className="w-4 h-4 text-indigo-600" />;
            default: return <Banknote className="w-4 h-4" />;
        }
    };

    const getMethodLabel = (method) => {
        switch (method) {
            case 'cash': return 'Cash';
            case 'upi': return 'UPI';
            case 'miles': return 'Miles';
            default: return 'Cash';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 duration-300">

                {/* Header */}
                <div className="bg-[#008080] p-6 text-white">
                    <h2 className="text-xl font-bold mb-1">Collect Payments</h2>
                    <p className="text-teal-100 text-sm">Confirm payments from your passengers.</p>
                </div>

                {/* Passenger List */}
                <div className="p-6 space-y-4">
                    {passengers.map((passenger) => (
                        <div
                            key={passenger.id}
                            className={`flex items-center justify-between p-4 rounded-xl border transition-all ${passenger.status === 'paid' ? 'bg-green-50 border-green-100' : 'bg-white border-gray-100 shadow-sm'}`}
                        >
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold">
                                    {passenger.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">{passenger.name}</h3>
                                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                                        <div className="flex items-center space-x-1 bg-gray-100 px-2 py-0.5 rounded">
                                            {getMethodIcon(passenger.method)}
                                            <span>{getMethodLabel(passenger.method)}</span>
                                        </div>
                                        {passenger.method === 'miles' && <span className="text-indigo-600 font-medium">Auto-Paid</span>}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3">
                                <span className="font-bold text-gray-900">₹{passenger.amount}</span>
                                {passenger.status === 'paid' ? (
                                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                                        <CheckCircle className="w-5 h-5" />
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => handleConfirmPayment(passenger.id)}
                                        className="bg-[#008080] text-white text-xs font-bold py-2 px-3 rounded-lg hover:bg-teal-700 transition"
                                    >
                                        Confirm
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer / Actions */}
                <div className="p-6 pt-0">
                    <button
                        disabled={!allPaid}
                        className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center transition-all ${allPaid ? 'bg-[#008080] text-white hover:bg-teal-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                        onClick={onComplete}
                    >
                        <Star className="w-5 h-5 mr-2" />
                        Rate Passengers
                    </button>
                    {!allPaid && (
                        <p className="text-center text-xs text-gray-400 mt-3">
                            Please confirm all payments to proceed.
                        </p>
                    )}
                </div>

            </div>
        </div>
    );
}
