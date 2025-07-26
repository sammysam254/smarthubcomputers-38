
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, X, Image, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImageUploadProps {
  onImagesUploaded: (urls: string[]) => void;
  maxFiles?: number;
  existingImages?: string[];
}

const ImageUpload = ({ onImagesUploaded, maxFiles = 10, existingImages = [] }: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [previewImages, setPreviewImages] = useState<string[]>(existingImages);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (files: FileList) => {
    if (files.length === 0) return;

    // Check if adding these files would exceed the limit
    if (previewImages.length + files.length > maxFiles) {
      toast({
        title: "Too many files",
        description: `Maximum ${maxFiles} images allowed`,
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    
    try {
      const formData = new FormData();
      Array.from(files).forEach((file, index) => {
        formData.append(`file${index}`, file);
      });

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      const newImages = [...previewImages, ...data.urls];
      setPreviewImages(newImages);
      onImagesUploaded(newImages);

      toast({
        title: "Upload successful",
        description: data.message,
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload images. Please try again.",
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileSelect(e.target.files);
    }
  };

  const removeImage = (index: number) => {
    const newImages = previewImages.filter((_, i) => i !== index);
    setPreviewImages(newImages);
    onImagesUploaded(newImages);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between">
        <label className="block text-sm font-medium">Product Images</label>
        <span className="text-xs text-muted-foreground">
          {previewImages.length}/{maxFiles} images
        </span>
      </div>

      {/* Image Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {previewImages.map((image, index) => (
          <Card key={index} className="relative group aspect-square">
            <CardContent className="p-0 h-full">
              <img
                src={image}
                alt={`Product image ${index + 1}`}
                className="w-full h-full object-cover rounded-lg"
              />
              <button
                onClick={() => removeImage(index)}
                className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-md"
                aria-label="Remove image"
              >
                <X className="h-3 w-3" />
              </button>
            </CardContent>
          </Card>
        ))}

        {/* Add More Button */}
        {previewImages.length < maxFiles && (
          <Card 
            className="aspect-square border-dashed border-2 border-muted-foreground/25 hover:border-primary/50 transition-colors cursor-pointer"
            onClick={triggerFileInput}
          >
            <CardContent className="p-0 h-full flex flex-col items-center justify-center text-muted-foreground hover:text-primary transition-colors">
              <Plus className="h-6 w-6 mb-2" />
              <span className="text-xs text-center px-2">Add Image</span>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Upload Area */}
      {previewImages.length === 0 && (
        <Card className="border-dashed border-2 border-muted-foreground/25 hover:border-primary/50 transition-colors">
          <CardContent className="p-6 text-center">
            <div className="space-y-4">
              <div className="flex flex-col items-center">
                <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-2">
                  Drag and drop images here, or click to browse
                </p>
                <p className="text-xs text-muted-foreground">
                  Supports: JPG, PNG, GIF (Max 10MB per file)
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={triggerFileInput}
                disabled={uploading}
                className="w-full sm:w-auto"
              >
                <Image className="h-4 w-4 mr-2" />
                {uploading ? 'Uploading...' : 'Choose Files'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileInputChange}
        className="hidden"
      />

      {uploading && (
        <div className="text-sm text-muted-foreground text-center">
          Uploading images...
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
