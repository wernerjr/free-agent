import { useState, useEffect } from 'react';
import { Document } from '../types';
import axios from 'axios';
import { DocumentIcon, TrashIcon } from '@heroicons/react/24/outline';

export function Documents() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get('http://localhost:8000/documents');
      const docs = response.data.data?.documents || [];
      const processedDocs = docs.map((doc: Document) => ({
        ...doc,
        name: decodeURIComponent(doc.name),
        uploadedAt: new Date(doc.uploadedAt)
      }));
      setDocuments(Array.isArray(processedDocs) ? processedDocs : []);
    } catch (err) {
      setError('Failed to fetch documents');
      console.error('Error fetching documents:', err);
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (documentId: string) => {
    try {
      await axios.delete(`http://localhost:8000/documents/${documentId}`);
      setDocuments(docs => docs.filter(doc => doc.id !== documentId));
    } catch (err) {
      setError('Failed to delete document');
      console.error('Error deleting document:', err);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex-auto p-3 sm:p-6 overflow-y-auto bg-dracula-background">
      <div className="max-w-screen-xl mx-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-dracula-purple"></div>
          </div>
        ) : error ? (
          <div className="bg-dracula-background border border-dracula-red/20 text-dracula-red rounded-lg p-3 sm:p-4 text-sm sm:text-base">
            {error}
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <DocumentIcon className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-dracula-comment" />
            <h3 className="mt-2 text-sm sm:text-base font-medium text-dracula-foreground">No documents</h3>
            <p className="mt-1 text-xs sm:text-sm text-dracula-comment">
              Documents uploaded in chat will appear here
            </p>
          </div>
        ) : (
          <div className="bg-dracula-current shadow-lg rounded-lg overflow-hidden">
            <ul className="divide-y divide-dracula-comment/20">
              {documents.map((doc) => (
                <li key={doc.id} className="p-3 sm:p-4 hover:bg-dracula-background transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center min-w-0">
                      <DocumentIcon className="h-6 w-6 sm:h-8 sm:w-8 text-dracula-cyan" />
                      <div className="ml-3 sm:ml-4 min-w-0">
                        <p className="text-sm sm:text-base font-medium text-dracula-foreground truncate">
                          {doc.name}
                        </p>
                        <div className="flex flex-wrap items-center text-xs sm:text-sm text-dracula-comment gap-2">
                          <span>{formatFileSize(doc.size)}</span>
                          <span className="hidden sm:inline">•</span>
                          <span>{formatDate(doc.uploadedAt)}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="ml-3 sm:ml-4 p-2 text-dracula-comment hover:text-dracula-red rounded-full hover:bg-dracula-background transition-colors"
                    >
                      <TrashIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
} 