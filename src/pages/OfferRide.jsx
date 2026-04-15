import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { PlusCircle, MapPin, Calendar, Clock, DollarSign, Users, Car } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function OfferRide() {
    const { currentUser } = useAuth();
    const { isHighContrast } = useAccessibility();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        origin: '',
        destination: '',
        date: '',
        time: '',
        price: '',
        seats: 3,
        vehicleType: 'Car',
        vehicleModel: '',
        numberPlate: '',
        vehicleColor: ''
    });

    const handleChange = (e) => {
        let value = e.target.value;
        if (e.target.name === 'numberPlate') {
            value = value.toUpperCase();
        }
        setFormData({ ...formData, [e.target.name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await addDoc(collection(db, "rides"), {
                driverId: currentUser.uid,
                driverName: currentUser.displayName || currentUser.email.split('@')[0],
                origin: formData.origin,
                destination: formData.destination,
                date: formData.date,
                time: formData.time,
                price: Number(formData.price),
                seats: Number(formData.seats),
                vehicleType: 'Car',
                vehicleModel: formData.vehicleModel,
                numberPlate: formData.numberPlate,
                vehicleColor: formData.vehicleColor,
                passengers: [],
                createdAt: serverTimestamp()
            });

            alert("Ride Offered Successfully!");
            navigate('/');
        } catch (error) {
            console.error("Error adding ride: ", error);
            alert("Error offering ride: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 pb-24">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <PlusCircle className="w-6 h-6 mr-2 text-[#008080]" />
                Offer a Ride
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Origin */}
                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700 flex items-center">
                        <MapPin className="w-4 h-4 mr-1" /> Origin
                    </label>
                    <input
                        type="text"
                        name="origin"
                        required
                        placeholder="e.g. My Home"
                        value={formData.origin}
                        onChange={handleChange}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-[#008080] focus:border-[#008080] outline-none"
                    />
                </div>

                {/* Destination */}
                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700 flex items-center">
                        <MapPin className="w-4 h-4 mr-1 text-[#008080]" /> Destination
                    </label>
                    <input
                        type="text"
                        name="destination"
                        required
                        placeholder="e.g. Office, Mall, etc."
                        value={formData.destination}
                        onChange={handleChange}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-[#008080] focus:border-[#008080] outline-none"
                    />
                </div>

                {/* Date & Time */}
                <div className="flex space-x-4">
                    <div className="flex-1 space-y-1">
                        <label className="text-sm font-medium text-gray-700 flex items-center">
                            <Calendar className="w-4 h-4 mr-1" /> Date
                        </label>
                        <input
                            type="date"
                            name="date"
                            required
                            value={formData.date}
                            onChange={handleChange}
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-[#008080] focus:border-[#008080] outline-none"
                        />
                    </div>
                    <div className="flex-1 space-y-1">
                        <label className="text-sm font-medium text-gray-700 flex items-center">
                            <Clock className="w-4 h-4 mr-1" /> Time
                        </label>
                        <input
                            type="time"
                            name="time"
                            required
                            value={formData.time}
                            onChange={handleChange}
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-[#008080] focus:border-[#008080] outline-none"
                        />
                    </div>
                </div>

                {/* Price & Seats */}
                <div className="flex space-x-4">
                    <div className="flex-1 space-y-1">
                        <label className="text-sm font-medium text-gray-700 flex items-center">
                            <DollarSign className="w-4 h-4 mr-1" /> Price (₹)
                        </label>
                        <input
                            type="number"
                            name="price"
                            required
                            min="0"
                            placeholder="50"
                            value={formData.price}
                            onChange={handleChange}
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-[#008080] focus:border-[#008080] outline-none"
                        />
                    </div>
                    <div className="flex-1 space-y-1">
                        <label className="text-sm font-medium text-gray-700 flex items-center">
                            <Users className="w-4 h-4 mr-1" /> Seats
                        </label>
                        <input
                            type="number"
                            name="seats"
                            required
                            min="1"
                            max="6"
                            value={formData.seats}
                            onChange={handleChange}
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-[#008080] focus:border-[#008080] outline-none"
                        />
                    </div>
                </div>

                {/* Vehicle Details Section */}
                <div className="pt-4 border-t border-gray-200 mt-6 space-y-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Vehicle Details</h3>

                    {/* Car indicator (no toggle needed - car only) */}
                    <div className="flex items-center space-x-3 bg-teal-50 border border-teal-100 rounded-xl px-4 py-3">
                        <Car className="w-5 h-5 text-[#008080]" />
                        <span className="font-semibold text-teal-800 text-sm">Car</span>
                    </div>

                    <div className="flex space-x-4 items-start">
                        <div className="flex-1 space-y-4">
                            {/* Model Input */}
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">Vehicle Model</label>
                                <input
                                    type="text"
                                    name="vehicleModel"
                                    required
                                    placeholder="e.g., Swift, Nexon, Creta"
                                    value={formData.vehicleModel}
                                    onChange={handleChange}
                                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-[#008080] focus:border-[#008080] outline-none"
                                />
                            </div>

                            {/* Number Plate Input */}
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">Number Plate</label>
                                <input
                                    type="text"
                                    name="numberPlate"
                                    required
                                    placeholder="e.g., TS 08 AB 1234"
                                    value={formData.numberPlate}
                                    onChange={handleChange}
                                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-[#008080] focus:border-[#008080] outline-none uppercase"
                                />
                            </div>

                            {/* Color Input */}
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">Vehicle Color</label>
                                <input
                                    type="text"
                                    name="vehicleColor"
                                    required
                                    placeholder="e.g., Red, Matte Black, Silver"
                                    value={formData.vehicleColor}
                                    onChange={handleChange}
                                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-[#008080] focus:border-[#008080] outline-none"
                                />
                            </div>
                        </div>

                        {/* Car Preview */}
                        <div className="w-24 h-24 bg-gray-100 rounded-xl flex items-center justify-center mt-6 shadow-inner border border-gray-200 overflow-hidden">
                            <Car size={48} color={formData.vehicleColor || '#008080'} strokeWidth={1.5} />
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full font-bold py-4 rounded-xl shadow-lg transition-colors mt-4 disabled:opacity-50 ${isHighContrast ? 'bg-yellow-400 text-black border-4 border-yellow-400' : 'bg-[#008080] text-white hover:bg-teal-700'}`}
                >
                    {loading ? 'Publishing...' : 'Post Ride'}
                </button>
            </form>
        </div>
    );
}
