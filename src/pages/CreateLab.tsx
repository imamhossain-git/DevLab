import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ArrowLeft, Save, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

const sampleYaml = `environment:
  baseImage: ubuntu:22.04
  setup:
    - apt update && apt install -y bash curl

tasks:
  - id: create_file
    title: Create a file
    description: |
      Create a file called \`hello.txt\` with the content "Hello DevLab".
    hint: Use echo "Hello DevLab" > hello.txt
    points: 50
    checks:
      - type: fileContains
        file: hello.txt
        contains: "Hello DevLab"

  - id: check_permissions
    title: Set file permissions
    description: |
      Set the file permissions to 755 for the hello.txt file.
    hint: Use chmod 755 hello.txt
    points: 50
    checks:
      - type: commandExitCode
        command: ls -l hello.txt | grep "rwxr-xr-x"
        expect: 0`;

export default function CreateLab() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    topic: 'docker',
    level: 'beginner',
    durationMins: 30,
    summary: '',
    markdownIntro: '',
    yamlSpec: sampleYaml
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/labs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success('Lab created successfully!');
        navigate('/admin');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create lab');
      }
    } catch (error) {
      toast.error('Error creating lab');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();
  };

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: generateSlug(title)
    }));
  };

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/admin')}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">Create New Lab</h1>
            <p className="text-gray-400">Design an interactive DevOps learning experience</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Lab Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Docker Container Fundamentals"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Slug *
                </label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="docker-container-fundamentals"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Topic *
                </label>
                <select
                  required
                  value={formData.topic}
                  onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="docker">Docker</option>
                  <option value="kubernetes">Kubernetes</option>
                  <option value="git">Git</option>
                  <option value="linux">Linux</option>
                  <option value="terraform">Terraform</option>
                  <option value="cicd">CI/CD</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Difficulty Level *
                </label>
                <select
                  required
                  value={formData.level}
                  onChange={(e) => setFormData(prev => ({ ...prev, level: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Duration (minutes) *
                </label>
                <input
                  type="number"
                  required
                  min="5"
                  max="180"
                  value={formData.durationMins}
                  onChange={(e) => setFormData(prev => ({ ...prev, durationMins: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Summary *
              </label>
              <textarea
                required
                rows={3}
                value={formData.summary}
                onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Brief description of what students will learn..."
              />
            </div>
          </div>

          {/* Content */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Lab Content</h2>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Introduction (Markdown)
              </label>
              <textarea
                rows={8}
                value={formData.markdownIntro}
                onChange={(e) => setFormData(prev => ({ ...prev, markdownIntro: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                placeholder="# Lab Introduction

Welcome to this lab! You will learn...

## Prerequisites
- Basic command line knowledge
- Docker installed

## Objectives
- Learn Docker basics
- Build your first container"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Lab Specification (YAML) *
              </label>
              <textarea
                required
                rows={20}
                value={formData.yamlSpec}
                onChange={(e) => setFormData(prev => ({ ...prev, yamlSpec: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              />
              <p className="text-xs text-gray-400 mt-2">
                Define the lab environment, tasks, and grading criteria in YAML format.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="px-6 py-2 border border-gray-600 text-gray-300 rounded-md hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {loading ? 'Creating...' : 'Create Lab'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}