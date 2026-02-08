'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence, useMotionValueEvent, useScroll } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { ChevronDown, LogOut, LayoutDashboard, User, Settings, Menu, X } from 'lucide-react'

export function Navbar() {
    const router = useRouter()
    const [hidden, setHidden] = useState(false)
    const [scrolled, setScrolled] = useState(false)
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [mounted, setMounted] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const { scrollY } = useScroll()
    const { user, isAuthenticated, signOut } = useAuth()

    // Prevent hydration mismatch: auth state differs server vs client
    useEffect(() => { setMounted(true) }, [])

    useMotionValueEvent(scrollY, 'change', (latest) => {
        const previous = scrollY.getPrevious() ?? 0

        // Show navbar at the very top of the page
        if (latest < 50) {
            setHidden(false)
            setScrolled(false)
            return
        }

        setScrolled(true)

        // Hide on scroll down, show on scroll up
        if (latest > previous && latest > 100) {
            setHidden(true)
        } else if (latest < previous) {
            setHidden(false)
        }
    })

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const isAuth = mounted && isAuthenticated
    const dashboardLink = user?.role === 'brand' ? '/brand' : '/creator'

    return (
        <>
            <motion.nav
                initial={{ y: -100, opacity: 0 }}
                animate={{
                    y: hidden ? -100 : 0,
                    opacity: hidden ? 0 : 1
                }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${scrolled
                    ? 'bg-black/80 backdrop-blur-xl border border-white/10'
                    : 'bg-black/40 backdrop-blur-md border border-white/5'
                    } rounded-full px-2 py-2 w-[calc(100vw-2rem)] md:w-auto max-w-3xl`}
            >
                <div className="flex items-center gap-1 w-full">
                    {/* Logo */}
                    <Link
                        href="/"
                        className="px-4 py-2 font-bold text-white flex items-center"
                    >
                        <span>UGC</span>
                        <span className="text-accent">Suisse</span>
                    </Link>

                    {/* Spacer on mobile for right-aligned burger */}
                    <div className="flex-1 md:hidden" />

                    {/* Nav Items */}
                    <div className="hidden md:flex items-center">
                        <Link
                            href="/marketplace"
                            className="px-4 py-2 text-sm text-white/70 hover:text-white transition-colors"
                        >
                            Marketplace
                        </Link>
                        {mounted && !isAuth && (
                            <Link
                                href="/signup?role=brand"
                                className="px-4 py-2 text-sm text-white/70 hover:text-white transition-colors"
                            >
                                Pour les marques
                            </Link>
                        )}
                        <Link
                            href="/pricing"
                            className="px-4 py-2 text-sm text-white/70 hover:text-white transition-colors"
                        >
                            Tarifs
                        </Link>
                        {isAuth && (
                            <Link
                                href={dashboardLink}
                                className="px-4 py-2 text-sm text-white/70 hover:text-white transition-colors"
                            >
                                Dashboard
                            </Link>
                        )}
                    </div>

                    {/* Divider */}
                    <div className="hidden md:block w-px h-6 bg-white/10 mx-2" />

                    {/* Mobile Burger Button */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden p-2 rounded-full hover:bg-white/10 text-white/70 active:text-white transition-colors"
                    >
                        {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>

                    {/* Auth Section */}
                    {isAuth && user ? (
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-white/10 transition-colors"
                            >
                                <div className="relative w-8 h-8 rounded-full overflow-hidden ring-2 ring-accent/50">
                                    {user.avatar_url ? (
                                        <Image
                                            src={user.avatar_url}
                                            alt={user.full_name}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-accent/20 flex items-center justify-center">
                                            <span className="text-accent text-sm font-medium">
                                                {user.full_name.charAt(0)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <span className="hidden md:block text-sm text-white font-medium max-w-[100px] truncate">
                                    {user.full_name}
                                </span>
                                <ChevronDown className={`w-4 h-4 text-white/60 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Dropdown Menu */}
                            {dropdownOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    className="absolute top-full right-0 mt-2 w-56 bg-[#1A1A1A] border border-white/10 rounded-xl shadow-xl overflow-hidden"
                                >
                                    {/* User Info */}
                                    <div className="p-4 border-b border-white/10">
                                        <p className="text-white font-medium truncate">{user.full_name}</p>
                                        <p className="text-white/50 text-xs truncate">{user.email}</p>
                                        <span className="inline-block mt-2 px-2 py-0.5 bg-accent/20 text-accent text-xs rounded-full capitalize">
                                            {user.role === 'brand' ? 'Marque' : 'Créateur'}
                                        </span>
                                    </div>

                                    {/* Menu Items */}
                                    <div className="p-2">
                                        <Link
                                            href={dashboardLink}
                                            className="flex items-center gap-3 px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                                            onClick={() => setDropdownOpen(false)}
                                        >
                                            <LayoutDashboard className="w-4 h-4" />
                                            Dashboard
                                        </Link>
                                        <Link
                                            href={`${dashboardLink}/profile`}
                                            className="flex items-center gap-3 px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                                            onClick={() => setDropdownOpen(false)}
                                        >
                                            <User className="w-4 h-4" />
                                            Mon profil
                                        </Link>
                                        <Link
                                            href={`${dashboardLink}/settings`}
                                            className="flex items-center gap-3 px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                                            onClick={() => setDropdownOpen(false)}
                                        >
                                            <Settings className="w-4 h-4" />
                                            Paramètres
                                        </Link>
                                    </div>

                                    {/* Logout */}
                                    <div className="p-2 border-t border-white/10">
                                        <button
                                            onClick={async () => {
                                                await signOut()
                                                setDropdownOpen(false)
                                                router.push('/login')
                                            }}
                                            className="flex items-center gap-3 w-full px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            Déconnexion
                                        </button>
                                    </div>

                                    {/* Demo Notice */}
                                    <div className="px-4 py-2 bg-yellow-500/10 border-t border-yellow-500/20">
                                        <p className="text-[10px] text-yellow-400/80 text-center">
                                            Mode démo
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    ) : (
                        <div className="hidden md:flex items-center gap-2">
                            <Link
                                href="/login"
                                className="px-4 py-2 text-sm text-white/70 hover:text-white transition-colors"
                            >
                                Connexion
                            </Link>
                            <Link
                                href="/signup"
                                className="px-4 py-2 text-sm bg-accent text-white rounded-full hover:bg-accent/90 transition-colors"
                            >
                                S&apos;inscrire
                            </Link>
                        </div>
                    )}
                </div>
            </motion.nav>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] bg-black md:hidden overflow-y-auto"
                        style={{ paddingTop: '5rem' }}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            transition={{ delay: 0.1 }}
                            className="flex flex-col items-center gap-2 p-6"
                        >
                            <Link
                                href="/marketplace"
                                onClick={() => setMobileMenuOpen(false)}
                                className="w-full text-center px-6 py-4 text-lg text-white/80 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                            >
                                Marketplace
                            </Link>
                            {mounted && !isAuth && (
                                <Link
                                    href="/signup?role=brand"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="w-full text-center px-6 py-4 text-lg text-white/80 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                                >
                                    Pour les marques
                                </Link>
                            )}
                            <Link
                                href="/pricing"
                                onClick={() => setMobileMenuOpen(false)}
                                className="w-full text-center px-6 py-4 text-lg text-white/80 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                            >
                                Tarifs
                            </Link>
                            {isAuth && (
                                <Link
                                    href={dashboardLink}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="w-full text-center px-6 py-4 text-lg text-white/80 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                                >
                                    Dashboard
                                </Link>
                            )}

                            <div className="w-full h-px bg-white/10 my-4" />

                            {isAuth ? (
                                <button
                                    onClick={async () => {
                                        await signOut()
                                        setMobileMenuOpen(false)
                                        router.push('/login')
                                    }}
                                    className="w-full text-center px-6 py-4 text-lg text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                                >
                                    Déconnexion
                                </button>
                            ) : (
                                <>
                                    <Link
                                        href="/login"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="w-full text-center px-6 py-4 text-lg text-white/80 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                                    >
                                        Connexion
                                    </Link>
                                    <Link
                                        href="/signup"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="w-full text-center px-6 py-4 text-lg bg-accent text-white rounded-xl hover:bg-accent/90 transition-colors font-medium"
                                    >
                                        S&apos;inscrire
                                    </Link>
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
