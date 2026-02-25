import "./globals.css";

export const metadata = {
  title: "SwipeBox — AI Email Triage",
  description: "Swipe through your inbox with AI-powered replies. Tinder for email.",
  manifest: "/manifest.json",
  themeColor: "#0a0a0f",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="SwipeBox" />
      </head>
      <body>{children}</body>
    </html>
  );
}
import "./globals.css";

export const metadata = {
  title: "SwipeBox",
  description: "AI-powered email triage with swipe gestures",
  manifest: "/manifest.json",
  themeColor: "#6366f1",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="SwipeBox" />
      </head>
      <body>{children}</body>
    </html>
  );
}
