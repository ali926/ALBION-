// src/app/layout.tsx
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata = {
  title: "Albion Tool",
  description: "Albion Economic Toolkit (EU Server)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#0b0b0b] text-amber-200">

        {/* ---- FLEX ROW (Sidebar + Content) ---- */}
        <div className="flex min-h-screen">

          {/* --- FIXED SIDEBAR (Left) --- */}
          <div className="sticky top-0 h-screen">
            <Sidebar />
          </div>

          {/* --- MAIN CONTENT (Auto Height) --- */}
          <main className="flex-1 p-6 overflow-y-auto">
            {children}
          </main>

        </div>

      </body>
    </html>
  );
}
