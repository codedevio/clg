import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface FooterContent {
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

const defaultContent: FooterContent = {
  brand_name: 'QuizoraX',
  brand_description: 'A secure, backend-first quiz and survey platform built for academic assessments.',
  copyright_text: 'All rights reserved.',
  tagline: 'Built for Academic Excellence',
};

export const useFooterContent = () => {
  const [content, setContent] = useState<FooterContent>(defaultContent);
  const [links, setLinks] = useState<FooterLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFooterData();
  }, []);

  const fetchFooterData = async () => {
    try {
      const [contentRes, linksRes] = await Promise.all([
        supabase.from('footer_content').select('*').maybeSingle(),
        supabase.from('footer_links').select('*').eq('is_active', true).order('order_index'),
      ]);

      if (contentRes.data) {
        setContent(contentRes.data);
      }

      if (linksRes.data) {
        setLinks(linksRes.data);
      }
    } catch (error) {
      console.error('Error fetching footer content:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLinksBySection = (section: string) => 
    links.filter(link => link.section === section);

  return { content, links, getLinksBySection, loading, refetch: fetchFooterData };
};
