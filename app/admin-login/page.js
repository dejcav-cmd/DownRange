import { SignIn } from '@clerk/nextjs'

export const metadata = {
  title: 'Admin Login — DownRange',
  robots: { index: false, follow: false },
}

export default function AdminLoginPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#09090B',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
    }}>
      {/* DownRange branding */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{
          fontFamily: "'Bebas Neue', cursive",
          fontSize: '2.5rem',
          color: '#C8922A',
          letterSpacing: '0.1em',
          lineHeight: 1,
        }}>
          DOWNRANGE
        </div>
        <div style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '10px',
          color: '#4b5563',
          letterSpacing: '0.2em',
          marginTop: '4px',
        }}>
          ADMIN CONSOLE
        </div>
      </div>

      {/* Clerk SignIn — handles email/pass + Google */}
      <SignIn
        routing="hash"
        afterSignInUrl="/admin"
        appearance={{
          layout: {
            logoPlacement: 'none',
          },
          variables: {
            colorPrimary: '#C8922A',
            colorBackground: '#0A0B0C',
            colorInputBackground: '#111318',
            colorInputText: '#F0EDE6',
            colorText: '#F0EDE6',
            colorTextSecondary: '#6B7280',
            colorNeutral: '#1F2428',
            fontFamily: 'IBM Plex Mono, monospace',
            borderRadius: '2px',
          },
          elements: {
            card: {
              border: '1px solid #1F2428',
              borderTop: '3px solid #C8922A',
              boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
              background: '#0A0B0C',
            },
            headerTitle: { display: 'none' },
            headerSubtitle: { display: 'none' },
            socialButtonsBlockButton: {
              border: '1px solid #1F2428',
              background: '#111318',
              color: '#F0EDE6',
            },
            formButtonPrimary: {
              background: '#C8922A',
              color: '#000',
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            },
            dividerLine: { background: '#1F2428' },
            dividerText: { color: '#4b5563' },
            footerActionText: { color: '#4b5563' },
            footerActionLink: { color: '#C8922A' },
          },
        }}
      />

      <div style={{
        marginTop: 24,
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: '10px',
        color: '#374151',
        textAlign: 'center',
        lineHeight: 1.8,
      }}>
        Access restricted to authorized users only.<br />
        Contact dj@downrangeco.com to request access.
      </div>
    </div>
  )
}
