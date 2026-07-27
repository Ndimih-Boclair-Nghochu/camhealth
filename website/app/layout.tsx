import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CamHealth — Hospital Management System for Cameroon",
  description:
    "CamHealth digitises hospital operations in Cameroon — less paperwork, secure patient data, and easier consultations. By NBN TECH.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
