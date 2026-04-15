import { MapPin } from 'lucide-react';

export default function SearchBar({ value, onChange }) {
    return (
        <div className="bg-white p-4 shadow-sm sticky top-0 z-10 transition-all duration-300">
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    value={value}
                    onChange={onChange}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#008080] focus:border-transparent transition duration-150 ease-in-out sm:text-sm"
                    placeholder="Where to? (e.g., JNTU, Hitech City)"
                />
            </div>
        </div>
    );
}
