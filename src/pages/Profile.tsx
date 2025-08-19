import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
  User, 
  Trophy, 
  Clock, 
  CheckCircle,
  Calendar,
  Award,
  Target,
  TrendingUp
} from 'lucide-react';
import toast from 'react-hot-toast';

interface UserStats {
  totalAttempts: number;
  passedAttempts: number;
  badges: number;
}

interface Attempt {
  id: string;
  score: number;
  maxScore: number;
  status: string;
  startedAt: string;
  finishedAt: string | null;
  lab: {
    title: string;
    slug: string;
    topic: string;
    level: string;
  };
}

interface UserBadge {
  id: string;
  awardedAt: string;
  badge: {
    name: string;
    description: string;
    imageUrl?: string;
  };
}

export default function Profile() {
  const { user, token } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchProfile(),
      fetchAttempts(),
      fetchBadges()
    ]).finally(() => setLoading(false));
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/users/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      toast.error('Failed to load profile');
    }
  };

  const fetchAttempts = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/attempts/mine', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAttempts(data);
      }
    } catch (error) {
      toast.error('Failed to load attempts');
    }
  };

  const fetchBadges = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/users/me/badges', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBadges(data);
      }
    } catch (error) {
      toast.error('Failed to load badges');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading profile...</div>
      </div>
    );
  }

  const completionRate = stats ? Math.round((stats.passedAttempts / Math.max(stats.totalAttempts, 1)) * 100) : 0;
  const totalScore = attempts.reduce((sum, attempt) => sum + attempt.score, 0);

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Profile</h1>
          <p className="text-gray-400">Track your DevOps learning progress</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-3 rounded-lg">
                <Target className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{stats?.totalAttempts || 0}</div>
                <div className="text-sm text-gray-400">Total Attempts</div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center gap-3">
              <div className="bg-green-600 p-3 rounded-lg">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{stats?.passedAttempts || 0}</div>
                <div className="text-sm text-gray-400">Completed</div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center gap-3">
              <div className="bg-purple-600 p-3 rounded-lg">
                <Award className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{stats?.badges || 0}</div>
                <div className="text-sm text-gray-400">Badges</div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-600 p-3 rounded-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{completionRate}%</div>
                <div className="text-sm text-gray-400">Success Rate</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Recent Lab Attempts</h2>
              
              {attempts.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No lab attempts yet</p>
                  <p className="text-gray-500 text-sm">Start your first lab to see your progress here!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {attempts.slice(0, 10).map((attempt) => (
                    <div 
                      key={attempt.id}
                      className="flex items-center justify-between p-4 bg-gray-700 rounded-lg"
                    >
                      <div className="flex-1">
                        <h3 className="text-white font-medium">{attempt.lab.title}</h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
                          <span className="capitalize">{attempt.lab.topic}</span>
                          <span className="capitalize">{attempt.lab.level}</span>
                          <span>{new Date(attempt.startedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-white font-medium">
                            {attempt.score}/{attempt.maxScore}
                          </div>
                          <div className="text-xs text-gray-400">points</div>
                        </div>
                        
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                          attempt.status === 'passed' 
                            ? 'bg-green-900 text-green-300'
                            : attempt.status === 'failed'
                            ? 'bg-red-900 text-red-300'
                            : 'bg-yellow-900 text-yellow-300'
                        }`}>
                          {attempt.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* User Info */}
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-blue-600 p-3 rounded-full">
                  <User className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">{user?.email}</h3>
                  <p className="text-gray-400 text-sm capitalize">{user?.role}</p>
                </div>
              </div>
              
              <div className="text-sm text-gray-400">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4" />
                  Joined {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Recently'}
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  {totalScore} total points earned
                </div>
              </div>
            </div>

            {/* Badges */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Badges</h3>
              
              {badges.length === 0 ? (
                <div className="text-center py-4">
                  <Award className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">No badges earned yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {badges.map((userBadge) => (
                    <div key={userBadge.id} className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg">
                      <div className="bg-yellow-600 p-2 rounded-lg">
                        <Award className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <div className="text-white font-medium text-sm">{userBadge.badge.name}</div>
                        <div className="text-gray-400 text-xs">{userBadge.badge.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}