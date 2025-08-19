import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  Play, 
  Clock, 
  BarChart3, 
  CheckCircle, 
  Container,
  GitBranch,
  Terminal,
  Settings,
  CloudCog,
  Building,
  ArrowLeft
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
  markdownIntro: string;
  yamlData?: {
    tasks?: Array<{
      id: string;
      title: string;
      description: string;
      points: number;
    }>;
    environment?: {
      baseImage?: string;
    };
  };
}

const topicIcons: { [key: string]: any } = {
  docker: Container,
  git: GitBranch,
  linux: Terminal,
  kubernetes: CloudCog,
  terraform: Building,
  cicd: Settings
};

export default function LabDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [lab, setLab] = useState<Lab | null>(null);
  const [loading, setLoading] = useState(true);
  const [startingLab, setStartingLab] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchLab();
    }
  }, [slug]);

  const fetchLab = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/labs/${slug}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setLab(data);
      } else {
        toast.error('Lab not found');
        navigate('/labs');
      }
    } catch (error) {
      toast.error('Error loading lab');
      navigate('/labs');
    } finally {
      setLoading(false);
    }
  };

  const startLab = async () => {
    if (!lab) return;
    
    setStartingLab(true);
    try {
      const response = await fetch('http://localhost:3001/api/attempts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ labId: lab.id })
      });

      if (response.ok) {
        const attempt = await response.json();
        navigate(`/runner/${attempt.id}`);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to start lab');
      }
    } catch (error) {
      toast.error('Error starting lab');
    } finally {
      setStartingLab(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading lab...</div>
      </div>
    );
  }

  if (!lab) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Lab not found</div>
      </div>
    );
  }

  const TopicIcon = topicIcons[lab.topic] || Container;
  const totalTasks = lab.yamlData?.tasks?.length || 0;
  const totalPoints = lab.yamlData?.tasks?.reduce((sum, task) => sum + task.points, 0) || 0;

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/labs')}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Labs
        </button>

        {/* Header */}
        <div className="bg-gray-800 rounded-lg p-8 mb-8">
          <div className="flex items-start gap-6">
            <div className="bg-blue-600 p-4 rounded-lg">
              <TopicIcon className="h-12 w-12 text-white" />
            </div>
            
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-4">{lab.title}</h1>
              <p className="text-gray-300 text-lg mb-6">{lab.summary}</p>
              
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center gap-2 text-gray-400">
                  <Clock className="h-4 w-4" />
                  {lab.durationMins} minutes
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <BarChart3 className="h-4 w-4" />
                  {lab.level} level
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <CheckCircle className="h-4 w-4" />
                  {totalTasks} tasks
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <Container className="h-4 w-4" />
                  {totalPoints} points
                </div>
              </div>

              <button
                onClick={startLab}
                disabled={startingLab}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Play className="h-5 w-5" />
                {startingLab ? 'Starting Lab...' : 'Start Lab'}
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">What You'll Learn</h2>
              <div 
                className="prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ 
                  __html: lab.markdownIntro.replace(/\n/g, '<br>') 
                }}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Lab Info */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Lab Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Topic:</span>
                  <span className="text-white capitalize">{lab.topic}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Level:</span>
                  <span className="text-white capitalize">{lab.level}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Duration:</span>
                  <span className="text-white">{lab.durationMins} min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Environment:</span>
                  <span className="text-white text-xs">
                    {lab.yamlData?.environment?.baseImage || 'Container'}
                  </span>
                </div>
              </div>
            </div>

            {/* Tasks Preview */}
            {lab.yamlData?.tasks && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Tasks ({lab.yamlData.tasks.length})
                </h3>
                <div className="space-y-3">
                  {lab.yamlData.tasks.map((task, index) => (
                    <div key={task.id} className="flex items-start gap-3">
                      <div className="bg-gray-700 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                        {index + 1}
                      </div>
                      <div>
                        <div className="text-white font-medium text-sm">{task.title}</div>
                        <div className="text-gray-400 text-xs">{task.points} points</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}