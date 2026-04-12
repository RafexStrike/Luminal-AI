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
            <div className="w-full h-screen bg-gray-50 flex flex-col items-center justify-center space-y-4">
                <div className="relative flex justify-center items-center">
                    <div className="absolute animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500"></div>
                    <div className="h-10 w-10 rounded-full bg-purple-200 animate-pulse"></div>
                </div>
                <p className="text-purple-600 font-medium tracking-widest animate-pulse">
                    LOADING SYSTEM...
                </p>
            </div>
        );
    }

    // Not authenticated
    if (!session?.user) {
        return (
            <div className="w-full h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-4xl mb-4">🔒</div>
                    <p className="text-gray-600 mb-6">
                        Please log in to access this page
                    </p>
                    <button
                        onClick={() => router.push('/auth/login')}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-screen bg-white">
            {/* Top Right User Menu */}
            <div className="absolute top-4 right-4 flex items-center gap-3 z-40">

                {/* User Info */}
                <div className="text-right">
                    <p className="text-sm font-medium text-white-800">
                        {session.user.name}
                    </p>
                    <p className="text-xs text-gray-400">
                        {session.user.email}
                    </p>
                </div>

                {/* Admin Dashboard Button */}
                {isAdmin && (
                    <button
                        onClick={() => router.push('/admin/dashboard')}
                        className="px-4 py-2 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 
                                   hover:from-violet-500 hover:via-purple-500 hover:to-indigo-500 
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
                        className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        title="View profile"
                    >
                        👤
                    </button>

                    <button
                        onClick={async () => {
                            await signOut();
                        }}
                        className="px-3 py-2 text-sm bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors"
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