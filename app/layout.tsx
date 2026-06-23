import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Image from 'next/image';
import Link from 'next/link';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ThemeToggle } from '@/components/ThemeToggle';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Stratos',
  description: 'AI agent with live tool calling — ask about real-time weather anywhere in the world',
  icons: { icon: '/logo.svg' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* No-flash theme init — runs synchronously before React hydration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{const t=localStorage.getItem('theme')||(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.classList.toggle('dark',t==='dark');document.documentElement.classList.toggle('light',t==='light');}catch(e){}`,
          }}
        />
      </head>
      <body className={`${inter.className} min-h-screen`}>
        <ThemeProvider>
          <nav className="glass-nav sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
              {/* Logo */}
              <div className="flex items-center gap-2.5">
                <Image
                  src="/logo.svg"
                  alt="Stratos logo"
                  width={28}
                  height={28}
                  priority
                />
                <span className="font-semibold text-sm tracking-tight fg-1">
                  Stratos
                </span>
              </div>

              <div className="flex items-center gap-1">
                <NavLink href="/">Chat</NavLink>
                <NavLink href="/dashboard">Dashboard</NavLink>
                <div className="w-px h-4 mx-1 bg-slate-200 dark:bg-white/10" />
                <ThemeToggle />
              </div>
            </div>
          </nav>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-3 py-1.5 rounded-md text-[13px] font-medium
        fg-2 hover-fg-1 hover:bg-slate-900/[0.05]
        dark:hover:bg-white/[0.06]
        transition-all duration-150"
    >
      {children}
    </Link>
  );
}
