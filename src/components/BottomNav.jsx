import { NavLink } from 'react-router-dom';
import { Search, Car, User } from 'lucide-react';
import clsx from 'clsx';

export default function BottomNav() {
    const navItems = [
        { to: '/', icon: Search, label: 'Find Ride' },
        { to: '/offer', icon: Car, label: 'Offer Ride' },
        { to: '/profile', icon: User, label: 'Profile' }
    ];

    return (
        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-11/12 max-w-sm glass-card z-50 p-2 shadow-2xl ring-1 ring-white/50">
            <div className="flex justify-around items-center">
                {navItems.map(({ to, icon: Icon, label }) => (
                    <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) =>
                            clsx(
                                'flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-300',
                                isActive
                                    ? 'bg-white/40 text-teal-800 shadow-inner translate-y-[-4px] scale-110'
                                    : 'text-gray-500 hover:text-gray-800 hover:bg-white/20'
                            )
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                                {isActive && <span className="text-[10px] font-bold mt-1 animate-in fade-in zoom-in">{label}</span>}
                            </>
                        )}
                    </NavLink>
                ))}
            </div>
        </nav>
    );
}
