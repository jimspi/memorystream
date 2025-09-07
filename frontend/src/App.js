import React, { useState, useEffect } from 'react';
import { Brain, Search, Plus, Zap, MessageSquare, FileText, Lightbulb, Clock, Tag, Star, Activity, Database, Users, Shield } from 'lucide-react';

// Demo data to simulate the system
const demoMemories = [
  {
    id: 1,
    content: "Discussed AI alignment strategies with team. Key insight: constitutional AI approaches show promise for scalable oversight. Need to research Anthropic's latest papers on this.",
    type: "conversation",
    source: "Claude",
    tags: ["ai-safety", "research", "work"],
    timestamp: "2025-01-15T14:30:00Z",
    relevanceScore: 9.2,
    accessCount: 5
  },
  {
    id: 2,
    content: "Meeting notes from Q1 planning: Budget allocated $2M for AI infrastructure. Focus on memory management systems. Sarah suggested looking into vector databases.",
    type: "document",
    source: "Work Meeting",
    tags: ["budget", "planning", "ai-infrastructure"],
    timestamp: "2025-01-10T09:00:00Z",
    relevanceScore: 8.7,
    accessCount: 12
  },
  {
    id: 3,
    content: "Personal reminder: Mom's birthday is March 15th. She mentioned wanting a smart home setup. Look into user-friendly AI assistants that respect privacy.",
    type: "note",
    source: "Personal",
    tags: ["family", "birthday", "smart-home"],
    timestamp: "2025-01-05T19:45:00Z",
    relevanceScore: 6.8,
    accessCount: 2
  },
  {
    id: 4,
    content: "ChatGPT conversation about React optimization: memo() vs useMemo() vs useCallback(). Key takeaway: memo() for component optimization, useMemo for expensive calculations.",
    type: "conversation",
    source: "ChatGPT",
    tags: ["programming", "react", "optimization"],
    timestamp: "2025-01-12T16:20:00Z",
    relevanceScore: 7.9,
    accessCount: 8
  },
  {
    id: 5,
    content: "Insight from customer research: 78% of users want AI that remembers context across sessions. This validates our MemoryStream thesis. Market opportunity is massive.",
    type: "insight",
    source: "Research",
    tags: ["business", "market-research", "validation"],
    timestamp: "2025-01-08T11:15:00Z",
    relevanceScore: 9.5,
    accessCount: 15
  }
];

const aiServices = [
  { name: "ChatGPT", connected: true, requests: 1247, icon: "🤖" },
  { name: "Claude", connected: true, requests: 892, icon: "🧠" },
  { name: "Midjourney", connected: false, requests: 0, icon: "🎨" },
  { name: "GitHub Copilot", connected: true, requests: 456, icon: "👨‍💻" }
];

