import AaMasthead from './AaMasthead'
import AAFooter from './AAFooter'
import WhatsAppButton from '../ui/WhatsAppButton'

/**
 * PageLayout — shared shell for all Arsenal Americano pages.
 * Renders: AaMasthead → {children} → WhatsAppButton → AAFooter
 * Import this instead of importing components individually.
 */
export default function PageLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AaMasthead />
      {children}
      <WhatsAppButton />
      <AAFooter />
    </>
  )
}
