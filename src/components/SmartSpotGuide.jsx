import { Sparkles, MapPin } from 'lucide-react';

export default function SmartSpotGuide({ locationName }) {

    // Simulated Generative AI Logic
    const getAiGuide = (location) => {
        const loc = location?.toLowerCase() || '';

        if (loc.includes('jntu')) {
            return "Stand near the Blue Watchman Booth. Your ride will stop near the ATM.";
        } else if (loc.includes('hitech') || loc.includes('mindspace')) {
            return "Wait at the Cyber Pearl Bus Stop, near the Chai Point stall.";
        } else if (loc.includes('secunderabad')) {
            return "Please wait at the Alpha Hotel entrance for easier pickup.";
        } else {
            return "Wait at the main entrance visibility. Look for the vehicle number.";
        }
    };

    const guideText = getAiGuide(locationName);

    return (
        <div className="w-full bg-gradient-to-r from-teal-50 to-white p-4 rounded-xl border border-teal-100 shadow-sm relative overflow-hidden">
            <div className="flex items-start space-x-3 relative z-10">
                <div className="bg-white p-2 rounded-full shadow-sm border border-teal-50">
                    <Sparkles className="w-5 h-5 text-[#008080] animate-pulse" />
                </div>
                <div className="flex-1">
                    <h4 className="text-xs font-bold text-[#008080] uppercase tracking-wider mb-1 flex items-center">
                        Simulated GenAI Guide
                    </h4>
                    <p className="text-gray-700 text-sm font-medium leading-relaxed">
                        {guideText}
                    </p>
                </div>
            </div>

            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-teal-100 rounded-full opacity-20 blur-xl"></div>
            <div className="absolute bottom-0 left-0 -mb-2 -ml-2 w-12 h-12 bg-teal-200 rounded-full opacity-20 blur-xl"></div>
        </div>
    );
}
