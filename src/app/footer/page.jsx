"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  FaYoutube,
  FaGithub,
  FaTwitter,
  FaUpload,
  FaHome,
  FaStickyNote,
  FaLayerGroup,
} from "react-icons/fa";
import { RiAiGenerate } from "react-icons/ri";
import Link from "next/link";
import { usePathname } from "next/navigation";

const routes = [
  { href: "/", label: "Home", icon: <FaHome className="text-lg" /> },
  { href: "/upload", label: "Upload", icon: <FaUpload className="text-lg" /> },
  { href: "/flashcard", label: "Flashcard", icon: <FaLayerGroup className="text-lg" /> },
  { href: "/noteapp", label: "Notes", icon: <FaStickyNote className="text-lg" /> },
];

const socialLinks = [
  { icon: <FaYoutube />, link: "https://www.youtube.com", name: "YouTube", color: "hover:text-red-500" },
  { icon: <FaGithub />, link: "https://www.github.com", name: "GitHub", color: "hover:text-gray-300" },
  { icon: <FaTwitter />, link: "https://x.com", name: "Twitter", color: "hover:text-blue-400" },
];

const Footer = () => {
  const pathname = usePathname();

  return (
    <motion.footer
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative mt-20 text-white bg-gradient-to-br from-gray-900 via-emerald-900 to-blue-900 dark:from-gray-950 dark:via-emerald-950 dark:to-blue-950 border-t border-white/10"
    >
      {/* Background Orbs */}
      <div className="absolute top-0 left-1/4 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 right-1/4 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>

      <div className="relative container mx-auto py-12 px-6 z-10">
        {/* Main Footer Content */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:ml-28 gap-12 lg:gap-20 mb-12">
          {/* Brand */}
          <motion.div
            className="flex-1 flex flex-col gap-4"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                <RiAiGenerate className="text-2xl text-white" />
              </div>
              <motion.h1
                whileHover={{ scale: 1.05 }}
                className="text-3xl font-bold cursor-pointer tracking-tight"
              >
                <span className="bg-gradient-to-r from-yellow-300 to-orange-400 bg-clip-text text-transparent">
                  LUMINAL
                </span>
              </motion.h1>
            </div>
            <p className="text-white/70 text-sm leading-relaxed max-w-md">
              Transform long videos into concise, actionable summaries with AI-powered technology, chat, notes, and flashcards. Save time and enhance your learning experience.
            </p>
          </motion.div>

          {/* Navigation */}
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              Navigation
            </h3>
            <nav className="grid grid-cols-2 sm:grid-cols-1 md:grid-cols-1 gap-3">
              {routes.map((route) => (
                <motion.div
                  key={route.href}
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <Link
                    href={route.href}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 group ${
                      pathname === route.href
                        ? "bg-white/10 text-yellow-300 shadow-lg"
                        : "text-white/70 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <span
                      className={`transition-transform duration-300 group-hover:scale-110 ${
                        pathname === route.href ? "text-yellow-300" : "text-white/60"
                      }`}
                    >
                      {route.icon}
                    </span>
                    <span className="font-medium text-sm">{route.label}</span>
                  </Link>
                </motion.div>
              ))}
            </nav>
          </div>

          {/* Social Links */}
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              Connect With Us
            </h3>
            <div className="flex gap-4 mb-6 flex-wrap">
              {socialLinks.map((social, i) => (
                <motion.a
                  key={i}
                  href={social.link}
                  target="_blank"
                  rel="noreferrer"
                  whileHover={{ scale: 1.2, y: -2 }}
                  whileTap={{ scale: 0.9 }}
                  className={`p-3 bg-white/5 rounded-xl backdrop-blur-sm border border-white/10 ${social.color} transition-all duration-300 group relative`}
                  title={social.name}
                >
                  {social.icon}
                  <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                    {social.name}
                  </div>
                </motion.a>
              ))}
            </div>
            <div className="space-y-1">
              <p className="text-white/60 text-sm">support@luminal.com</p>
              <p className="text-white/60 text-sm">+1 (555) 123-4567</p>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-white/10 pt-6 flex flex-col lg:flex-row items-center justify-between gap-4">
          <motion.p
            className="text-white/60 text-sm text-center lg:text-left"
            whileHover={{ scale: 1.02 }}
          >
            © {new Date().getFullYear()} <span className="text-yellow-300 font-semibold">Luminal</span>. All rights reserved.
          </motion.p>

          <div className="flex flex-wrap justify-center lg:justify-end gap-4 text-sm">
            <motion.a
              href="#"
              whileHover={{ scale: 1.05, color: "#fbbf24" }}
              className="text-white/60 hover:text-yellow-300 transition-colors duration-300"
            >
              Privacy Policy
            </motion.a>
            <motion.a
              href="#"
              whileHover={{ scale: 1.05, color: "#fbbf24" }}
              className="text-white/60 hover:text-yellow-300 transition-colors duration-300"
            >
              Terms of Service
            </motion.a>
            <motion.a
              href="#"
              whileHover={{ scale: 1.05, color: "#fbbf24" }}
              className="text-white/60 hover:text-yellow-300 transition-colors duration-300"
            >
              Cookie Policy
            </motion.a>
          </div>
        </div>
      </div>
    </motion.footer>
  );
};

export default Footer;
