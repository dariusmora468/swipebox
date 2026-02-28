import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy — SwipeBox',
  description: 'SwipeBox privacy policy — how we handle your email data.',
};

export default function PrivacyPolicy() {
  const sectionStyle = { marginBottom: '32px' };
  const h2Style = { fontFamily: "'Playfair Display', Georgia, serif", fontSize: '20px', fontWeight: 700, color: '#2C2520', margin: '0 0 12px' };
  const pStyle = { fontSize: '14px', color: '#4A433C', lineHeight: 1.75, margin: '0 0 12px' };

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0EB', padding: '0' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '48px 24px 80px' }}>

        {/* Header */}
        <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#A0775A', fontSize: '13px', fontWeight: 600, marginBottom: '32px' }}>
          ← Back to SwipeBox
        </Link>

        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '32px', fontWeight: 700, color: '#2C2520', margin: '0 0 8px', letterSpacing: '0.5px' }}>
          Privacy Policy
        </h1>
        <p style={{ fontSize: '13px', color: '#9C8E82', margin: '0 0 40px' }}>
          Last updated: February 28, 2026
        </p>

        {/* What we access */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>What Data We Access</h2>
          <p style={pStyle}>
            SwipeBox connects to your Gmail account through Google's official OAuth 2.0 system. When you sign in, you grant SwipeBox permission to:
          </p>
          <p style={pStyle}>
            — Read your unread inbox emails so we can display them in the app<br />
            — Send emails on your behalf when you compose a reply<br />
            — Modify email labels (mark as read, archive, trash, snooze) when you swipe<br />
            — Access your basic profile information (name and email address)
          </p>
        </div>

        {/* How we use it */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>How We Use Your Data</h2>
          <p style={pStyle}>
            Your email content is processed in real time to generate AI-powered summaries and suggested replies. This processing happens server-side using Anthropic's Claude API.
          </p>
          <p style={pStyle}>
            — We do not store your emails in any database<br />
            — We do not sell, share, or monetize your email content<br />
            — We do not use your data for advertising targeting<br />
            — Email content is processed transiently and not retained after your session
          </p>
        </div>

        {/* What we store */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>What We Store</h2>
          <p style={pStyle}>
            SwipeBox stores minimal data to keep the app functional:
          </p>
          <p style={pStyle}>
            — Your Google OAuth tokens (encrypted, in a secure HTTP-only cookie) to maintain your session<br />
            — Your swipe preferences and settings (in your browser's local storage)<br />
            — Basic session statistics like emails processed (in your browser's local storage)
          </p>
          <p style={pStyle}>
            All locally stored data stays on your device and is never transmitted to our servers.
          </p>
        </div>

        {/* Third parties */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>Third-Party Services</h2>
          <p style={pStyle}>
            SwipeBox uses the following third-party services:
          </p>
          <p style={pStyle}>
            — Google Gmail API: to access and manage your email<br />
            — Anthropic Claude API: to generate AI summaries and reply suggestions<br />
            — Vercel: to host the application
          </p>
          <p style={pStyle}>
            Each service has its own privacy policy. We encourage you to review them.
          </p>
        </div>

        {/* Your rights */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>Your Rights</h2>
          <p style={pStyle}>
            You can revoke SwipeBox's access to your Gmail account at any time by visiting your Google Account settings at myaccount.google.com/permissions. Once revoked, SwipeBox will no longer be able to access your email.
          </p>
          <p style={pStyle}>
            You can clear all locally stored SwipeBox data by clearing your browser's storage for this site.
          </p>
        </div>

        {/* Security */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>Security</h2>
          <p style={pStyle}>
            SwipeBox uses HTTPS for all communications, stores OAuth tokens in secure HTTP-only cookies, and never exposes your credentials to client-side code. We follow Google's OAuth 2.0 best practices for token handling.
          </p>
        </div>

        {/* Contact */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>Contact</h2>
          <p style={pStyle}>
            If you have questions about this privacy policy or how SwipeBox handles your data, contact us at:
          </p>
          <p style={{ ...pStyle, fontWeight: 600 }}>
            hello@dariusmora.com
          </p>
        </div>

        {/* Footer link to terms */}
        <div style={{ borderTop: '1px solid rgba(120,100,80,0.1)', paddingTop: '24px', marginTop: '40px' }}>
          <Link href="/terms" style={{ color: '#A0775A', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
            Terms of Service →
          </Link>
        </div>
      </div>
    </div>
  );
}
