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
