import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { Bold, Italic, Heading2, List, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  className?: string;
}

export const RichTextEditor = ({ content, onChange, className }: RichTextEditorProps) => {
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

  const addImage = () => {
    const url = window.prompt('Enter image URL:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  return (
    <div className={cn('border border-input rounded-md bg-background', className)}>
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
        
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={addImage}
          className="h-12 px-4"
        >
          <ImageIcon className="h-5 w-5 mr-2" />
          <span className="text-base">Image</span>
        </Button>
      </div>
      
      <EditorContent editor={editor} className="min-h-[200px]" />
    </div>
  );
};
