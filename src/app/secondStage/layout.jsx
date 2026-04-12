'use client';

import { useRouter } from 'next/navigation';
import { useAuth, signOut } from '@/lib/auth-client';
import { useAdminRole } from '@/hooks/useAdminRole';
import SECONDARY_ChatLayout from '@/components/SECONDARY_ChatLayout';

export default function SecondStageLayout({ children }) {
    const router = useRouter();
    const { data: session, isPending } = useAuth();
    const { isAdmin } = useAdminRole();

    // Loading state
    if (isPending) {
        return (
            <div className="w-full h-screen bg-blue-950 flex flex-col items-center justify-center space-y-4">
                <div className="relative flex justify-center items-center">
                    <div className="absolute animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500"></div>
                    <div className="h-10 w-10 rounded-full bg-indigo-200 animate-pulse"></div>
                </div>
                <p className="text-indigo-600 font-medium tracking-widest animate-pulse">
                    LOADING SYSTEM...
                </p>
            </div>
        );
    }
 
    // Not authenticated
    if (!session?.user) {
        return (
            <div className="w-full h-screen bg-blue-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-4xl mb-4">🔒</div>
                    <p className="text-blue-200/80 mb-6">
                        Please log in to access this page
                    </p>
                    <button
                        onClick={() => router.push('/auth/login')}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }
 
    return (
        <div className="w-full h-screen bg-blue-950">

            {/* Top Right User Menu */}
            <div className="absolute top-4 right-4 flex items-center gap-3 z-40">

                {/* User Info */}
                <div className="text-right">
                    <p className="text-sm font-medium text-white">
                        {session.user.name}
                    </p>
                    <p className="text-xs text-blue-400/60">
                        {session.user.email}
                    </p>
                </div>
 
                {/* Admin Dashboard Button */}
                {isAdmin && (
                    <button
                        onClick={() => router.push('/admin/dashboard')}
                        className="px-4 py-2 bg-gradient-to-r from-indigo-600 via-blue-600 to-blue-700 
                                   hover:from-indigo-500 hover:via-blue-500 hover:to-blue-600 
                                   text-white font-semibold rounded-lg shadow-lg flex items-center gap-2
                                   transition-all duration-300 transform hover:scale-105 
                                   animate-pulse hover:animate-none"
                    >
                        <span className="text-lg animate-bounce" style={{ animationDelay: '0s' }}>🛡️</span>
                        Admin Dashboard
                    </button>
                )}
 
                {/* Actions */}
                <div className="flex gap-2">
                    <button
                        onClick={() => router.push('/auth/profile')}
                        className="px-3 py-2 text-sm text-blue-200 hover:bg-blue-900/50 rounded-lg transition-colors"
                        title="View profile"
                    >
                        👤
                    </button>
 
                    <button
                        onClick={async () => {
                            await signOut();
                        }}
                        className="px-3 py-2 text-sm bg-red-900/30 text-red-400 hover:bg-red-900/50 rounded-lg transition-colors"
                        title="Log out"
                    >
                        Sign Out
                    </button>
                </div>

            </div>

            {/* Main Layout */}
            <SECONDARY_ChatLayout />
            <div className="hidden">{children}</div>
        </div>
    );
}