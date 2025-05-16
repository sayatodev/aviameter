import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Aviameter",
    description: "GPS-based Flight Statistics Tracker",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
