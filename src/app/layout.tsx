import type { Metadata, Viewport } from 'next';
import './globals.css';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';

export const viewport: Viewport = {
  themeColor: '#344D41',
  colorScheme: 'light',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || 'https://projecthub-clg.vercel.app'
  ),
  title: {
    default: 'CodeShastra Hub | Academic Project Lifecycle & Milestone Evaluation',
    template: '%s | CodeShastra Hub',
  },
  description:
    'Synchronized academic platform for 102 student teams, 601 allocated students, and 23 faculty mentors. Direct milestone submissions, verified consultation audits, and conflict-free panel defenses.',
  applicationName: 'CodeShastra Hub',
  authors: [
    { name: 'Arpit Pandey', url: 'https://www.linkedin.com/in/dev-arpit/' },
    { name: 'Rishabh Mishra', url: 'https://www.linkedin.com/in/rishabh-mishra-bab420309/' },
    { name: 'Harsh Sharma', url: 'https://www.linkedin.com/in/harshiitm/' },
    { name: 'CodeShastra Team', url: 'https://www.instagram.com/code___shastra/' },
  ],
  keywords: [
    'CodeShastra Hub',
    'ProjectHub',
    'GLA University',
    'BCA DS Projects',
    'Academic Milestone Evaluation',
    'Faculty Supervision Platform',
    'Panel Defense Evaluation',
    'Capstone Project Management',
    'Vrindopnishad',
  ],
  creator: 'CodeShastra',
  publisher: 'CodeShastra',
  category: 'education',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.svg',
  },
  manifest: '/manifest.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'CodeShastra Hub',
    title: 'CodeShastra Hub | Academic Project Lifecycle & Milestone Evaluation',
    description:
      '102 student teams. 601 allocated students. 23 faculty mentors. A single synchronized platform for frictionless milestone submissions, mentor consultations, and conflict-free panel defenses.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CodeShastra Hub | Academic Project Lifecycle & Milestone Evaluation',
    description:
      '102 student teams. 601 allocated students. 23 faculty mentors. A single synchronized platform for frictionless milestone submissions and panel defenses.',
    creator: '@CodeShastra',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-icon" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <ServiceWorkerRegister />
        <main>{children}</main>
      </body>
    </html>
  );
}
