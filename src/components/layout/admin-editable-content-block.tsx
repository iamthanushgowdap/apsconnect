"use client";

import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
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
import { Edit3, Image as ImageIcon, Eye, EyeOff, UploadCloud } from 'lucide-react';

const STORAGE_KEY = 'apsconnect_admin_editable_content';
const EDIT_PASSWORD = "9986"; // This remains the actual password, but won't be displayed

interface EditableContent {
  imageSrc: string; // Will store data URI for uploaded images
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

const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};


export function AdminEditableContentBlock() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState<EditableContent>(defaultContent);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [editFormState, setEditFormState] = useState<EditableContent>(defaultContent);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedContent = localStorage.getItem(STORAGE_KEY);
      if (storedContent) {
        try {
          const parsedContent = JSON.parse(storedContent);
          setContent(parsedContent);
          setEditFormState(parsedContent); // Initialize form with stored content
        } catch (e) {
          console.error("Failed to parse stored content for admin block", e);
          setContent(defaultContent);
          setEditFormState(defaultContent);
        }
      } else {
        // Set default content if nothing is stored
        setContent(defaultContent);
        setEditFormState(defaultContent);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultContent));
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

  const handleImageFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({ title: "File too large", description: "Image must be less than 2MB.", variant: "destructive" });
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
        toast({ title: "Invalid File Type", description: "Please upload a valid image (JPEG, PNG, GIF, WebP).", variant: "destructive" });
        return;
      }
      setSelectedImageFile(file);
      // Optionally, show a preview if editFormState.imageSrc is updated here
      // For now, we'll process it on save
    }
  };

  const handleContentSave = async () => {
    const newContent = { ...editFormState };
    if (selectedImageFile) {
      try {
        const dataUrl = await readFileAsDataURL(selectedImageFile);
        newContent.imageSrc = dataUrl;
      } catch (error) {
        toast({ title: "Image Upload Error", description: "Could not process the image file.", variant: "destructive" });
        return; // Prevent saving if image processing fails
      }
    } else if (editFormState.imageSrc === "" && content.imageSrc !== "") {
      // If imageSrc was cleared in form and there was an old image, keep it cleared
      newContent.imageSrc = "";
    }


    setContent(newContent);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newContent));
    }
    toast({ title: "Content Updated", description: "The placeholder content has been saved." });
    setIsEditDialogOpen(false);
    setIsPasswordVerified(false); // Reset password verification
    setSelectedImageFile(null); // Clear selected file
  };

  const handleOpenEditDialog = () => {
    // Refresh editFormState from current content when opening
    setEditFormState(content);
    setSelectedImageFile(null); // Reset file input on dialog open
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
              <img src={content.imageSrc} alt="Placeholder" className="w-full h-full object-cover rounded-sm" data-ai-hint="abstract banner" />
            ) : (
              <ImageIcon className="w-10 h-10 text-gray-200 dark:text-gray-600" aria-hidden="true" />
            )}
          </div>
        )}
        <div className="w-full">
          {[content.textLine1, content.textLine2, content.textLine3, content.textLine4, content.textLine5, content.textLine6].map((text, index) => (
            <div key={index} className={`${lineClasses[index]}`}>
              <span className="text-transparent">{text || "Loading..."}</span>
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
              {isPasswordVerified ? "Modify the content of the placeholder block." : "Enter admin password to edit."}
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
                  placeholder="Enter password"
                />
              </div>
              <Button type="submit" className="w-full">Verify Password</Button>
            </form>
          ) : (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <div className="space-y-2">
                <Label htmlFor="edit-imageFile">Upload Image (Optional)</Label>
                <div className="flex items-center justify-center w-full">
                  <label htmlFor="admin-image-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/75 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <UploadCloud className="w-8 h-8 mb-2 text-muted-foreground" />
                          <p className="mb-1 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag & drop</p>
                          <p className="text-xs text-muted-foreground">PNG, JPG, GIF, WebP (MAX. 2MB)</p>
                      </div>
                      <Input 
                          id="admin-image-upload" 
                          type="file" 
                          className="sr-only" 
                          accept="image/png, image/jpeg, image/gif, image/webp"
                          onChange={handleImageFileChange}
                      />
                  </label>
                </div>
                {selectedImageFile && <p className="text-xs text-muted-foreground mt-1">Selected: {selectedImageFile.name}</p>}
                {!selectedImageFile && editFormState.imageSrc && <p className="text-xs text-muted-foreground mt-1">Current image will be kept. Upload a new one to replace.</p>}
                {selectedImageFile && <Button variant="link" size="sm" className="text-destructive h-auto p-0" onClick={() => {setSelectedImageFile(null); if (document.getElementById('admin-image-upload') as HTMLInputElement) (document.getElementById('admin-image-upload') as HTMLInputElement).value = "";}}>Clear selection</Button>}
                 {!selectedImageFile && editFormState.imageSrc && (
                  <Button variant="link" size="sm" className="text-destructive h-auto p-0" onClick={() => setEditFormState(prev => ({...prev, imageSrc: ""}))}>Remove current image</Button>
                )}
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
