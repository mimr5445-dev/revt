import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Revt — مصمّم المباني السحابي',
  description: 'تطبيق بناء نماذج معمارية (BIM) سحابي — بديل عربي لـ Revit يعمل في المتصفح.',
  manifest: undefined,
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0a0e1a',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <div id="app-root">{children}</div>
      </body>
    </html>
  )
}
