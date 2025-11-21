import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, FileText } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { emailTemplateService, EmailTemplate } from "@/lib/email-template-service";
import { TemplateForm } from "./TemplateForm";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface TemplateListProps {
  onSelectTemplate?: (template: EmailTemplate) => void;
  selectionMode?: boolean;
}

export const TemplateList = ({ onSelectTemplate, selectionMode = false }: TemplateListProps) => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingTemplate, setDeletingTemplate] = useState<EmailTemplate | null>(null);

  const loadTemplates = async () => {
    try {
      const data = await emailTemplateService.fetchTemplates();
      setTemplates(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load templates",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingTemplate) return;
    
    try {
      await emailTemplateService.deleteTemplate(deletingTemplate.id);
      toast({
        title: "Success",
        description: "Template deleted successfully",
      });
      loadTemplates();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setDeletingTemplate(null);
    }
  };

  const getCategoryColor = (category: string | null) => {
    switch (category) {
      case 'announcement': return 'bg-blue-500';
      case 'newsletter': return 'bg-green-500';
      case 'update': return 'bg-yellow-500';
      case 'event': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return <div className="text-center py-8 text-lg">Loading templates...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Email Templates</h2>
        {!selectionMode && (
          <Button
            onClick={() => {
              setEditingTemplate(undefined);
              setFormOpen(true);
            }}
            className="h-14 text-lg px-8 font-semibold"
          >
            <Plus className="mr-2 h-5 w-5" />
            New Template
          </Button>
        )}
      </div>

      {templates.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">No templates yet</h3>
          <p className="text-muted-foreground mb-6 text-base">
            Create your first email template to reuse it in campaigns
          </p>
          <Button
            onClick={() => setFormOpen(true)}
            className="h-14 text-lg px-8 font-semibold"
          >
            <Plus className="mr-2 h-5 w-5" />
            Create First Template
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="space-y-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-xl">{template.name}</CardTitle>
                  {template.category && (
                    <Badge className={getCategoryColor(template.category)}>
                      {template.category}
                    </Badge>
                  )}
                </div>
                {template.description && (
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-1">Subject:</p>
                  <p className="text-base line-clamp-2">{template.subject}</p>
                </div>
                
                <div className="flex gap-2">
                  {selectionMode && onSelectTemplate ? (
                    <Button
                      onClick={() => onSelectTemplate(template)}
                      className="h-12 text-base flex-1 font-semibold"
                    >
                      Use Template
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => handleEdit(template)}
                        className="h-11 flex-1"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setDeletingTemplate(template);
                          setDeleteDialogOpen(true);
                        }}
                        className="h-11 flex-1 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <TemplateForm
        open={formOpen}
        onOpenChange={setFormOpen}
        template={editingTemplate}
        onSuccess={loadTemplates}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">Delete Template?</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Are you sure you want to delete "{deletingTemplate?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-12 text-base px-6">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="h-12 text-base px-6 bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
