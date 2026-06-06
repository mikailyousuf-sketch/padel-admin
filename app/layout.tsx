import { Montserrat } from 'next/font/google'
import './globals.css'
import Sidebar from './components/sidebar'
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
      <body className={montserrat.className}>
        <div style={{ display: 'flex' }}>
          <Sidebar />
          <main style={{ marginLeft: '220px', flex: 1, minHeight: '100vh' }}>
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}