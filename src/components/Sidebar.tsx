import Link from 'next/link';

export default function Sidebar() {
    return (
        <aside className="w-64 bg-blue-900 text-white min-h-screen p-6">
            <h2 className="text-xl font-bold mb-8 border-b border-blue-700 pb-2">UPTX Eval</h2>
            <nav className="space-y-4">
                <Link href="/dashboard" className="block hover:bg-blue-800 p-2 rounded transition">
                    🏠 Inicio
                </Link>
                <Link href="/dashboard/docentes" className="block hover:bg-blue-800 p-2 rounded transition">
                    👨‍🏫 Docentes
                </Link>
                <Link href="/dashboard/materias" className="block hover:bg-blue-800 p-2 rounded transition">
                    📚 Materias
                </Link>
            </nav>
        </aside>
    );
}
