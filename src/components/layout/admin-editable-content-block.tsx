
"use client";

import React, { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Edit3, Image as ImageIcon, Eye, EyeOff } from 'lucide-react';

const STORAGE_KEY = 'apsconnect_admin_editable_content';
const EDIT_PASSWORD = "9986";

interface EditableContent {
  imageSrc: string;
  imageVisible: boolean;
  textLine1: string;
  textLine2: string;
  textLine3: string;
  textLine4: string;
  textLine5: string;
  textLine6: string;
}

const defaultContent: EditableContent = {
  imageSrc: "", 
  imageVisible: true,
  textLine1: "Loading feature...",
  textLine2: "Please wait while we prepare the content.",
  textLine3: "This may take a few moments.",
  textLine4: "Almost there...",
  textLine5: "Thank you for your patience.",
  textLine6: "Preparing your experience.",
};

export function AdminEditableContentBlock() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState<EditableContent>(defaultContent);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [editFormState, setEditFormState] = useState<EditableContent>(defaultContent);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedContent = localStorage.getItem(STORAGE_KEY);
      if (storedContent) {
        try {
          const parsedContent = JSON.parse(storedContent);
          setContent(parsedContent);
          setEditFormState(parsedContent);
        } catch (e) {
          console.error("Failed to parse stored content for admin block", e);
          setContent(defaultContent);
          setEditFormState(defaultContent);
        }
      } else {
        setContent(defaultContent);
        setEditFormState(defaultContent);
      }
    }
  }, []);

  const handlePasswordSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (passwordInput === EDIT_PASSWORD) {
      setIsPasswordVerified(true);
      toast({ title: "Password Verified", description: "You can now edit the content." });
    } else {
      toast({ title: "Incorrect Password", variant: "destructive" });
    }
    setPasswordInput("");
  };

  const handleContentSave = () => {
    setContent(editFormState);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(editFormState));
    }
    toast({ title: "Content Updated", description: "The placeholder content has been saved." });
    setIsEditDialogOpen(false);
    setIsPasswordVerified(false); // Reset password verification
  };

  const handleOpenEditDialog = () => {
    // Refresh editFormState from current content when opening
    setEditFormState(content);
    setIsPasswordVerified(false); // Always ask for password
    setPasswordInput("");
    setIsEditDialogOpen(true);
  };
  
  const lineClasses = [
    "h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-48 mb-4",
    "h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[480px] mb-2.5",
    "h-2 bg-gray-200 rounded-full dark:bg-gray-700 mb-2.5",
    "h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[440px] mb-2.5",
    "h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[460px] mb-2.5",
    "h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[360px]",
  ];

  return (
    <div className="my-8 p-4 border border-border rounded-lg bg-card shadow-sm">
      <div role="status" className="space-y-8 animate-pulse md:space-y-0 md:space-x-8 rtl:space-x-reverse md:flex md:items-center">
        {content.imageVisible && (
          <div className="flex items-center justify-center w-full h-48 bg-gray-300 rounded-sm sm:w-96 dark:bg-gray-700">
            {content.imageSrc ? (
              <img src={content.imageSrc} alt="Placeholder" className="w-full h-full object-cover rounded-sm" />
            ) : (
              <svg className="w-10 h-10 text-gray-200 dark:text-gray-600" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 18">
                <path d="M18 0H2a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2Zm-5.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm4.376 10.481A1 1 0 0 1 16 15H4a1 1 0 0 1-.895-1.447l3.5-7A1 1 0 0 1 7.468 6a.965.965 0 0 1 .9.5l2.775 4.757 1.546-1.887a1 1 0 0 1 1.618.1l2.541 4a1 1 0 0 1 .028 1.011Z"/>
              </svg>
            )}
          </div>
        )}
        <div className="w-full">
          {[content.textLine1, content.textLine2, content.textLine3, content.textLine4, content.textLine5, content.textLine6].map((text, index) => (
            <div key={index} className={`${lineClasses[index]}`}>
              <span className="text-transparent">{text}</span>
            </div>
          ))}
        </div>
        <span className="sr-only">Loading...</span>
      </div>

      {user?.role === 'admin' && (
        <div className="mt-4 text-right">
          <Button variant="outline" size="sm" onClick={handleOpenEditDialog}>
            <Edit3 className="mr-2 h-4 w-4" /> Edit Placeholder
          </Button>
        </div>
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Placeholder Content</DialogTitle>
            <DialogDescription>
              {isPasswordVerified ? "Modify the content of the placeholder block." : "Enter password to edit."}
            </DialogDescription>
          </DialogHeader>
          {!isPasswordVerified ? (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <Label htmlFor="admin-password">Password</Label>
                <Input
                  id="admin-password"
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter password (9986)"
                />
              </div>
              <Button type="submit" className="w-full">Verify Password</Button>
            </form>
          ) : (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <div className="space-y-2">
                <Label htmlFor="edit-imageSrc">Image URL (leave blank for default SVG)</Label>
                <Input
                  id="edit-imageSrc"
                  value={editFormState.imageSrc}
                  onChange={(e) => setEditFormState({ ...editFormState, imageSrc: e.target.value })}
                  placeholder="https://example.com/image.png"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-imageVisible"
                  checked={editFormState.imageVisible}
                  onCheckedChange={(checked) => setEditFormState({ ...editFormState, imageVisible: !!checked })}
                />
                <Label htmlFor="edit-imageVisible">Show Image</Label>
              </div>
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="space-y-2">
                  <Label htmlFor={`edit-textLine${i}`}>Text Line ${i}`</Label>
                  <Textarea
                    id={`edit-textLine${i}`}
                    value={editFormState[`textLine${i}` as keyof EditableContent] as string}
                    onChange={(e) => setEditFormState({ ...editFormState, [`textLine${i}`]: e.target.value })}
                    rows={2}
                  />
                </div>
              ))}
              <DialogFooter className="sm:justify-end sticky bottom-0 bg-background py-3">
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="button" onClick={handleContentSave}>Save Changes</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
