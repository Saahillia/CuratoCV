import { Outlet, Link } from 'react-router-dom'
import Navbar from '../components/common/Navbar'
import { useSelector } from 'react-redux'
import Loader from '../components/common/Loader'
import Login from './Login'
import { ShieldCheck } from 'lucide-react'

const Layout = () => {
    const { user, loading } = useSelector(state => state.auth)

    if (loading) {
        return <Loader />
    }

    const maskedEmail = user?.email
        ? user.email.replace(/^(.)(.*)(@.*)$/, (_, a, b, c) => `${a}${'*'.repeat(Math.max(1, b.length))}${c}`)
        : '';

    return (
        <div>
            {user ? (
                <div className="min-h-screen bg-gray-50">
                    <Navbar />
                    {user && !user.emailVerified && (
                        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-sm text-amber-800">
                            <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="size-4 text-amber-600 shrink-0" />
                                    <span>
                                        <strong>Verify your email</strong> to secure your account. We sent a code to <span className="font-mono font-medium">{maskedEmail}</span>.
                                    </span>
                                </div>
                                <Link
                                    to="/verify-email"
                                    className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-3 py-1 rounded-full transition-colors inline-block"
                                >
                                    Verify Email
                                </Link>
                            </div>
                        </div>
                    )}
                    <Outlet />
                </div>
            ) : <Login />
            }
        </div>
    )
}

export default Layout