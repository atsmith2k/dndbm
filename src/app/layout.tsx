import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'D&D Battle Map Creator',
  description: 'Create and manage battle maps for your D&D campaigns with real-time multiplayer support',
  keywords: ['D&D', 'battle map', 'tabletop', 'RPG', 'dungeon master', 'virtual tabletop'],
  authors: [{ name: 'D&D Battle Map Creator' }],
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-background">
          {children}
        </div>
      </body>
    </html>
  )
}
