import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/ui/theme-provider"
import Navbar from "./navbar/page"
import { Toaster } from "@/components/ui/sonner"
import NextAuthProvider from "@/Providers/NextAuthProvider"
import Footer from "./footer/page"


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata = {
  title: "AI Video Summarizer",
  description: "Summarize videos with AI",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NextAuthProvider>
     <Navbar/>
          <Toaster />
          {children}
          </NextAuthProvider>
     
        </ThemeProvider>

        <Footer></Footer>
      </body>
    </html>
  )
}
