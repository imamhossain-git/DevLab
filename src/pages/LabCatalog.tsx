import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  Search, 
  Filter, 
  Clock, 
  BarChart3, 
  Container,
  GitBranch,
  Terminal,
  Settings,
  CloudCog,
  Building
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Lab {
  id: string;
  slug: string;
  title: string;
  topic: string;
  level: string;
  durationMins: number;
  summary: string;
  createdAt: string;
}

const topicIcons: { [key: string]: any } = {
  docker: Container,
  git: GitBranch,
  linux: Terminal,
  kubernetes: CloudCog,
  terraform: Building,
  cicd: Settings
};

const topicColors: { [key: string]: string } = {
  docker: 'bg-blue-500',
  git: 'bg-orange-500',
  linux: 'bg-green-500',
  kubernetes: 'bg-purple-500',
  terraform: 'bg-indigo-500',
  cicd: 'bg-yellow-500'
};

const levelColors: { [key: string]: string } = {
  beginner: 'text-green-400',
  intermediate: 'text-yellow-400',
  advanced: 'text-red-400'
};

export default function LabCatalog() {
  const { token } = useAuth();
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');

  useEffect(() => {
    fetchLabs();
  }, [selectedTopic, selectedLevel]);

  const fetchLabs = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedTopic) params.append('topic', selectedTopic);
      if (selectedLevel) params.append('level', selectedLevel);

      const response = await fetch(`http://localhost:3001/api/labs?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setLabs(data);
      } else {
        toast.error('Failed to load labs');
      }
    } catch (error) {
      toast.error('Error loading labs');
    } finally {
      setLoading(false);
    }
  };

  const filteredLabs = labs.filter(lab =>
    lab.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lab.summary.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const topics = ['docker', 'git', 'linux', 'kubernetes', 'terraform', 'cicd'];
  const levels = ['beginner', 'intermediate', 'advanced'];

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">DevOps Labs</h1>
          <p className="text-gray-400">
            Choose from our collection of hands-on labs to build your DevOps skills
          </p>
        </div>

        {/* Filters */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search labs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Topic Filter */}
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Topics</option>
              {topics.map(topic => (
                <option key={topic} value={topic}>
                  {topic.charAt(0).toUpperCase() + topic.slice(1)}
                </option>
              ))}
            </select>

            {/* Level Filter */}
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Levels</option>
              {levels.map(level => (
                <option key={level} value={level}>
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Labs Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-white text-xl">Loading labs...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLabs.map((lab) => {
              const TopicIcon = topicIcons[lab.topic] || Container;
              return (
                <Link
                  key={lab.id}
                  to={`/labs/${lab.slug}`}
                  className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-all duration-200 transform hover:scale-105 border border-gray-700 hover:border-gray-600"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-2 rounded-lg ${topicColors[lab.topic] || 'bg-gray-500'}`}>
                      <TopicIcon className="h-6 w-6 text-white" />
                    </div>
                    <span className={`text-sm font-medium ${levelColors[lab.level]}`}>
                      {lab.level}
                    </span>
                  </div>

                  <h3 className="text-xl font-semibold text-white mb-2 line-clamp-2">
                    {lab.title}
                  </h3>
                  
                  <p className="text-gray-400 mb-4 line-clamp-3">
                    {lab.summary}
                  </p>

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {lab.durationMins} min
                    </div>
                    <div className="flex items-center gap-1">
                      <BarChart3 className="h-4 w-4" />
                      {lab.topic}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {filteredLabs.length === 0 && !loading && (
          <div className="text-center py-20">
            <p className="text-gray-400 text-xl">No labs found matching your criteria.</p>
            <p className="text-gray-500 mt-2">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}