import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/ui/theme-provider"
import Navbar from "./navbar/page"
import { Toaster } from "@/components/ui/sonner"
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
  title: "YouLearn - AI Learning Platform",
  description: "Chat with AI, generate flashcards, take quizzes, and learn smarter",
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
          <Navbar/>
          <Toaster />
          {children}
        </ThemeProvider>

        {/* <Footer></Footer> */}
      </body>
    </html>
  )
}
