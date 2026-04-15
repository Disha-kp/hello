import { Clock, Star, Users } from 'lucide-react';

export default function RideCard({ id, driver, rating, time, price, seats, start, end, onBook }) {
    return (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 active:scale-95 transition-transform">
            <div className="flex justify-between items-start mb-3">
                <div>
                    <h3 className="font-semibold text-gray-900 text-lg">{time}</h3>
                    <div className="flex items-center text-sm text-gray-500 mt-1 space-x-2">
                        <span>{start}</span>
                        <span>→</span>
                        <span>{end}</span>
                    </div>
                </div>
                <div className="font-bold text-lg text-[#008080]">₹{price}</div>
            </div>

            <div className="flex items-center justify-between border-t border-gray-50 pt-3 mt-2">
                <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                        {driver[0]}
                    </div>
                    <div>
                        <div className="text-sm font-medium text-gray-900">{driver}</div>
                        <div className="flex items-center text-xs text-gray-500">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 mr-1" />
                            {rating}
                        </div>
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    <div className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-md flex items-center">
                        <Users className="w-3 h-3 mr-1" />
                        {seats} left
                    </div>
                    {seats > 0 ? (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onBook && onBook();
                            }}
                            className="bg-[#008080] text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm hover:bg-teal-700 transition-colors"
                        >
                            Book
                        </button>
                    ) : (
                        <span className="text-red-500 text-xs font-bold px-2">Full</span>
                    )}
                </div>
            </div>
        </div>
    );
}
