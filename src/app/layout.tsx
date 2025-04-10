import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SocketProvider } from "../provider/socketProvider";
import FireBaseProvider from "provider/firebaseProvider";
// import { PeerProvider } from "../provider/peerProvider";
import Navbar from "components/navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Arnab Video Call",
  description: "Arnab Video Call",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <FireBaseProvider>
          <Navbar />
          <SocketProvider>{children}</SocketProvider>
        </FireBaseProvider>
      </body>
    </html>
  );
}
