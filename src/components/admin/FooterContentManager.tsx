import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { LayoutTemplate, Loader2, Plus, Trash2, Edit2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FooterContent {
  id: string;
  brand_name: string;
  brand_description: string;
  copyright_text: string;
  tagline: string;
}

interface FooterLink {
  id: string;
  section: string;
  label: string;
  url: string;
  order_index: number;
  is_active: boolean;
}

const FooterContentManager = () => {
  const { toast } = useToast();
  const [content, setContent] = useState<FooterContent | null>(null);
  const [links, setLinks] = useState<FooterLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<FooterLink | null>(null);
  const [linkForm, setLinkForm] = useState({
    section: 'platform',
    label: '',
    url: '',
    order_index: 0,
    is_active: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [contentRes, linksRes] = await Promise.all([
        supabase.from('footer_content').select('*').maybeSingle(),
        supabase.from('footer_links').select('*').order('section').order('order_index'),
      ]);

      if (contentRes.data) setContent(contentRes.data);
      if (linksRes.data) setLinks(linksRes.data);
    } catch (error) {
      console.error('Error fetching footer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveContent = async () => {
    if (!content) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from('footer_content')
        .update({
          brand_name: content.brand_name,
          brand_description: content.brand_description,
          copyright_text: content.copyright_text,
          tagline: content.tagline,
          updated_at: new Date().toISOString(),
        })
        .eq('id', content.id);

      if (error) throw error;

      toast({
        title: 'Footer Content Updated',
        description: 'The footer content has been saved successfully.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update footer content.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveLink = async () => {
    setSaving(true);

    try {
      if (editingLink) {
        const { error } = await supabase
          .from('footer_links')
          .update(linkForm)
          .eq('id', editingLink.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('footer_links')
          .insert(linkForm);
        if (error) throw error;
      }

      toast({
        title: editingLink ? 'Link Updated' : 'Link Added',
        description: `Footer link has been ${editingLink ? 'updated' : 'added'} successfully.`,
      });

      setLinkDialogOpen(false);
      setEditingLink(null);
      setLinkForm({ section: 'platform', label: '', url: '', order_index: 0, is_active: true });
      fetchData();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to save link.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLink = async (id: string) => {
    try {
      const { error } = await supabase
        .from('footer_links')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Link Deleted',
        description: 'Footer link has been removed.',
      });
      
      fetchData();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to delete link.',
      });
    }
  };

  const handleToggleLinkActive = async (link: FooterLink) => {
    try {
      const { error } = await supabase
        .from('footer_links')
        .update({ is_active: !link.is_active })
        .eq('id', link.id);

      if (error) throw error;
      fetchData();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to toggle link.',
      });
    }
  };

  const openEditLink = (link: FooterLink) => {
    setEditingLink(link);
    setLinkForm({
      section: link.section,
      label: link.label,
      url: link.url,
      order_index: link.order_index,
      is_active: link.is_active,
    });
    setLinkDialogOpen(true);
  };

  if (loading) {
    return (
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12" />)}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <LayoutTemplate className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg">Footer Content</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Manage footer branding and links</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-6">
          {/* Branding Section */}
          {content && (
            <div className="space-y-4">
              <h4 className="font-medium text-sm sm:text-base">Branding</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">Brand Name</Label>
                  <Input
                    value={content.brand_name}
                    onChange={(e) => setContent({ ...content, brand_name: e.target.value })}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Tagline</Label>
                  <Input
                    value={content.tagline}
                    onChange={(e) => setContent({ ...content, tagline: e.target.value })}
                    className="text-sm"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Brand Description</Label>
                <Textarea
                  value={content.brand_description}
                  onChange={(e) => setContent({ ...content, brand_description: e.target.value })}
                  rows={2}
                  className="text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Copyright Text</Label>
                <Input
                  value={content.copyright_text}
                  onChange={(e) => setContent({ ...content, copyright_text: e.target.value })}
                  className="text-sm"
                />
              </div>
              <Button onClick={handleSaveContent} disabled={saving} className="w-full sm:w-auto">
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Branding
              </Button>
            </div>
          )}

          <Separator />

          {/* Links Section */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h4 className="font-medium text-sm sm:text-base">Footer Links</h4>
              <Button 
                size="sm" 
                onClick={() => {
                  setEditingLink(null);
                  setLinkForm({ section: 'platform', label: '', url: '', order_index: links.length, is_active: true });
                  setLinkDialogOpen(true);
                }}
                className="w-full sm:w-auto"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Link
              </Button>
            </div>

            <div className="space-y-2">
              {['platform', 'support'].map((section) => (
                <div key={section} className="space-y-2">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    {section}
                  </p>
                  {links.filter(l => l.section === section).map((link) => (
                    <div 
                      key={link.id} 
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 sm:p-3 bg-muted/30 rounded-lg"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className={`text-sm truncate ${!link.is_active ? 'text-muted-foreground line-through' : ''}`}>
                          {link.label}
                        </span>
                        <span className="text-xs text-muted-foreground truncate hidden sm:inline">
                          ({link.url})
                        </span>
                      </div>
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <Switch
                          checked={link.is_active}
                          onCheckedChange={() => handleToggleLinkActive(link)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditLink(link)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteLink(link.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Link Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="sm:max-w-md mx-4 sm:mx-0">
          <DialogHeader>
            <DialogTitle>{editingLink ? 'Edit Link' : 'Add Link'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Section</Label>
              <Select
                value={linkForm.section}
                onValueChange={(v) => setLinkForm({ ...linkForm, section: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="platform">Platform</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Label</Label>
              <Input
                value={linkForm.label}
                onChange={(e) => setLinkForm({ ...linkForm, label: e.target.value })}
                placeholder="Link text"
              />
            </div>
            <div className="space-y-2">
              <Label>URL</Label>
              <Input
                value={linkForm.url}
                onChange={(e) => setLinkForm({ ...linkForm, url: e.target.value })}
                placeholder="https:// or #section"
              />
            </div>
            <div className="space-y-2">
              <Label>Order</Label>
              <Input
                type="number"
                value={linkForm.order_index}
                onChange={(e) => setLinkForm({ ...linkForm, order_index: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button onClick={handleSaveLink} disabled={saving || !linkForm.label || !linkForm.url} className="w-full sm:w-auto">
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingLink ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FooterContentManager;
