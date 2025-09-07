import React, { useState, useEffect } from 'react';
import { Search, Brain, Shield, Plus, Settings, BarChart3, Zap, Users, Lock, Eye, Database, Activity, Clock, Tag } from 'lucide-react';

// API Client
class MemoryStreamAPI {
  constructor(baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3000') {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('memorystream_token');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    if (this.token && !options.skipAuth) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'API request failed');
    }

    return data;
  }

  async login(email, password) {
    const data = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    this.token = data.token;
    localStorage.setItem('memorystream_token', data.token);
    return data;
  }

  async register(name, email, password) {
    const data = await this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    });
    this.token = data.token;
    localStorage.setItem('memorystream_token', data.token);
    return data;
  }

  async createMemory(content, type, source, tags = [], metadata = {}) {
    return this.request('/api/memories', {
      method: 'POST',
      body: JSON.stringify({ content, type, source, tags, metadata })
    });
  }

  async searchMemories(query, context = {}, limit = 20) {
    return this.request('/api/memories/search', {
      method: 'POST',
      body: JSON.stringify({ query, context, limit })
    });
  }

  async getMemories(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/api/memories?${queryString}`);
  }

  async getDashboardStats() {
    return this.request('/api/dashboard/stats');
  }

  logout() {
    this.token = null;
    localStorage.removeItem('memorystream_token');
  }
}

const api = new MemoryStreamAPI();

// Main App Component
export default function MemoryStreamApp() {
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('memorystream_token');
    if (token) {
      loadDashboard();
    } else {
      setLoading(false);
    }
  }, []);

  const loadDashboard = async () => {
    try {
      const stats = await api.getDashboardStats();
      setUser(stats.user);
      setLoading(false);
    } catch (err) {
      setError('Session expired. Please log in again.');
      api.logout();
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <AuthScreen onAuth={setUser} setError={setError} error={error} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="flex">
        <Sidebar currentView={currentView} setCurrentView={setCurrentView} user={user} />
        <MainContent currentView={currentView} user={user} />
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <Brain className="w-16 h-16 text-purple-400 mx-auto mb-4 animate-pulse" />
        <h2 className="text-2xl font-bold text-white mb-2">MemoryStream</h2>
        <div className="w-32 h-1 bg-purple-400 rounded animate-pulse mx-auto"></div>
      </div>
    </div>
  );
}

function AuthScreen({ onAuth, setError, error }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      let result;
      if (isLogin) {
        result = await api.login(formData.email, formData.password);
      } else {
        result = await api.register(formData.name, formData.email, formData.password);
      }
      
      onAuth(result.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800 rounded-2xl p-8 border border-slate-700">
        <div className="text-center mb-8">
          <Brain className="w-12 h-12 text-purple-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">MemoryStream</h1>
          <p className="text-slate-400">Universal AI Memory & Context</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter your full name"
                required={!isLogin}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Password
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter your password"
              required
              minLength={8}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-purple-400 hover:text-purple-300 text-sm"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Sidebar({ currentView, setCurrentView, user }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'memories', label: 'Memories', icon: Brain },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'integrations', label: 'AI Services', icon: Zap },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="w-64 bg-slate-800 border-r border-slate-700 min-h-screen">
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <Brain className="w-8 h-8 text-purple-400" />
          <div>
            <h2 className="text-xl font-bold text-white">MemoryStream</h2>
            <p className="text-xs text-slate-400">AI Memory Hub</p>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="mb-6">
          <div className="flex items-center space-x-3 p-3 bg-slate-700 rounded-lg">
            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-white text-sm font-medium">{user.name}</p>
              <p className="text-slate-400 text-xs">{user.email}</p>
            </div>
          </div>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  currentView === item.id
                    ? 'bg-purple-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="absolute bottom-4 left-4 right-4">
        <button
          onClick={() => {
            api.logout();
            window.location.reload();
          }}
          className="w-full text-slate-400 hover:text-white text-sm py-2"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}

function MainContent({ currentView, user }) {
  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard user={user} />;
      case 'memories':
        return <MemoriesView />;
      case 'search':
        return <SearchView />;
      case 'integrations':
        return <IntegrationsView />;
      case 'settings':
        return <SettingsView user={user} />;
      default:
        return <Dashboard user={user} />;
    }
  };

  return (
    <div className="flex-1 p-8">
      {renderView()}
    </div>
  );
}

function Dashboard({ user }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-white">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Welcome back, {user.name}!</h1>
        <p className="text-slate-400">Here's your AI memory overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Memories"
          value={stats?.memories?.total || 0}
          icon={Database}
          color="purple"
        />
        <StatCard
          title="AI Services"
          value={stats?.services?.active || 0}
          icon={Zap}
          color="blue"
        />
        <StatCard
          title="Recent Activity"
          value={stats?.memories?.recentActivity || 0}
          icon={Activity}
          color="green"
        />
        <StatCard
          title="Total Requests"
          value={stats?.services?.totalRequests || 0}
          icon={BarChart3}
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-xl font-semibold text-white mb-4">Memory Breakdown</h3>
          <div className="space-y-3">
            {stats?.memories?.byType && Object.entries(stats.memories.byType).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <span className="text-slate-300 capitalize">{type}</span>
                <span className="text-white font-medium">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-xl font-semibold text-white mb-4">Privacy Settings</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Privacy Level</span>
              <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-sm">
                {stats?.privacy?.privacyLevel || 'High'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Cross-Platform Sync</span>
              <span className={`px-2 py-1 rounded text-sm ${
                stats?.privacy?.crossPlatformSync 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {stats?.privacy?.crossPlatformSync ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }) {
  const colorClasses = {
    purple: 'bg-purple-500/20 text-purple-400',
    blue: 'bg-blue-500/20 text-blue-400',
    green: 'bg-green-500/20 text-green-400',
    orange: 'bg-orange-500/20 text-orange-400'
  };

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-400 text-sm">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

function MemoriesView() {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    loadMemories();
  }, []);

  const loadMemories = async () => {
    try {
      const data = await api.getMemories({ limit: 50 });
      setMemories(data.memories || []);
    } catch (err) {
      console.error('Failed to load memories:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-white">Loading memories...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Your Memories</h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add Memory</span>
        </button>
      </div>

      {showAddForm && (
        <AddMemoryForm 
          onClose={() => setShowAddForm(false)} 
          onSuccess={() => {
            setShowAddForm(false);
            loadMemories();
          }}
        />
      )}

      <div className="grid gap-4">
        {memories.map((memory) => (
          <MemoryCard key={memory.id} memory={memory} />
        ))}
        {memories.length === 0 && (
          <div className="text-center py-12">
            <Brain className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-400 mb-2">No memories yet</h3>
            <p className="text-slate-500">Start building your AI memory by adding your first memory.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function MemoryCard({ memory }) {
  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
      <div className="flex justify-between items-start mb-4">
        <div>
          <span className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded text-sm">
            {memory.type}
          </span>
          <span className="ml-2 text-slate-400 text-sm">from {memory.source}</span>
        </div>
        <span className="text-slate-500 text-sm">
          {new Date(memory.timestamp).toLocaleDateString()}
        </span>
      </div>
      
      {memory.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {memory.tags.map((tag, index) => (
            <span key={index} className="bg-slate-700 text-slate-300 px-2 py-1 rounded text-xs flex items-center">
              <Tag className="w-3 h-3 mr-1" />
              {tag}
            </span>
          ))}
        </div>
      )}
      
      <div className="flex justify-between items-center text-sm text-slate-400">
        <span>Accessed {memory.accessCount || 0} times</span>
        <span>Relevance: {(memory.relevanceScore || 0).toFixed(1)}/10</span>
      </div>
    </div>
  );
}

function AddMemoryForm({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    content: '',
    type: 'note',
    source: '',
    tags: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const tags = formData.tags.split(',').map(tag => tag.trim()).filter(Boolean);
      await api.createMemory(formData.content, formData.type, formData.source, tags);
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
      <h3 className="text-xl font-semibold text-white mb-4">Add New Memory</h3>
      
      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Content</label>
          <textarea
            value={formData.content}
            onChange={(e) => setFormData({...formData, content: e.target.value})}
            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Enter the memory content..."
            rows={4}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value})}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="note">Note</option>
              <option value="conversation">Conversation</option>
              <option value="document">Document</option>
              <option value="insight">Insight</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Source</label>
            <input
              type="text"
              value={formData.source}
              onChange={(e) => setFormData({...formData, source: e.target.value})}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="e.g., ChatGPT, Meeting, Email"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Tags (comma-separated)</label>
          <input
            type="text"
            value={formData.tags}
            onChange={(e) => setFormData({...formData, tags: e.target.value})}
            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="e.g., work, ai, research"
          />
        </div>

        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add Memory'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="bg-slate-600 hover:bg-slate-700 text-white px-6 py-2 rounded-lg"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function SearchView() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const data = await api.searchMemories(query);
      setResults(data.results || []);
      setHasSearched(true);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Search Memories</h1>

      <form onSubmit={handleSearch} className="flex space-x-4">
        <div className="flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Search your memories..."
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 disabled:opacity-50"
        >
          <Search className="w-5 h-5" />
          <span>{loading ? 'Searching...' : 'Search'}</span>
        </button>
      </form>

      {hasSearched && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">
            {results.length} result{results.length !== 1 ? 's' : ''} found
          </h3>
          <div className="space-y-4">
            {results.map((result) => (
              <SearchResultCard key={result.id} result={result} />
            ))}
            {results.length === 0 && (
              <div className="text-center py-8">
                <Search className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No memories found for your search.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SearchResultCard({ result }) {
  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center space-x-3">
          <span className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded text-sm">
            {result.type}
          </span>
          <span className="text-slate-400 text-sm">from {result.source}</span>
        </div>
        <div className="flex items-center space-x-4 text-sm text-slate-400">
          <span>Relevance: {result.relevanceScore.toFixed(1)}/10</span>
          <span>{new Date(result.timestamp).toLocaleDateString()}</span>
        </div>
      </div>
      
      <p className="text-white mb-3 line-clamp-3">{result.content}</p>
      
      {result.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {result.tags.map((tag, index) => (
            <span key={index} className="bg-slate-700 text-slate-300 px-2 py-1 rounded text-xs flex items-center">
              <Tag className="w-3 h-3 mr-1" />
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function IntegrationsView() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">AI Service Integrations</h1>
      
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h3 className="text-xl font-semibold text-white mb-4">Available Integrations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <IntegrationCard
            name="ChatGPT"
            description="Connect your ChatGPT conversations"
            status="available"
            icon="🤖"
          />
          <IntegrationCard
            name="Claude"
            description="Sync with Claude AI interactions"
            status="available"
            icon="🧠"
          />
          <IntegrationCard
            name="Google Bard"
            description="Import Bard conversation history"
            status="coming-soon"
            icon="🌟"
          />
        </div>
      </div>
  <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
       <h3 className="text-xl font-semibold text-white mb-4">Developer API</h3>
       <p className="text-slate-400 mb-4">
         Use our API to integrate MemoryStream with your own AI applications.
       </p>
       <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm text-green-400">
         <p>POST /api/external/memories/context</p>
         <p className="mt-2 text-slate-500">// Get relevant context for AI interactions</p>
       </div>
     </div>
   </div>
 );
}

function IntegrationCard({ name, description, status, icon }) {
 return (
   <div className="bg-slate-700 rounded-lg p-4 border border-slate-600">
     <div className="flex items-center space-x-3 mb-3">
       <span className="text-2xl">{icon}</span>
       <div>
         <h4 className="text-white font-medium">{name}</h4>
         <p className="text-slate-400 text-sm">{description}</p>
       </div>
     </div>
     <button
       className={`w-full py-2 px-4 rounded-lg text-sm font-medium ${
         status === 'available'
           ? 'bg-purple-600 hover:bg-purple-700 text-white'
           : 'bg-slate-600 text-slate-400 cursor-not-allowed'
       }`}
       disabled={status !== 'available'}
     >
       {status === 'available' ? 'Connect' : 'Coming Soon'}
     </button>
   </div>
 );
}

function SettingsView({ user }) {
 return (
   <div className="space-y-6">
     <h1 className="text-3xl font-bold text-white">Settings</h1>

     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
       <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
         <h3 className="text-xl font-semibold text-white mb-4">Privacy & Security</h3>
         <div className="space-y-4">
           <div className="flex items-center justify-between">
             <div>
               <p className="text-white font-medium">End-to-End Encryption</p>
               <p className="text-slate-400 text-sm">Your memories are encrypted with your keys</p>
             </div>
             <div className="flex items-center">
               <Shield className="w-5 h-5 text-green-400" />
               <span className="ml-2 text-green-400 text-sm">Enabled</span>
             </div>
           </div>
           
           <div className="flex items-center justify-between">
             <div>
               <p className="text-white font-medium">Cross-Platform Sync</p>
               <p className="text-slate-400 text-sm">Sync memories across devices</p>
             </div>
             <label className="relative inline-flex items-center cursor-pointer">
               <input type="checkbox" className="sr-only peer" defaultChecked />
               <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
             </label>
           </div>
         </div>
       </div>

       <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
         <h3 className="text-xl font-semibold text-white mb-4">Account Information</h3>
         <div className="space-y-3">
           <div>
             <p className="text-slate-400 text-sm">Name</p>
             <p className="text-white">{user.name}</p>
           </div>
           <div>
             <p className="text-slate-400 text-sm">Email</p>
             <p className="text-white">{user.email}</p>
           </div>
           <div>
             <p className="text-slate-400 text-sm">Member Since</p>
             <p className="text-white">{new Date(user.joinedAt).toLocaleDateString()}</p>
           </div>
         </div>
       </div>
     </div>
   </div>
 );
}

