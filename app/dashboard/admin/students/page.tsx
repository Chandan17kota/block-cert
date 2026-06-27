"use client";

import { useEffect, useState } from "react";
import { Users, MoreVertical, Mail, GraduationCap, ShieldCheck, Search, Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Student {
    id: string;
    name: string;
    email: string;
    institution: string;
    joinedAt: string;
    pendingCerts: number;
}

export default function AdminStudentsPage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const res = await fetch("/api/students");
                if (!res.ok) throw new Error("Failed to fetch students");
                const data = await res.json();

                if (data.success) {
                    setStudents(data.students);
                } else {
                    setError(data.error || "Unknown error");
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStudents();
    }, []);

    // Filter logic
    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 max-w-7xl mx-auto">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <div>
                        <h5 className="font-medium mb-1">Error Loading Students</h5>
                        <AlertDescription>{error}</AlertDescription>
                    </div>
                </Alert>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                        <Users className="w-8 h-8 text-emerald-400" />
                        <span className="text-white">Institute Students</span>
                    </h1>
                    <p className="text-gray-400">Manage and verify students belonging to your institution.</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                        <Input
                            placeholder="Search students..."
                            className="pl-9 bg-black/40 border-emerald-900/30 text-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {/* <Button className="bg-emerald-600 hover:bg-emerald-500">
                        Add New Student
                    </Button> */}
                </div>
            </div>

            {/* Grid */}
            <div className="grid gap-4">
                {filteredStudents.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 border border-dashed border-gray-800 rounded-xl bg-black/20">
                        No students found.
                    </div>
                ) : (
                    filteredStudents.map((student) => (
                        <Card key={student.id} className="bg-black/40 border-emerald-900/20 backdrop-blur-sm hover:bg-emerald-900/10 transition-colors group">
                            <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">

                                {/* Identity */}
                                <div className="flex items-center gap-4 w-full md:w-auto">
                                    <Avatar className="h-12 w-12 border-2 border-emerald-900/50 group-hover:border-emerald-500/50 transition-colors">
                                        <AvatarFallback className="bg-emerald-950 text-emerald-200 font-mono">{student.name.charAt(0).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium text-lg text-white group-hover:text-emerald-300 transition-colors">{student.name}</p>
                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                            <Mail className="w-3 h-3" /> {student.email}
                                        </div>
                                    </div>
                                </div>

                                {/* Academic Info */}
                                <div className="flex items-center gap-6 text-sm text-gray-400">
                                    <div className="flex items-center gap-2 min-w-[140px]">
                                        <GraduationCap className="w-4 h-4 text-emerald-500" />
                                        Joined {new Date(student.joinedAt).getFullYear()}
                                    </div>
                                    {/* <div className="hidden md:block">
                                        Class of {student.year}
                                    </div> */}
                                </div>

                                {/* Status & Actions */}
                                <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                                    {student.pendingCerts > 0 ? (
                                        <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 hover:bg-yellow-500/20">
                                            {student.pendingCerts} Pending Approvals
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="border-emerald-900/30 text-gray-500">
                                            All Clear
                                        </Badge>
                                    )}

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-white">
                                                <MoreVertical className="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="bg-black border-emerald-900/30 text-white">
                                            <DropdownMenuItem className="focus:bg-emerald-900/20 focus:text-emerald-400 cursor-pointer">
                                                <Users className="w-4 h-4 mr-2" /> View Full Profile
                                            </DropdownMenuItem>
                                            {student.pendingCerts > 0 && (
                                                <DropdownMenuItem className="focus:bg-yellow-900/20 focus:text-yellow-400 cursor-pointer">
                                                    <ShieldCheck className="w-4 h-4 mr-2" /> Review Uploads
                                                </DropdownMenuItem>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
