"use client";

import { Search as SearchIcon, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function SearchPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
        <SearchIcon className="w-8 h-8 text-emerald-400" /> Global Search
      </h1>

      <div className="relative mb-12">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-6 h-6" />
        <Input
          className="w-full h-16 pl-14 text-xl bg-black/40 border-emerald-900/30 rounded-2xl focus:ring-emerald-500/50"
          placeholder="Search for students, certificates, or hashes..."
        />
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Recent Searches</h3>
        <div className="space-y-2">
          {["Alice Johnson", "Certificate #88219", "Computer Science 2024", "Verification Hash 0x29..."].map((term) => (
            <div key={term} className="flex items-center gap-3 p-4 rounded-xl hover:bg-emerald-900/10 cursor-pointer transition-colors group">
              <Clock className="w-4 h-4 text-gray-600 group-hover:text-emerald-500" />
              <span className="text-gray-300 group-hover:text-white">{term}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
