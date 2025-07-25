import { useState, useEffect } from 'react';
import ArticleListTable from './article-list-table';
import ManagementWrapper from './management-wrapper';
import type { Language } from '@/lib/db/schema';
import type { ArticleWithCalculations } from '@/lib/db/articles';
import { toast } from 'sonner';
import {
  fetchArticleList,
  saveArticlePropertiesAPI,
  saveArticleContentAPI,
  saveArticleCalculationsAPI,
  deleteArticleAPI,
  createNewArticleAPI,
  copyArticleAPI,
} from '@/lib/api/articles';
import { fetchLanguages } from '@/lib/api/blocks';
import { useTabReload } from './tabbed-interface-provider';

type ArticleListItem = {
  id: string;
  number: string;
  title: string;
  price: string | null;
  hideTitle: boolean;
  updatedAt: string;
  calculationCount: number;
  languages: string;
};

const ArticleManagement = () => {
  const [articles, setArticles] = useState<ArticleListItem[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [articlesData, languagesData] = await Promise.all([
        fetchArticleList(),
        fetchLanguages()
      ]);
      setArticles(articlesData);
      setLanguages(languagesData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  };

  // Set up reload functionality for articles
  useTabReload('articles', loadData);

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveArticleProperties = async (articleId: string, articleData: Parameters<typeof saveArticlePropertiesAPI>[1], reloadData: boolean = true) => {
    try {
      await saveArticlePropertiesAPI(articleId, articleData);
      // Only show toast for direct property saves (reloadData=true), not from ArticleDetail
      if (reloadData) {
        toast.success('Artikel-Eigenschaften gespeichert');
        await loadData();
      }
    } catch (error) {
      console.error('Error saving article properties:', error);
      toast.error('Fehler beim Speichern der Artikel-Eigenschaften');
    }
  };

  const handleSaveArticleContent = async (articleId: string, contentData: any[]) => {
    try {
      await saveArticleContentAPI(articleId, contentData);
      // Don't show toast when called from ArticleDetail - it handles its own success message
      // Reload data to reflect changes
      await loadData();
    } catch (error) {
      console.error('Error saving article content:', error);
      toast.error('Fehler beim Speichern der Artikel-Inhalte');
    }
  };

  const handleSaveArticleCalculations = async (articleId: string, calculations: any[]) => {
    try {
      await saveArticleCalculationsAPI(articleId, calculations);
      // Don't show toast when called from ArticleDetail - it handles its own success message
      // Reload data to reflect changes
      await loadData();
    } catch (error) {
      console.error('Error saving article calculations:', error);
      toast.error('Fehler beim Speichern der Artikel-Kalkulationen');
    }
  };

  const handleDeleteArticle = async (articleId: string) => {
    try {
      await deleteArticleAPI(articleId);
      toast.success('Artikel gelöscht');
      // Remove from local state immediately
      setArticles(prev => prev.filter(article => article.id !== articleId));
    } catch (error) {
      console.error('Error deleting article:', error);
      toast.error('Fehler beim Löschen des Artikels');
    }
  };

  const handleCreateArticle = async (): Promise<ArticleListItem> => {
    try {
      const articleCount = articles.length;
      const defaultNumber = `ART-${String(articleCount + 1).padStart(3, '0')}`;
      
      const newArticle = await createNewArticleAPI({
        name: 'Neuer Artikel',
        number: defaultNumber,
        description: 'Beschreibung des neuen Artikels',
        price: '0.00',
        hideTitle: false
      });
      toast.success('Neuer Artikel erstellt');
      
      // Convert to ArticleListItem format
      const articleListItem: ArticleListItem = {
        id: newArticle.id,
        number: newArticle.number,
        title: '-', // New articles don't have blockContent yet, so use dash
        price: newArticle.price,
        hideTitle: newArticle.hideTitle,
        updatedAt: newArticle.updatedAt,
        calculationCount: newArticle.calculations.length,
        languages: 'Keine Sprachen' // New articles don't have languages yet
      };
      
      setArticles(prev => [...prev, articleListItem]);
      return articleListItem;
    } catch (error) {
      console.error('Error creating article:', error);
      toast.error('Fehler beim Erstellen des Artikels');
      throw error;
    }
  };

  const handleCopyArticle = async (article: ArticleListItem): Promise<ArticleListItem> => {
    try {
      const copiedArticle = await copyArticleAPI(article);
      toast.success(`Artikel "${article.title}" wurde kopiert`);
      
      // Convert to ArticleListItem format
      const articleListItem: ArticleListItem = {
        id: copiedArticle.id,
        number: copiedArticle.number,
        title: '-', // Copied articles will get their title when data is reloaded
        price: copiedArticle.price,
        hideTitle: copiedArticle.hideTitle,
        updatedAt: copiedArticle.updatedAt,
        calculationCount: copiedArticle.calculations.length,
        languages: 'Keine Sprachen' // Copied articles will get their languages when data is reloaded
      };
      
      setArticles(prev => [...prev, articleListItem]);
      return articleListItem;
    } catch (error) {
      console.error('Error copying article:', error);
      toast.error('Fehler beim Kopieren des Artikels');
      throw error;
    }
  };

  return (
    <ManagementWrapper title="Artikelverwaltung" permission="artikel" loading={loading}>
      <ArticleListTable 
        data={articles}
        languages={languages}
        onSaveArticleProperties={handleSaveArticleProperties}
        onSaveArticleContent={handleSaveArticleContent}
        onSaveArticleCalculations={handleSaveArticleCalculations}
        onDeleteArticle={handleDeleteArticle}
        onCreateArticle={handleCreateArticle}
        onCopyArticle={handleCopyArticle}
      />
    </ManagementWrapper>
  );
};

export default ArticleManagement; 