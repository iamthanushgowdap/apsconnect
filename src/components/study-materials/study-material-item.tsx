"use client";

import React from 'react';
import type { StudyMaterial, StudyMaterialAttachment } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Download, Paperclip } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface StudyMaterialItemProps {
  material: StudyMaterial;
}

export function StudyMaterialItem({ material }: StudyMaterialItemProps) {
  const { toast } = useToast();

  const handleDownload = (attachment: StudyMaterialAttachment) => {
    // Mock download for localStorage. Real implementation would fetch from a URL.
    toast({ title: "Download Started (Mock)", description: `Downloading ${attachment.name}... This is a mock.`, duration: 3000 });
    const blob = new Blob([`Mock file content for ${attachment.name} (ID: ${attachment.mockFileId})`], { type: attachment.type });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = attachment.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl overflow-hidden">
      <CardHeader className="pb-3 pt-5 px-5 border-b">
        <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-md">
                 <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <div>
                <CardTitle className="text-lg font-semibold text-primary leading-tight">{material.title}</CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                    Branch: <Badge variant="outline" className="mr-1">{material.branch}</Badge>
                    Semester: <Badge variant="secondary">{material.semester}</Badge>
                </CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent className="px-5 py-4">
        {material.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{material.description}</p>
        )}
        {material.attachments.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-foreground mb-1.5">Files:</h4>
            <div className="space-y-1.5">
              {material.attachments.map((att) => (
                <Button
                  key={att.mockFileId}
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(att)}
                  className="w-full justify-start text-left h-auto py-1.5 px-2 text-xs"
                >
                  <Paperclip className="h-3.5 w-3.5 mr-2 flex-shrink-0 text-muted-foreground" />
                  <div className="flex flex-col overflow-hidden">
                    <span className="font-medium truncate" title={att.name}>{att.name}</span>
                    <span className="text-xs text-muted-foreground/80">({(att.size / (1024 * 1024)).toFixed(2)} MB)</span>
                  </div>
                  <Download className="h-3.5 w-3.5 ml-auto flex-shrink-0 text-primary" />
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground px-5 py-3 border-t bg-muted/30">
        Uploaded by {material.uploadedByDisplayName} &bull; {formatDistanceToNow(parseISO(material.uploadedAt), { addSuffix: true })}
      </CardFooter>
    </Card>
  );
}