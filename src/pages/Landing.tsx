import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  FlaskConical, 
  Play, 
  CheckCircle, 
  Users, 
  BookOpen, 
  Award,
  Terminal,
  Container,
  GitBranch
} from 'lucide-react';

export default function Landing() {
  const { user } = useAuth();

  const features = [
    {
      icon: Terminal,
      title: 'Interactive Terminal',
      description: 'Real-time terminal access in isolated containerized environments'
    },
    {
      icon: CheckCircle,
      title: 'Automated Grading',
      description: 'Instant feedback with comprehensive automated testing and validation'
    },
    {
      icon: Container,
      title: 'Docker Sandbox',
      description: 'Safe, isolated environments for hands-on learning without risk'
    },
    {
      icon: Award,
      title: 'Progress Tracking',
      description: 'Earn badges, track achievements, and build your DevOps portfolio'
    }
  ];

  const topics = [
    { icon: Container, name: 'Docker', count: 15 },
    { icon: GitBranch, name: 'Git', count: 12 },
    { icon: Terminal, name: 'Linux', count: 18 },
    { icon: FlaskConical, name: 'Kubernetes', count: 8 }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-blue-900">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-8">
            <FlaskConical className="h-16 w-16 text-blue-400 mx-auto mb-4" />
            <h1 className="text-5xl sm:text-6xl font-bold text-white mb-6">
              Master DevOps with
              <span className="text-blue-400"> Hands-On Labs</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              Learn Docker, Kubernetes, Git, and Linux through interactive, real-world scenarios. 
              Practice in safe sandbox environments with instant feedback.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {user ? (
              <Link
                to="/labs"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-200 transform hover:scale-105 flex items-center gap-2"
              >
                <Play className="h-5 w-5" />
                Continue Learning
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-200 transform hover:scale-105 flex items-center gap-2"
                >
                  <Play className="h-5 w-5" />
                  Start Learning
                </Link>
                <Link
                  to="/login"
                  className="border border-gray-600 text-white hover:bg-gray-800 px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-200"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-16 max-w-lg mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400">50+</div>
              <div className="text-gray-400">Interactive Labs</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400">10k+</div>
              <div className="text-gray-400">Students</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-400">95%</div>
              <div className="text-gray-400">Success Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-white mb-16">
            Why Choose DevLab?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-gray-800 rounded-lg p-6 text-center hover:bg-gray-700 transition-colors"
              >
                <feature.icon className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Topics Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-white mb-16">
            Learn Essential DevOps Skills
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {topics.map((topic, index) => (
              <div 
                key={index}
                className="bg-gray-800 rounded-lg p-6 text-center hover:bg-gray-700 transition-all duration-200 transform hover:scale-105"
              >
                <topic.icon className="h-10 w-10 text-blue-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-white mb-1">{topic.name}</h3>
                <p className="text-gray-400">{topic.count} labs</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-900/20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to Level Up Your DevOps Skills?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of developers and engineers who are mastering DevOps through hands-on practice.
          </p>
          {!user && (
            <Link
              to="/register"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-200 transform hover:scale-105 inline-flex items-center gap-2"
            >
              <Play className="h-5 w-5" />
              Get Started Free
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}