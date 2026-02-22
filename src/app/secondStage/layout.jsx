'use client';

import { useRouter } from 'next/navigation';
import { useAuth, signOut } from '@/lib/auth-client';
import SECONDARY_ChatLayout from '@/components/SECONDARY_ChatLayout';

export default function SecondStageLayout({ children }) {
    const router = useRouter();
    const { data: session, isPending } = useAuth();

    // Loading state
    if (isPending) {
        return (
            <div className="w-full h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-4xl mb-4">🫠</div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    // Not authenticated
    if (!session?.user) {
        return (
            <div className="w-full h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-4xl mb-4">🔒</div>
                    <p className="text-gray-600 mb-6">Please log in to access this page</p>
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
                <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{session.user.name}</p>
                    <p className="text-xs text-gray-600">{session.user.email}</p>
                </div>
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

            <SECONDARY_ChatLayout />
            <div className="hidden">{children}</div>
        </div>
    );
}
