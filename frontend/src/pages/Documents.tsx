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
      setDocuments(response.data.documents);
    } catch (err) {
      setError('Failed to fetch documents');
      console.error('Error fetching documents:', err);
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
    <div className="flex-auto p-6 overflow-y-auto bg-dracula-background">
      <div className="max-w-screen-xl mx-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dracula-purple"></div>
          </div>
        ) : error ? (
          <div className="bg-dracula-background border border-dracula-red/20 text-dracula-red rounded-lg p-4">
            {error}
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12">
            <DocumentIcon className="mx-auto h-12 w-12 text-dracula-comment" />
            <h3 className="mt-2 text-sm font-medium text-dracula-foreground">No documents</h3>
            <p className="mt-1 text-sm text-dracula-comment">
              Documents uploaded in chat will appear here
            </p>
          </div>
        ) : (
          <div className="bg-dracula-current shadow-lg rounded-lg overflow-hidden">
            <ul className="divide-y divide-dracula-comment/20">
              {documents.map((doc) => (
                <li key={doc.id} className="p-4 hover:bg-dracula-background transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center min-w-0">
                      <DocumentIcon className="h-8 w-8 text-dracula-cyan" />
                      <div className="ml-4 min-w-0">
                        <p className="text-sm font-medium text-dracula-foreground truncate">
                          {doc.name}
                        </p>
                        <div className="flex items-center text-sm text-dracula-comment">
                          <span>{formatFileSize(doc.size)}</span>
                          <span className="mx-2">•</span>
                          <span>{formatDate(doc.uploadedAt)}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="ml-4 p-2 text-dracula-comment hover:text-dracula-red rounded-full hover:bg-dracula-background transition-colors"
                    >
                      <TrashIcon className="h-5 w-5" />
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