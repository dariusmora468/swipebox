import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service — SwipeBox',
  description: 'SwipeBox terms of service.',
};

export default function TermsOfService() {
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
          Terms of Service
        </h1>
        <p style={{ fontSize: '13px', color: '#9C8E82', margin: '0 0 40px' }}>
          Last updated: February 28, 2026
        </p>

        <div style={sectionStyle}>
          <h2 style={h2Style}>Acceptance of Terms</h2>
          <p style={pStyle}>
            By using SwipeBox, you agree to these Terms of Service. If you do not agree, please do not use the app. SwipeBox is currently in beta and features may change.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>What SwipeBox Does</h2>
          <p style={pStyle}>
            SwipeBox is an email management application that connects to your Gmail account. It provides a swipe-based interface for triaging emails and uses AI to generate email summaries and reply suggestions.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>Your Account</h2>
          <p style={pStyle}>
            You sign in to SwipeBox using your Google account. You are responsible for maintaining the security of your Google account credentials. SwipeBox does not store your Google password.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>Email Actions</h2>
          <p style={pStyle}>
            When you swipe on an email, SwipeBox performs real actions on your Gmail account — including marking emails as read, archiving, deleting (trashing), snoozing, sending replies, and unsubscribing from mailing lists. These actions are performed on your behalf and according to your instructions.
          </p>
          <p style={pStyle}>
            Please swipe carefully. While deleted emails go to your Gmail trash (recoverable for 30 days), other actions like sending replies cannot be undone through SwipeBox.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>AI-Generated Content</h2>
          <p style={pStyle}>
            SwipeBox uses AI (Anthropic's Claude) to generate email summaries and reply suggestions. These are provided as suggestions only. You are responsible for reviewing any AI-generated reply before sending it. SwipeBox is not responsible for the content of AI-generated replies that you choose to send.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>Beta Service</h2>
          <p style={pStyle}>
            SwipeBox is currently in beta. The service is provided "as is" without warranty of any kind. We may experience bugs, downtime, or unexpected behavior. We are actively improving the product and appreciate your feedback.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>Limitation of Liability</h2>
          <p style={pStyle}>
            SwipeBox and its creators shall not be liable for any indirect, incidental, or consequential damages arising from your use of the service, including but not limited to lost emails, unintended email actions, or service interruptions.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>Changes to These Terms</h2>
          <p style={pStyle}>
            We may update these terms from time to time. Continued use of SwipeBox after changes constitutes acceptance of the updated terms.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>Contact</h2>
          <p style={pStyle}>
            Questions about these terms? Contact us at:
          </p>
          <p style={{ ...pStyle, fontWeight: 600 }}>
            hello@dariusmora.com
          </p>
        </div>

        {/* Footer link to privacy */}
        <div style={{ borderTop: '1px solid rgba(120,100,80,0.1)', paddingTop: '24px', marginTop: '40px' }}>
          <Link href="/privacy" style={{ color: '#A0775A', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
            Privacy Policy →
          </Link>
        </div>
      </div>
    </div>
  );
}
