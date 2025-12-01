import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { Bold, Italic, Heading2, List, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ImageUploadButton } from './ImageUploadButton';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  className?: string;
}

export const RichTextEditor = ({ content, onChange, className }: RichTextEditorProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
      }),
      Image,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose max-w-none min-h-[200px] p-4 focus:outline-none text-base',
      },
    },
  });

  if (!editor) {
    return null;
  }

  const addLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const validateImageFile = (file: File): boolean => {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please drop a JPEG, PNG, GIF, or WEBP image.",
        variant: "destructive",
      });
      return false;
    }

    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Image must be smaller than 5MB.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    if (!validateImageFile(file)) {
      return null;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const timestamp = Date.now();
      const fileName = `${timestamp}-${file.name}`;
      const filePath = `${user.id}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('email-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('email-images')
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive",
      });
      return null;
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (!file || !file.type.startsWith('image/')) {
      toast({
        title: "Invalid file",
        description: "Please drop an image file.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    const url = await uploadImage(file);
    setUploading(false);

    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run();
      toast({
        title: "Image uploaded",
        description: "Image has been added to your email.",
      });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleImageUploaded = (url: string) => {
    if (editor) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  return (
    <div 
      className={cn(
        'border border-input rounded-md bg-background transition-colors',
        isDragging && 'border-primary border-2 bg-primary/5',
        className
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <div className="border-b border-input p-2 flex flex-wrap gap-2">
        <Button
          type="button"
          variant={editor.isActive('bold') ? 'default' : 'outline'}
          size="lg"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className="h-12 px-4"
        >
          <Bold className="h-5 w-5 mr-2" />
          <span className="text-base">Bold</span>
        </Button>
        
        <Button
          type="button"
          variant={editor.isActive('italic') ? 'default' : 'outline'}
          size="lg"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className="h-12 px-4"
        >
          <Italic className="h-5 w-5 mr-2" />
          <span className="text-base">Italic</span>
        </Button>
        
        <Button
          type="button"
          variant={editor.isActive('heading') ? 'default' : 'outline'}
          size="lg"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className="h-12 px-4"
        >
          <Heading2 className="h-5 w-5 mr-2" />
          <span className="text-base">Heading</span>
        </Button>
        
        <Button
          type="button"
          variant={editor.isActive('bulletList') ? 'default' : 'outline'}
          size="lg"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className="h-12 px-4"
        >
          <List className="h-5 w-5 mr-2" />
          <span className="text-base">List</span>
        </Button>
        
        <Button
          type="button"
          variant={editor.isActive('link') ? 'default' : 'outline'}
          size="lg"
          onClick={addLink}
          className="h-12 px-4"
        >
          <LinkIcon className="h-5 w-5 mr-2" />
          <span className="text-base">Link</span>
        </Button>
        
        <ImageUploadButton 
          onImageUploaded={handleImageUploaded} 
          disabled={uploading || !editor}
        />
      </div>
      
      {isDragging && (
        <div className="absolute inset-0 flex items-center justify-center bg-primary/10 pointer-events-none">
          <p className="text-lg font-medium text-primary">Drop image here</p>
        </div>
      )}
      
      <EditorContent editor={editor} className="min-h-[200px] relative" />
    </div>
  );
};
