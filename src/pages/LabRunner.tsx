import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { 
  Play, 
  RotateCcw, 
  CheckCircle, 
  XCircle, 
  Clock,
  ChevronLeft,
  ChevronRight,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react';
import toast from 'react-hot-toast';
import io from 'socket.io-client';

interface Attempt {
  id: string;
  labId: string;
  score: number;
  maxScore: number;
  status: string;
  lab: {
    title: string;
    slug: string;
    yamlSpec: string;
  };
}

interface Task {
  id: string;
  title: string;
  description: string;
  points: number;
  hint?: string;
}

interface TaskResult {
  taskId: string;
  status: 'pass' | 'fail' | 'pending';
  message: string;
  points: number;
}

export default function LabRunner() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const terminalRef = useRef<HTMLDivElement>(null);
  const [terminal, setTerminal] = useState<Terminal | null>(null);
  const [socket, setSocket] = useState<any>(null);
  
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskResults, setTaskResults] = useState<TaskResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [instructionsCollapsed, setInstructionsCollapsed] = useState(false);
  const [showHints, setShowHints] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (attemptId) {
      initializeSession();
    }
    
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [attemptId]);

  const initializeSession = async () => {
    try {
      // Fetch attempt details
      const response = await fetch(`http://localhost:3001/api/attempts/mine`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        const attempts = await response.json();
        const currentAttempt = attempts.find((a: Attempt) => a.id === attemptId);
        
        if (currentAttempt) {
          setAttempt(currentAttempt);
          
          // Parse YAML to get tasks
          try {
            const yamlData = JSON.parse(currentAttempt.lab.yamlSpec);
            if (yamlData.tasks) {
              setTasks(yamlData.tasks);
              setTaskResults(yamlData.tasks.map((t: Task) => ({
                taskId: t.id,
                status: 'pending' as const,
                message: 'Not checked yet',
                points: 0
              })));
            }
          } catch (e) {
            console.error('Failed to parse lab YAML:', e);
          }

          setupTerminal();
        } else {
          toast.error('Attempt not found');
          navigate('/labs');
        }
      } else {
        toast.error('Failed to load attempt');
        navigate('/labs');
      }
    } catch (error) {
      toast.error('Error initializing session');
      navigate('/labs');
    } finally {
      setLoading(false);
    }
  };

  const setupTerminal = () => {
    if (terminalRef.current) {
      const term = new Terminal({
        theme: {
          background: '#1f2937',
          foreground: '#f3f4f6'
        },
        fontSize: 14,
        fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace'
      });

      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.open(terminalRef.current);
      fitAddon.fit();

      // Connect to WebSocket
      const newSocket = io('http://localhost:3001');
      
      newSocket.on('connect', () => {
        newSocket.emit('start-terminal', { attemptId, token });
      });

      newSocket.on('terminal-output', (data) => {
        term.write(data);
      });

      newSocket.on('terminal-error', (error) => {
        toast.error(error.error || 'Terminal error');
      });

      term.onData((data) => {
        newSocket.emit('terminal-input', data);
      });

      setTerminal(term);
      setSocket(newSocket);

      // Handle window resize
      const handleResize = () => {
        setTimeout(() => fitAddon.fit(), 100);
      };
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        term.dispose();
        newSocket.disconnect();
      };
    }
  };

  const runChecks = async () => {
    if (!attempt) return;

    setChecking(true);
    try {
      const response = await fetch(`http://localhost:3001/api/attempts/${attempt.id}/check`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        const results = await response.json();
        setTaskResults(results.results);
        
        const passedCount = results.results.filter((r: TaskResult) => r.status === 'pass').length;
        toast.success(`${passedCount}/${tasks.length} tasks passed!`);
      } else {
        toast.error('Failed to run checks');
      }
    } catch (error) {
      toast.error('Error running checks');
    } finally {
      setChecking(false);
    }
  };

  const resetLab = async () => {
    if (!attempt) return;

    try {
      const response = await fetch(`http://localhost:3001/api/attempts/${attempt.id}/reset`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('Lab reset successfully');
        // Reinitialize terminal
        if (terminal) {
          terminal.clear();
        }
        setTaskResults(tasks.map(t => ({
          taskId: t.id,
          status: 'pending' as const,
          message: 'Not checked yet',
          points: 0
        })));
      } else {
        toast.error('Failed to reset lab');
      }
    } catch (error) {
      toast.error('Error resetting lab');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const toggleHint = (taskId: string) => {
    setShowHints(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading lab environment...</div>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Lab session not found</div>
      </div>
    );
  }

  const passedTasks = taskResults.filter(r => r.status === 'pass').length;
  const totalScore = taskResults.reduce((sum, r) => sum + r.points, 0);

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 px-6 py-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/labs')}
              className="text-gray-400 hover:text-white"
            >
              ← Back to Labs
            </button>
            <h1 className="text-xl font-semibold text-white">{attempt.lab.title}</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-400">
              Progress: {passedTasks}/{tasks.length} tasks • {totalScore}/{attempt.maxScore} points
            </div>
            <div className="flex gap-2">
              <button
                onClick={runChecks}
                disabled={checking}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Play className="h-4 w-4" />
                {checking ? 'Checking...' : 'Run Checks'}
              </button>
              <button
                onClick={resetLab}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Instructions Panel */}
        <div className={`bg-gray-800 border-r border-gray-700 transition-all duration-300 ${
          instructionsCollapsed ? 'w-12' : 'w-96'
        }`}>
          <div className="p-4 border-b border-gray-700 flex items-center justify-between">
            {!instructionsCollapsed && (
              <h2 className="text-lg font-semibold text-white">Tasks & Instructions</h2>
            )}
            <button
              onClick={() => setInstructionsCollapsed(!instructionsCollapsed)}
              className="text-gray-400 hover:text-white"
            >
              {instructionsCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>
          
          {!instructionsCollapsed && (
            <div className="p-4 h-full overflow-y-auto">
              <div className="space-y-4">
                {tasks.map((task, index) => {
                  const result = taskResults.find(r => r.taskId === task.id);
                  return (
                    <div 
                      key={task.id}
                      className="border border-gray-700 rounded-lg p-4"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                          result?.status === 'pass' 
                            ? 'bg-green-600 text-white' 
                            : result?.status === 'fail'
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-600 text-white'
                        }`}>
                          {result?.status === 'pass' ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : result?.status === 'fail' ? (
                            <XCircle className="h-4 w-4" />
                          ) : (
                            index + 1
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-white font-medium">{task.title}</h3>
                          <div className="text-xs text-gray-400">{task.points} points</div>
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-300 mb-3 leading-relaxed">
                        {task.description.split('`').map((part, i) => 
                          i % 2 === 0 ? (
                            <span key={i}>{part}</span>
                          ) : (
                            <code key={i} className="bg-gray-700 px-1 py-0.5 rounded text-blue-300 font-mono text-xs">
                              {part}
                            </code>
                          )
                        )}
                      </div>

                      {task.hint && (
                        <div className="mb-3">
                          <button
                            onClick={() => toggleHint(task.id)}
                            className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-1"
                          >
                            {showHints[task.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                            {showHints[task.id] ? 'Hide' : 'Show'} Hint
                          </button>
                          {showHints[task.id] && (
                            <div className="mt-2 p-2 bg-yellow-900/20 border border-yellow-700 rounded text-xs text-yellow-200">
                              {task.hint}
                            </div>
                          )}
                        </div>
                      )}

                      {result && result.status !== 'pending' && (
                        <div className={`text-xs p-2 rounded ${
                          result.status === 'pass' 
                            ? 'bg-green-900/20 text-green-300 border border-green-700'
                            : 'bg-red-900/20 text-red-300 border border-red-700'
                        }`}>
                          {result.message}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Terminal Panel */}
        <div className="flex-1 flex flex-col">
          <div className="bg-gray-700 px-4 py-2 text-sm text-gray-300 border-b border-gray-600">
            Terminal - {attempt.lab.title}
          </div>
          <div 
            ref={terminalRef} 
            className="flex-1 bg-gray-900"
            style={{ minHeight: '400px' }}
          />
        </div>
      </div>
    </div>
  );
}