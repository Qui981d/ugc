import Link from 'next/link'
import { ArrowLeft, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function DashboardNotFound() {
    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-6 max-w-md mx-auto px-4">
                <div className="w-20 h-20 rounded-3xl bg-[#F4F3EF] flex items-center justify-center mx-auto">
                    <span className="text-4xl">🔍</span>
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-[#18181B] mb-2">Page introuvable</h1>
                    <p className="text-[#71717A]">
                        La page que vous recherchez n&apos;existe pas ou a été déplacée.
                    </p>
                </div>
                <div className="flex items-center justify-center gap-3">
                    <Button
                        onClick={() => window.history.back()}
                        variant="outline"
                        className="rounded-full border-[#D9D7D0] text-[#18181B] hover:bg-[#F4F3EF]"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Retour
                    </Button>
                    <Link href="/">
                        <Button className="rounded-full bg-[#18181B] hover:bg-[#18181B]/90 text-white">
                            <Home className="w-4 h-4 mr-2" />
                            Accueil
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    )
}
