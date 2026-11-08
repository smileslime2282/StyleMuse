import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "StyleMuse — Your personal AI hair stylist",
  description: "Discover hairstyles that complement your features, hair texture and routine. Get practical at-home styling steps.",
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
