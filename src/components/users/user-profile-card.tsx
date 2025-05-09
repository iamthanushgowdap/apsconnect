"use client";

import React from 'react';
import type { UserProfile } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Mail, Briefcase, Award, GraduationCap, Users, BookOpen } from 'lucide-react';
import { getInitials } from '@/components/content/post-item-utils';

interface UserProfileCardProps {
  profile: UserProfile;
}

export function UserProfileCard({ profile }: UserProfileCardProps) {
  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 rounded-lg">
      <CardHeader className="flex flex-row items-center space-x-4 pb-3">
        <Avatar className="h-16 w-16">
          <AvatarImage src={profile.avatarDataUrl} alt={profile.displayName || profile.email} data-ai-hint="person avatar" />
          <AvatarFallback className="text-xl bg-muted text-muted-foreground">
            {getInitials(profile.displayName || profile.email)}
          </AvatarFallback>
        </Avatar>
        <div>
          <CardTitle className="text-lg font-semibold">{profile.displayName || 'N/A'}</CardTitle>
          <CardDescription className="text-sm">
            <Badge variant={profile.role === 'admin' ? 'destructive' : profile.role === 'faculty' ? 'secondary' : 'default'} className="capitalize mr-2">
              {profile.role}
            </Badge>
            {profile.usn && <span className="text-xs text-muted-foreground">USN: {profile.usn}</span>}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="text-sm space-y-2 pt-2">
        <div className="flex items-center text-muted-foreground">
          <Mail className="h-4 w-4 mr-2" />
          <span>{profile.email}</span>
        </div>
        {profile.role === 'student' && profile.branch && (
          <div className="flex items-center text-muted-foreground">
            <GraduationCap className="h-4 w-4 mr-2" />
            <span>{profile.branch} - {profile.semester}</span>
          </div>
        )}
        {profile.role === 'faculty' && (
          <>
            {profile.facultyTitle && (
              <div className="flex items-center text-muted-foreground">
                <Briefcase className="h-4 w-4 mr-2" />
                <span>{profile.facultyTitle}</span>
              </div>
            )}
            {profile.assignedBranches && profile.assignedBranches.length > 0 && (
              <div className="flex items-center text-muted-foreground">
                <Users className="h-4 w-4 mr-2" />
                <span>Branches: {profile.assignedBranches.join(', ')}</span>
              </div>
            )}
            {profile.assignedSemesters && profile.assignedSemesters.length > 0 && (
                <div className="flex items-center text-muted-foreground">
                    <BookOpen className="h-4 w-4 mr-2" />
                    <span>Semesters: {profile.assignedSemesters.join(', ')}</span>
                </div>
            )}
          </>
        )}
         {profile.role === 'pending' && (
          <div className={`flex items-center ${profile.rejectionReason ? 'text-red-600' : 'text-yellow-600'}`}>
            <Award className="h-4 w-4 mr-2" />
            <span>Status: Pending {profile.rejectionReason ? `(Rejected: ${profile.rejectionReason.substring(0,30)}...)` : '(Awaiting Approval)'}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}