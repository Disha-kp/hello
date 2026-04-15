import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import VoiceAssistant from './VoiceAssistant';
import { useAccessibility } from '../context/AccessibilityContext';
import { Eye, EyeOff } from 'lucide-react';

export default function Layout() {
    const { isHighContrast, toggleHighContrast } = useAccessibility();

    return (
        <div className="flex flex-col h-screen radiant-background text-gray-900 font-sans">
            <main className="flex-1 overflow-y-auto pb-24 scrollbar-hide relative z-0">
                <Outlet />
            </main>

            {/* High Contrast Toggle Button */}
            <button
                onClick={toggleHighContrast}
                className="fixed top-4 right-4 z-[2000] p-3 rounded-full shadow-lg border-2 transition-all"
                aria-label="Toggle High Contrast Mode"
                style={{
                    backgroundColor: isHighContrast ? '#facc15' : 'white',
                    borderColor: isHighContrast ? 'black' : '#e5e7eb',
                    color: 'black'
                }}
            >
                {isHighContrast ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
            </button>

            <VoiceAssistant />
            <BottomNav />
        </div>
    );
}
