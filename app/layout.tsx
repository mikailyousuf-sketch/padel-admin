import { Montserrat } from 'next/font/google'
import './globals.css'
import LayoutShell from './components/layout-shell'

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
})

export const metadata = {
  title: 'Virgin Active Padel — Club Manager',
  description: 'Club operations platform',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={montserrat.className} style={{ margin: 0, padding: 0 }}>
        <LayoutShell>
          {children}
        </LayoutShell>
      </body>
    </html>
  )
}