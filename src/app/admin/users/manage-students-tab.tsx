
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile, Branch } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, AlertCircle, Users, Loader2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function ManageStudentsTab() {
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  const fetchUsers = useCallback(() => {
    setIsLoading(true);
    if (typeof window !== 'undefined') {
      const users: UserProfile[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('campus_connect_user_')) {
          try {
            const user = JSON.parse(localStorage.getItem(key) || '{}') as UserProfile;
            // Ensure it's a student or pending student profile (identified by USN in uid)
            if (user.uid && user.usn && (user.role === 'student' || user.role === 'pending')) {
              users.push(user);
            }
          } catch (error) {
            console.error("Failed to parse user from localStorage:", key, error);
          }
        }
      }
      setAllUsers(users.sort((a,b) => new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime()));
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleApproveStudent = (usn: string) => {
    if (typeof window !== 'undefined') {
      const userKey = `campus_connect_user_${usn}`;
      const userDataStr = localStorage.getItem(userKey);
      if (userDataStr) {
        try {
          const user = JSON.parse(userDataStr) as UserProfile;
          user.role = 'student';
          user.isApproved = true;
          localStorage.setItem(userKey, JSON.stringify(user));
          
          // Also update mockUser if this user is currently logged in and pending
          const mockUserStr = localStorage.getItem('mockUser');
          if (mockUserStr) {
            const mockUser = JSON.parse(mockUserStr);
            if (mockUser.usn === usn && mockUser.role === 'pending') {
              mockUser.role = 'student';
              localStorage.setItem('mockUser', JSON.stringify(mockUser));
            }
          }

          toast({
            title: 'Student Approved',
            description: `${user.displayName || user.usn} has been approved.`,
          });
          fetchUsers(); // Refresh list
        } catch (error) {
          toast({
            title: 'Error Approving Student',
            description: 'Could not update student status.',
            variant: 'destructive',
          });
          console.error("Error approving student:", error);
        }
      }
    }
  };
  
  const filteredUsers = allUsers.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.displayName?.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      user.usn?.toLowerCase().includes(searchLower) ||
      user.branch?.toLowerCase().includes(searchLower)
    );
  });

  const pendingStudents = filteredUsers.filter(user => user.role === 'pending' && !user.isApproved);
  const approvedStudents = filteredUsers.filter(user => user.role === 'student' && user.isApproved);


  if (isLoading) {
    return <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <span className="ml-2">Loading students...</span></div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="text-destructive h-6 w-6" />
            Pending Student Approvals
          </CardTitle>
          <CardDescription>Review and approve new student registrations.</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingStudents.length === 0 ? (
            <p className="text-muted-foreground">No students pending approval.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>USN</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Registered On</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingStudents.map(student => (
                  <TableRow key={student.uid}>
                    <TableCell>{student.displayName || 'N/A'}</TableCell>
                    <TableCell>{student.usn}</TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell>{student.branch || student.usn?.substring(5,7) || 'N/A'}</TableCell>
                    <TableCell>{new Date(student.registrationDate).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" onClick={() => handleApproveStudent(student.usn!)} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                        <CheckCircle className="mr-2 h-4 w-4" /> Approve
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="text-primary h-6 w-6" />
            Approved Students List
          </CardTitle>
           <CardDescription>View and manage all approved student accounts.</CardDescription>
           <div className="relative mt-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search students by name, USN, email, branch..."
              className="pl-8 w-full sm:w-1/2 lg:w-1/3"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {approvedStudents.length === 0 && searchTerm === '' ? (
             <p className="text-muted-foreground">No approved students found.</p>
          ) : approvedStudents.length === 0 && searchTerm !== '' ? (
             <p className="text-muted-foreground">No students match your search criteria.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>USN</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approvedStudents.map(student => (
                  <TableRow key={student.uid}>
                    <TableCell>{student.displayName || 'N/A'}</TableCell>
                    <TableCell>{student.usn}</TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell>{student.branch || student.usn?.substring(5,7) || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant="default" className="bg-green-500/20 text-green-700 hover:bg-green-500/30">Approved</Badge>
                    </TableCell>
                    {/* Add actions like Edit/Delete/View Profile if needed later */}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
