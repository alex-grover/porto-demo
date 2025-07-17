import type { Metadata } from "next";
import { PropsWithChildren } from "react";
import { Providers } from "@/lib/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Porto",
  description:
    "Sign in with superpowers. Buy, swap, subscribe, and much more. No passwords or extensions required.",
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
