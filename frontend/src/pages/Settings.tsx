import { useState, useEffect } from 'react';
import axios from 'axios';

interface Model {
  id: string;
  name: string;
  description: string;
  isPro: boolean;
}

export function Settings() {
  const [apiKey, setApiKey] = useState('');
  const [models, setModels] = useState<Model[]>([]);
  const [currentModel, setCurrentModel] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | ''; message: string }>({ type: '', message: '' });

  useEffect(() => {
    fetchCurrentConfig();
  }, []);

  const fetchCurrentConfig = async () => {
    setIsLoading(true);
    try {
      const [apiKeyResponse, modelsResponse] = await Promise.all([
        axios.get('http://localhost:8000/config/api-key'),
        axios.get('http://localhost:8000/config/models')
      ]);

      if (apiKeyResponse.data.data?.apiKey) {
        setApiKey(apiKeyResponse.data.data.apiKey);
      }
      
      setModels(modelsResponse.data.data.models);
      setCurrentModel(modelsResponse.data.data.currentModel);
    } catch (error) {
      console.error('Failed to fetch config:', error);
      setStatus({
        type: 'error',
        message: 'Failed to load configuration. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus({ type: '', message: '' });

    try {
      await axios.post('http://localhost:8000/config/api-key', { apiKey });
      setStatus({
        type: 'success',
        message: 'API key saved successfully!'
      });
    } catch (error) {
      setStatus({
        type: 'error',
        message: 'Failed to save API key. Please try again.'
      });
      console.error('Error saving API key:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleModelChange = async (modelId: string) => {
    setIsLoading(true);
    setStatus({ type: '', message: '' });

    try {
      await axios.post('http://localhost:8000/config/model', { model: modelId });
      setCurrentModel(modelId);
      setStatus({
        type: 'success',
        message: 'Model updated successfully!'
      });
    } catch (error) {
      setStatus({
        type: 'error',
        message: 'Failed to update model. Please try again.'
      });
      console.error('Error updating model:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-auto p-6 overflow-y-auto bg-dracula-background">
      <div className="max-w-screen-xl mx-auto">
        <div className="max-w-xl space-y-8">
          {/* API Key Section */}
          <section>
            <h2 className="text-xl font-semibold text-dracula-pink mb-6">API Configuration</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="apiKey" className="block text-sm font-medium text-dracula-foreground mb-1">
                  Hugging Face API Key
                </label>
                <input
                  type="password"
                  id="apiKey"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your Hugging Face API key"
                  className="w-full px-4 py-2 bg-dracula-current border border-dracula-comment/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-dracula-purple focus:border-transparent text-dracula-foreground placeholder-dracula-comment"
                  disabled={isLoading}
                />
                <p className="mt-1 text-sm text-dracula-comment">
                  You can find your API key in your{' '}
                  <a
                    href="https://huggingface.co/settings/tokens"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-dracula-cyan hover:text-dracula-pink"
                  >
                    Hugging Face account settings
                  </a>
                </p>
              </div>

              <button
                type="submit"
                className="px-4 py-2 bg-dracula-purple text-dracula-foreground rounded-lg hover:bg-dracula-pink transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading || !apiKey.trim()}
              >
                {isLoading ? 'Saving...' : 'Save API Key'}
              </button>
            </form>
          </section>

          {/* Model Info Section */}
          <section>
            <h2 className="text-xl font-semibold text-dracula-pink mb-6">Model Information</h2>
            <div className="p-4 rounded-lg border border-dracula-comment/20 bg-dracula-current">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full border-2 border-dracula-purple bg-dracula-purple" />
                <div>
                  <h3 className="text-lg font-medium text-dracula-foreground">Mistral 7B</h3>
                  <p className="mt-2 text-sm text-dracula-comment">A powerful language model for general-purpose chat and instruction following.</p>
                </div>
              </div>
            </div>
          </section>

          {status.message && (
            <div
              className={`p-3 rounded-lg ${
                status.type === 'success' 
                  ? 'bg-dracula-background border border-dracula-green/20 text-dracula-green' 
                  : 'bg-dracula-background border border-dracula-red/20 text-dracula-red'
              }`}
            >
              {status.message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 