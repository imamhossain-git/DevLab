import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  Plus,
  Edit,
  Eye,
  Trash2,
  BookOpen,
  Users,
  Award,
  TrendingUp
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Lab {
  id: string;
  slug: string;
  title: string;
  topic: string;
  level: string;
  durationMins: number;
  isPublished: boolean;
  createdAt: string;
}

export default function AdminDashboard() {
  const { token } = useAuth();
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalLabs: 0,
    publishedLabs: 0,
    totalUsers: 0,
    totalAttempts: 0
  });

  useEffect(() => {
    fetchLabs();
    fetchStats();
  }, []);

  const fetchLabs = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/labs?admin=true', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setLabs(data);
      }
    } catch (error) {
      toast.error('Failed to load labs');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    // For demo purposes, we'll use mock stats
    // In a real app, you'd have an admin stats endpoint
    setStats({
      totalLabs: 12,
      publishedLabs: 8,
      totalUsers: 143,
      totalAttempts: 567
    });
  };

  const togglePublished = async (labId: string, isPublished: boolean) => {
    try {
      const response = await fetch(`http://localhost:3001/api/labs/${labId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isPublished: !isPublished })
      });

      if (response.ok) {
        toast.success(isPublished ? 'Lab unpublished' : 'Lab published');
        fetchLabs();
      } else {
        toast.error('Failed to update lab');
      }
    } catch (error) {
      toast.error('Error updating lab');
    }
  };

  const deleteLab = async (labId: string) => {
    if (!confirm('Are you sure you want to delete this lab?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/labs/${labId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('Lab deleted');
        fetchLabs();
      } else {
        toast.error('Failed to delete lab');
      }
    } catch (error) {
      toast.error('Error deleting lab');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
            <p className="text-gray-400">Manage labs, users, and platform content</p>
          </div>
          
          <Link
            to="/admin/labs/create"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Lab
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-3 rounded-lg">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{stats.totalLabs}</div>
                <div className="text-sm text-gray-400">Total Labs</div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center gap-3">
              <div className="bg-green-600 p-3 rounded-lg">
                <Eye className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{stats.publishedLabs}</div>
                <div className="text-sm text-gray-400">Published</div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center gap-3">
              <div className="bg-purple-600 p-3 rounded-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{stats.totalUsers}</div>
                <div className="text-sm text-gray-400">Users</div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-600 p-3 rounded-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{stats.totalAttempts}</div>
                <div className="text-sm text-gray-400">Attempts</div>
              </div>
            </div>
          </div>
        </div>

        {/* Labs Table */}
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700">
            <h2 className="text-xl font-semibold text-white">Lab Management</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading labs...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Lab
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Topic
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {labs.map((lab) => (
                    <tr key={lab.id} className="hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-white">{lab.title}</div>
                          <div className="text-sm text-gray-400">{lab.slug}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 capitalize">
                        {lab.topic}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 capitalize">
                        {lab.level}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {lab.durationMins} min
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          lab.isPublished 
                            ? 'bg-green-900 text-green-300'
                            : 'bg-gray-700 text-gray-300'
                        }`}>
                          {lab.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/labs/${lab.slug}`}
                            className="text-blue-400 hover:text-blue-300"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => togglePublished(lab.id, lab.isPublished)}
                            className="text-green-400 hover:text-green-300"
                            title={lab.isPublished ? 'Unpublish' : 'Publish'}
                          >
                            <Award className="h-4 w-4" />
                          </button>
                          <button
                            className="text-red-400 hover:text-red-300"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}