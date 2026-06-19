import { Link, useLocation } from 'react-router-dom';
import { Home, PlusSquare, BookOpen, History, BarChart2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/record', label: 'Record', icon: PlusSquare },
  { path: '/rules', label: 'Rules', icon: BookOpen },
  { path: '/history', label: 'History', icon: History },
  { path: '/analysis', label: 'Analysis', icon: BarChart2 },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-1/2 w-full max-w-md -translate-x-1/2 bg-white/95 backdrop-blur-md border-t border-zinc-100 safe-bottom z-30">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));

          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center justify-center w-full h-full space-y-1 text-[10px] tracking-wider transition-all group"
            >
              <div className={twMerge(
                clsx(
                  "flex items-center justify-center transition-all duration-300",
                  isActive ? "text-violet-600 scale-110" : "text-zinc-400 group-hover:text-violet-400"
                )
              )}>
                <item.icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
              </div>
              <span className={clsx(
                "font-medium transition-all duration-300",
                isActive ? "text-violet-700" : "text-zinc-400 hidden md:block"
              )}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
