import type { Metadata } from 'next'
import './globals.css'
import NavBar from '@/components/NavBar'

export const metadata: Metadata = {
  title: '智脈 — 知識在句子裡流動',
  description: '以句子為單位的知識社群。收藏一句話，遇見同樣被它擊中的人。',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <body className="bg-white text-gray-900 min-h-screen" suppressHydrationWarning>
        <NavBar />
        <main className="max-w-2xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  )
}
