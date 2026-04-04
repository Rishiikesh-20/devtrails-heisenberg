import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Sidebar } from './components/navigation/Sidebar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'DevTrails Platform',
  description: 'Parametric Insurance Worker Dashboard & Operations',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-gray-950 text-gray-100 antialiased`}>
        <div className="flex min-h-screen">
          {/* Unified Sidebar Navigation */}
          <Sidebar />

          {/* Main Content Area */}
          <main className="flex-1 w-full bg-gray-950 relative overflow-y-auto">
            {/* You can add a mobile hamburger header here if needed */}
            <div className="md:hidden p-4 border-b border-white/10 flex items-center justify-between sticky top-0 z-50 bg-gray-950/80 backdrop-blur-md">
               <span className="font-bold text-lg text-white">DevTrails</span>
               <button className="p-2 bg-white/5 rounded-lg border border-white/10 text-gray-300">
                 Menu
               </button>
            </div>

            {/* Page Content */}
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