export default function MemoryStreamDemo() {
  const [currentView, setCurrentView] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState(null);
  const [newMemory, setNewMemory] = useState('');
  const [memories, setMemories] = useState(demoMemories);
  const [showAddForm, setShowAddForm] = useState(false);

  // Simulate search functionality
  const handleSearch = (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    
    // Simulate API delay
    setTimeout(() => {
      const results = memories.filter(memory => 
        memory.content.toLowerCase().includes(query.toLowerCase()) ||
        memory.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase())) ||
        memory.source.toLowerCase().includes(query.toLowerCase())
      ).map(memory => ({
        ...memory,
        relevanceScore: Math.random() * 3 + 7 // Simulate relevance scoring
      })).sort((a, b) => b.relevanceScore - a.relevanceScore);
      
      setSearchResults(results);
      setIsSearching(false);
    }, 800);
  };

  // Add new memory
  const addMemory = () => {
    if (!newMemory.trim()) return;
    
    const memory = {
      id: memories.length + 1,
      content: newMemory,
      type: "note",
      source: "Demo Input",
      tags: ["demo", "user-generated"],
      timestamp: new Date().toISOString(),
      relevanceScore: 8.0,
      accessCount: 0
    };
    
    setMemories([memory, ...memories]);
    setNewMemory('');
    setShowAddForm(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-800/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Brain className="w-8 h-8 text-purple-400" />
              <div>
                <h1 className="text-2xl font-bold">MemoryStream</h1>
                <p className="text-sm text-slate-400">Universal AI Memory & Context</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                Live Demo
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: Activity },
              { id: 'memories', label: 'Memories', icon: Database },
              { id: 'search', label: 'AI Search', icon: Search },
              { id: 'integrations', label: 'AI Services', icon: Zap }
            ].map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`flex items-center space-x-2 px-4 py-4 border-b-2 transition-colors ${
                    currentView === item.id
                      ? 'border-purple-400 text-purple-400'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {currentView === 'overview' && <OverviewView memories={memories} />}
        {currentView === 'memories' && (
          <MemoriesView 
            memories={memories} 
            showAddForm={showAddForm}
            setShowAddForm={setShowAddForm}
            newMemory={newMemory}
            setNewMemory={setNewMemory}
            addMemory={addMemory}
            setSelectedMemory={setSelectedMemory}
          />
        )}
        {currentView === 'search' && (
          <SearchView 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchResults={searchResults}
            isSearching={isSearching}
            handleSearch={handleSearch}
          />
        )}
        {currentView === 'integrations' && <IntegrationsView />}
      </div>

      {/* Memory Detail Modal */}
      {selectedMemory && (
        <MemoryModal memory={selectedMemory} onClose={() => setSelectedMemory(null)} />
      )}
    </div>
  );
}

function OverviewView({ memories }) {
  const stats = {
    totalMemories: memories.length,
    totalInteractions: memories.reduce((sum, m) => sum + m.accessCount, 0),
    connectedServices: aiServices.filter(s => s.connected).length,
    recentActivity: memories.filter(m => 
      new Date(m.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center py-12">
        <h2 className="text-4xl font-bold mb-4">The Missing Layer of AI</h2>
        <p className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto">
          MemoryStream connects all your AI interactions with persistent, searchable memory. 
          Every conversation, insight, and context - unified across platforms.
        </p>
        <div className="flex justify-center space-x-4">
          <div className="bg-purple-600/20 border border-purple-500 rounded-lg p-4 text-center">
            <Brain className="w-8 h-8 text-purple-400 mx-auto mb-2" />
            <p className="text-sm">Universal Memory</p>
          </div>
          <div className="bg-blue-600/20 border border-blue-500 rounded-lg p-4 text-center">
            <Shield className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <p className="text-sm">Privacy First</p>
          </div>
          <div className="bg-green-600/20 border border-green-500 rounded-lg p-4 text-center">
            <Zap className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-sm">Cross-Platform</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Memories" value={stats.totalMemories} icon={Database} color="purple" />
        <StatCard title="AI Interactions" value={stats.totalInteractions} icon={MessageSquare} color="blue" />
        <StatCard title="Connected Services" value={stats.connectedServices} icon={Zap} color="green" />
        <StatCard title="Recent Activity" value={stats.recentActivity} icon={Activity} color="orange" />
      </div>

      {/* How It Works */}
      <div className="bg-slate-800/50 rounded-xl p-8 border border-slate-700">
        <h3 className="text-2xl font-bold mb-6 text-center">How MemoryStream Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-purple-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold">1</span>
            </div>
            <h4 className="text-lg font-semibold mb-2">Capture Everything</h4>
            <p className="text-slate-400">All AI conversations, insights, and contexts are automatically stored with end-to-end encryption.</p>
          </div>
          <div className="text-center">
            <div className="bg-blue-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold">2</span>
            </div>
            <h4 className="text-lg font-semibold mb-2">Intelligent Retrieval</h4>
            <p className="text-slate-400">Advanced semantic search finds relevant memories across all your AI interactions.</p>
          </div>
          <div className="text-center">
            <div className="bg-green-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold">3</span>
            </div>
            <h4 className="text-lg font-semibold mb-2">Context Everywhere</h4>
            <p className="text-slate-400">Any AI service can access your memory to provide personalized, contextual responses.</p>
          </div>
        </div>
      </div>

      {/* Recent Memories Preview */}
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
        <h3 className="text-xl font-semibold mb-4">Recent Memories</h3>
        <div className="space-y-3">
          {memories.slice(0, 3).map(memory => (
            <div key={memory.id} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
              <div className="flex items-center justify-between mb-2">
                <span className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded text-xs">
                  {memory.type}
                </span>
                <span className="text-slate-400 text-xs">
                  {new Date(memory.timestamp).toLocaleDateString()}
                </span>
              </div>
              <p className="text-slate-300 text-sm line-clamp-2">{memory.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MemoriesView({ memories, showAddForm, setShowAddForm, newMemory, setNewMemory, addMemory, setSelectedMemory }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Your AI Memories</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Memory</span>
        </button>
      </div>

      {showAddForm && (
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold mb-4">Add New Memory</h3>
          <textarea
            value={newMemory}
            onChange={(e) => setNewMemory(e.target.value)}
            placeholder="Enter your memory, insight, or note..."
            className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-white placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
            rows={4}
          />
          <div className="flex space-x-3 mt-4">
            <button
              onClick={addMemory}
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg"
            >
              Add Memory
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="bg-slate-600 hover:bg-slate-700 px-4 py-2 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {memories.map(memory => (
          <div
            key={memory.id}
            className="bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-slate-600 cursor-pointer transition-colors"
            onClick={() => setSelectedMemory(memory)}
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center space-x-3">
                <span className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded text-sm">
                  {memory.type}
                </span>
                <span className="text-slate-400 text-sm">from {memory.source}</span>
              </div>
              <div className="text-right">
                <div className="text-slate-400 text-sm">
                  {new Date(memory.timestamp).toLocaleDateString()}
                </div>
                <div className="text-xs text-slate-500">
                  Accessed {memory.accessCount} times
                </div>
              </div>
            </div>

            <p className="text-slate-300 mb-3 line-clamp-2">{memory.content}</p>

            {memory.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {memory.tags.map((tag, index) => (
                  <span key={index} className="bg-slate-700 text-slate-300 px-2 py-1 rounded text-xs flex items-center">
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function SearchView({ searchQuery, setSearchQuery, searchResults, isSearching, handleSearch }) {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">AI-Powered Memory Search</h2>
      
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
        <div className="flex space-x-4 mb-4">
          <div className="flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                handleSearch(e.target.value);
              }}
              placeholder="Search your memories... (try 'AI research', 'React', or 'birthday')"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
        
        <div className="text-sm text-slate-400">
          <p>💡 Try searching for: "AI research", "React optimization", "birthday", "budget", or "customer research"</p>
        </div>
      </div>

      {isSearching && (
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-400">Searching your memories...</p>
        </div>
      )}

      {searchResults.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">
            Found {searchResults.length} relevant memories
          </h3>
          {searchResults.map(result => (
            <div key={result.id} className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center space-x-3">
                  <span className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded text-sm">
                    {result.type}
                  </span>
                  <span className="text-slate-400 text-sm">from {result.source}</span>
                </div>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center text-yellow-400">
                    <Star className="w-4 h-4 mr-1" />
                    {result.relevanceScore.toFixed(1)}/10
                  </div>
                  <span className="text-slate-400">
                    {new Date(result.timestamp).toLocaleDateString()}
                  </span>
                </div>
              </div>
              
              <p className="text-white mb-3">{result.content}</p>
              
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
          ))}
        </div>
      )}

      {searchQuery && searchResults.length === 0 && !isSearching && (
        <div className="text-center py-8">
          <Search className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">No memories found. Try different keywords.</p>
        </div>
      )}
    </div>
  );
}

function IntegrationsView() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">AI Service Integrations</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {aiServices.map((service, index) => (
          <div key={index} className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <span className="text-3xl">{service.icon}</span>
                <div>
                  <h3 className="text-lg font-semibold">{service.name}</h3>
                  <p className="text-slate-400 text-sm">
                    {service.connected ? 'Connected' : 'Not connected'}
                  </p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm ${
                service.connected 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-slate-600/20 text-slate-400'
              }`}>
                {service.connected ? 'Active' : 'Inactive'}
              </div>
            </div>
            
            {service.connected && (
              <div className="bg-slate-700/50 rounded-lg p-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">Total Requests:</span>
                  <span className="text-white font-medium">{service.requests.toLocaleString()}</span>
                </div>
              </div>
            )}
            
            <button
              className={`w-full py-2 px-4 rounded-lg font-medium ${
                service.connected
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              {service.connected ? 'Disconnect' : 'Connect'}
            </button>
          </div>
        ))}
      </div>

      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
        <h3 className="text-xl font-semibold mb-4">Developer API</h3>
        <p className="text-slate-400 mb-4">
          Integrate MemoryStream with your own AI applications using our REST API.
        </p>
        <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm">
          <div className="text-green-400">POST /api/external/memories/context</div>
          <div className="text-slate-500 mt-2">// Get relevant context for AI interactions</div>
          <div className="text-blue-400 mt-4">{`{
  "apiKey": "your-api-key",
  "userId": "user-id", 
  "context": { "keywords": ["AI", "research"] },
  "limit": 10
}`}</div>
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

function MemoryModal({ memory, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-semibold">Memory Details</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <span className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded text-sm">
              {memory.type}
            </span>
            <span className="text-slate-400 text-sm">from {memory.source}</span>
            <span className="text-slate-500 text-sm">
              {new Date(memory.timestamp).toLocaleDateString()}
            </span>
          </div>
          
          <div className="bg-slate-900 rounded-lg p-4">
            <p className="text-white leading-relaxed">{memory.content}</p>
          </div>
          
          {memory.tags.length > 0 && (
            <div>
              <p className="text-slate-400 text-sm mb-2">Tags:</p>
              <div className="flex flex-wrap gap-2">
                {memory.tags.map((tag, index) => (
                  <span key={index} className="bg-slate-700 text-slate-300 px-2 py-1 rounded text-xs flex items-center">
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-400">Access Count</p>
              <p className="text-white font-medium">{memory.accessCount} times</p>
            </div>
            <div>
              <p className="text-slate-400">Relevance Score</p>
              <p className="text-white font-medium">{memory.relevanceScore}/10</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
