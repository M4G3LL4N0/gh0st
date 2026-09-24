import React from "react";
import { Hero } from "./components/Hero";
import { Features } from "./components/Features";
import { Privacy } from "./components/Privacy";
import { Docs } from "./components/Docs";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";

export function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Hero />
        <Features />
        <Privacy />
        <Docs />
      </main>
      <Footer />
    </div>
  );
}