"use client";

import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import Image from 'next/image'; // Import next/image
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
import { Edit3, UploadCloud, ImageIcon } from 'lucide-react';

const STORAGE_KEY = 'apsconnect_admin_editable_content_v2'; // Changed key for new structure
const EDIT_PASSWORD = "9986"; 

interface EditableContent {
  imageSrc: string;
  title: string;
  description: string;
  imageVisible: boolean; // Keep this to allow hiding image if needed, though new layout emphasizes it
  // Retain other text lines in case admin wants to store more info, even if not displayed in this layout
  textLine3: string;
  textLine4: string;
  textLine5: string;
  textLine6: string;
}

const defaultContent: EditableContent = {
  imageSrc: "https://picsum.photos/seed/adminblock/192/384", // Default placeholder image
  title: "Noteworthy Technology Acquisitions 2024",
  description: "Here are the biggest enterprise technology acquisitions of 2024 so far, in reverse chronological order.",
  imageVisible: true,
  textLine3: "",
  textLine4: "",
  textLine5: "",
  textLine6: "",
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
          // Ensure all fields from EditableContent are present, merging with defaults if not
          const mergedContent = { ...defaultContent, ...parsedContent };
          setContent(mergedContent);
          setEditFormState(mergedContent); 
        } catch (e) {
          console.error("Failed to parse stored content for admin block", e);
          setContent(defaultContent);
          setEditFormState(defaultContent);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultContent));
        }
      } else {
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
      if (file.size > 2 * 1024 * 1024) { 
        toast({ title: "File too large", description: "Image must be less than 2MB.", variant: "destructive" });
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
        toast({ title: "Invalid File Type", description: "Please upload a valid image (JPEG, PNG, GIF, WebP).", variant: "destructive" });
        return;
      }
      setSelectedImageFile(file);
      // Preview for the dialog
      readFileAsDataURL(file).then(dataUrl => {
        setEditFormState(prev => ({...prev, imageSrc: dataUrl}));
      });
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
        return; 
      }
    }
    // If no new file is selected, newContent.imageSrc already holds either the existing image or "" if removed.

    setContent(newContent);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newContent));
    }
    toast({ title: "Content Updated", description: "The content block has been saved." });
    setIsEditDialogOpen(false);
    setIsPasswordVerified(false); 
    setSelectedImageFile(null); 
  };

  const handleOpenEditDialog = () => {
    setEditFormState(content);
    setSelectedImageFile(null); 
    setIsPasswordVerified(false); 
    setPasswordInput("");
    setIsEditDialogOpen(true);
  };
  
  return (
    <div className="my-8 p-4">
      <div className="flex flex-col items-center bg-card border border-border rounded-lg shadow-sm md:flex-row md:max-w-2xl mx-auto hover:bg-muted/30 dark:border-border/50 dark:bg-card/80 dark:hover:bg-card/70">
        {content.imageVisible && content.imageSrc && (
          <div className="relative w-full md:w-48 h-96 md:h-auto md:min-h-[180px] rounded-t-lg md:rounded-none md:rounded-s-lg overflow-hidden">
            <Image 
              src={content.imageSrc} 
              alt={content.title || "Content image"} 
              layout="fill"
              objectFit="cover"
              data-ai-hint="article image"
            />
          </div>
        )}
        {!content.imageVisible && (
             <div className="flex items-center justify-center w-full md:w-48 h-48 md:h-auto bg-muted rounded-t-lg md:rounded-none md:rounded-s-lg">
                <ImageIcon className="w-16 h-16 text-muted-foreground" />
             </div>
        )}
        <div className="flex flex-col justify-between p-4 leading-normal flex-1">
            <h5 className="mb-2 text-2xl font-bold tracking-tight text-foreground dark:text-white">{content.title}</h5>
            <p className="mb-3 font-normal text-muted-foreground dark:text-gray-400">{content.description}</p>
        </div>
      </div>


      {user?.role === 'admin' && (
        <div className="mt-4 text-center md:text-right md:max-w-2xl mx-auto">
          <Button variant="outline" size="sm" onClick={handleOpenEditDialog}>
            <Edit3 className="mr-2 h-4 w-4" /> Edit Content Block
          </Button>
        </div>
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Content Block</DialogTitle>
            <DialogDescription>
              {isPasswordVerified ? "Modify the content of the block." : "Enter admin password to edit."}
            </DialogDescription>
          </DialogHeader>
          {!isPasswordVerified ? (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <Label htmlFor="admin-content-password">Password</Label>
                <Input
                  id="admin-content-password"
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter password"
                />
              </div>
              <Button type="submit" className="w-full">Verify Password</Button>
            </form>
          ) : (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              <div className="space-y-2">
                <Label htmlFor="edit-content-imageFile">Upload Image</Label>
                <div className="flex items-center justify-center w-full">
                  <label htmlFor="admin-content-image-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/75 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <UploadCloud className="w-8 h-8 mb-2 text-muted-foreground" />
                          <p className="mb-1 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag &amp; drop</p>
                          <p className="text-xs text-muted-foreground">PNG, JPG, GIF, WebP (MAX. 2MB)</p>
                      </div>
                      <Input 
                          id="admin-content-image-upload" 
                          type="file" 
                          className="sr-only" 
                          accept="image/png, image/jpeg, image/gif, image/webp"
                          onChange={handleImageFileChange}
                      />
                  </label>
                </div>
                {selectedImageFile && <p className="text-xs text-muted-foreground mt-1">New: {selectedImageFile.name}</p>}
                {!selectedImageFile && editFormState.imageSrc && (
                    <div className="mt-2">
                        <p className="text-xs text-muted-foreground">Current Image:</p>
                        <Image src={editFormState.imageSrc} alt="Current content image" width={80} height={80} className="rounded border" data-ai-hint="article image" />
                        <Button variant="link" size="sm" className="text-destructive h-auto p-0 text-xs" onClick={() => {
                           setEditFormState(prev => ({...prev, imageSrc: ""}));
                           setSelectedImageFile(null);
                           const fileInput = document.getElementById('admin-content-image-upload') as HTMLInputElement;
                           if (fileInput) fileInput.value = "";
                        }}>Remove current image</Button>
                    </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-content-imageVisible"
                  checked={editFormState.imageVisible}
                  onCheckedChange={(checked) => setEditFormState({ ...editFormState, imageVisible: !!checked })}
                />
                <Label htmlFor="edit-content-imageVisible">Show Image</Label>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-content-title">Title</Label>
                <Input
                  id="edit-content-title"
                  value={editFormState.title}
                  onChange={(e) => setEditFormState({ ...editFormState, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-content-description">Description</Label>
                <Textarea
                  id="edit-content-description"
                  value={editFormState.description}
                  onChange={(e) => setEditFormState({ ...editFormState, description: e.target.value })}
                  rows={3}
                />
              </div>
              {/* Hidden fields for other text lines if needed for other layouts in future */}
              {[3, 4, 5, 6].map(i => (
                <input
                    type="hidden"
                    key={`textLine${i}`}
                    value={editFormState[`textLine${i}` as keyof EditableContent] as string}
                 />
              ))}

              <DialogFooter className="sm:justify-end sticky bottom-0 bg-background py-3 -mx-2 px-2">
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