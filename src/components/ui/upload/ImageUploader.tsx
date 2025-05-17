import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { Camera, Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageUploaderProps {
  onImageUploaded: (url: string) => void;
  currentImageUrl?: string;
  aspectRatio?: string;
  maxSizeInMB?: number;
  allowedTypes?: string[];
  className?: string;
  variant?: 'circle' | 'square';
  uploadEndpoint: string;
  buttonText?: string;
}

export function ImageUploader({
  onImageUploaded,
  currentImageUrl,
  aspectRatio = '1:1',
  maxSizeInMB = 5,
  allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  className = '',
  variant = 'square',
  uploadEndpoint,
  buttonText = 'Upload Image',
}: ImageUploaderProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewImage, setPreviewImage] = useState<string | null>(currentImageUrl || null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: `Please upload a valid image (${allowedTypes.join(', ')})`,
        variant: 'destructive',
      });
      return;
    }

    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeInMB) {
      toast({
        title: 'File too large',
        description: `Maximum file size is ${maxSizeInMB}MB`,
        variant: 'destructive',
      });
      return;
    }

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setPreviewImage(previewUrl);
    setSelectedFile(file);
    setIsDialogOpen(true);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const uploadImage = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', selectedFile);

      // Simulate upload progress (in a real app, this would use actual upload progress)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          const newProgress = prev + 10;
          if (newProgress >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return newProgress;
        });
      }, 300);

      // Upload the image to the server
      const response = await fetch(uploadEndpoint, {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Simulate a brief delay to show 100% progress
      setTimeout(() => {
        setIsUploading(false);
        setIsDialogOpen(false);
        
        // Pass the image URL back to the parent component
        onImageUploaded(result.url);
        
        toast({
          title: 'Upload successful',
          description: 'Your image has been uploaded',
        });
      }, 500);
    } catch (error) {
      console.error('Upload error:', error);
      setIsUploading(false);
      
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  };

  const cancelUpload = () => {
    setIsDialogOpen(false);
    setSelectedFile(null);
    if (previewImage && !currentImageUrl) {
      URL.revokeObjectURL(previewImage);
      setPreviewImage(currentImageUrl || null);
    }
  };

  const removeImage = () => {
    if (previewImage && !currentImageUrl) {
      URL.revokeObjectURL(previewImage);
    }
    setPreviewImage(null);
    onImageUploaded('');
  };

  const previewContainerClass = `
    relative overflow-hidden bg-gray-100 flex items-center justify-center border-2 border-dashed 
    border-gray-300 hover:border-gray-400 transition-colors
    ${variant === 'circle' ? 'rounded-full' : 'rounded-md'}
    ${className}
  `;

  return (
    <div className="space-y-4">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept={allowedTypes.join(',')}
        onChange={handleFileChange}
      />

      {previewImage ? (
        <div className={previewContainerClass} style={{ aspectRatio }}>
          <img
            src={previewImage}
            alt="Preview"
            className="w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={removeImage}
            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
            aria-label="Remove image"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          className={`${previewContainerClass} cursor-pointer`}
          style={{ aspectRatio }}
          onClick={triggerFileInput}
        >
          <div className="flex flex-col items-center justify-center p-4">
            <ImageIcon className="h-12 w-12 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500">Click to upload</p>
          </div>
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={triggerFileInput}
      >
        <Upload className="h-4 w-4 mr-2" />
        {buttonText}
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Image</DialogTitle>
            <DialogDescription>
              Preview and confirm your image upload
            </DialogDescription>
          </DialogHeader>

          {previewImage && (
            <div className="my-4 rounded-md overflow-hidden">
              <img
                src={previewImage}
                alt="Preview"
                className="w-full h-auto max-h-[300px] object-contain"
              />
            </div>
          )}

          {isUploading && (
            <div className="space-y-2">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-xs text-gray-500 text-center">
                Uploading: {uploadProgress}%
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={cancelUpload}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={uploadImage}
              disabled={isUploading}
            >
              {isUploading ? 'Uploading...' : 'Upload'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 