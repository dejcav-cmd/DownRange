import Masthead from './Masthead'
import AAFooter from './AAFooter'
import WhatsAppButton from '../ui/WhatsAppButton'

/**
 * PageLayout — shared shell used by every page.
 * Renders: Masthead → {children} → WhatsAppButton → Footer
 * Import this instead of importing Masthead/Footer/WhatsAppButton individually.
 */
export default function PageLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Masthead />
      {children}
      <WhatsAppButton />
      <AAFooter />
    </>
  )
}
