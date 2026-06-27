"use client";

import { Users, MoreVertical, Mail, GraduationCap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const students = [
  { id: 1, name: "Alice Johnson", email: "alice@university.edu", course: "Computer Science", year: "2024", certs: 3 },
  { id: 2, name: "Bob Smith", email: "bob@university.edu", course: "Mechanical Eng.", year: "2023", certs: 1 },
  { id: 3, name: "Charlie Davis", email: "charlie@university.edu", course: "Data Science", year: "2025", certs: 0 },
  { id: 4, name: "Diana Prince", email: "diana@university.edu", course: "Cyber Security", year: "2024", certs: 5 },
  { id: 5, name: "Evan Wright", email: "evan@university.edu", course: "AI Systems", year: "2026", certs: 2 },
];

export default function StudentsPage() {
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Users className="w-8 h-8 text-emerald-400" /> Students
          </h1>
          <p className="text-gray-400">Manage student records and issuance eligibility.</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-500">
          Add Student
        </Button>
      </div>

      <div className="grid gap-4">
        {students.map((student) => (
          <Card key={student.id} className="bg-black/40 border-emerald-900/20 backdrop-blur-sm hover:bg-emerald-900/10 transition-colors">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-10 w-10 border border-emerald-900/50">
                  <AvatarFallback className="bg-emerald-900 text-emerald-200">{student.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-white">{student.name}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Mail className="w-3 h-3" /> {student.email}
                  </p>
                </div>
              </div>

              <div className="hidden md:block">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <GraduationCap className="w-4 h-4 text-emerald-500" />
                  {student.course}
                </div>
              </div>

              <div className="hidden md:block text-sm text-gray-500">
                Class of {student.year}
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right mr-4">
                  <p className="text-xl font-bold text-white">{student.certs}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Certificates</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-black border-emerald-900/30 text-white">
                    <DropdownMenuItem>View Profile</DropdownMenuItem>
                    <DropdownMenuItem>Issue Certificate</DropdownMenuItem>
                    <DropdownMenuItem className="text-red-400">Suspend</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
