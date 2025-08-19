import { exec } from 'child_process';
import { promisify } from 'util';
import yaml from 'js-yaml';
import { PrismaClient, Attempt } from '@prisma/client';

const execAsync = promisify(exec);
const prisma = new PrismaClient();

interface LabSpec {
  environment?: {
    baseImage?: string;
    setup?: string[];
  };
  tasks?: Array<{
    id: string;
    title: string;
    description: string;
    points: number;
    checks: Array<{
      type: string;
      command?: string;
      file?: string;
      contains?: string;
      expect?: any;
    }>;
  }>;
}

export async function createLabContainer(yamlSpec: string): Promise<string> {
  try {
    const spec = yaml.load(yamlSpec) as LabSpec;
    const baseImage = spec.environment?.baseImage || 'ubuntu:22.04';
    
    // Generate unique container name
    const containerId = `devlab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // For demo, we'll simulate container creation
    // In production, this would use Docker API
    console.log(`Creating container ${containerId} with image ${baseImage}`);
    
    return containerId;
  } catch (error) {
    console.error('Container creation error:', error);
    throw new Error('Failed to create lab container');
  }
}

export async function runGraderChecks(attempt: Attempt & { lab: any }) {
  try {
    const spec = yaml.load(attempt.lab.yamlSpec) as LabSpec;
    const results = [];
    let totalScore = 0;

    if (!spec.tasks) {
      return { results: [], score: 0 };
    }

    for (const task of spec.tasks) {
      const taskResult = await runTaskChecks(attempt, task);
      results.push(taskResult);
      
      // Save to database
      await prisma.taskResult.upsert({
        where: {
          attemptId_taskId: {
            attemptId: attempt.id,
            taskId: task.id
          }
        },
        create: {
          attemptId: attempt.id,
          taskId: task.id,
          status: taskResult.status,
          message: taskResult.message,
          points: taskResult.points
        },
        update: {
          status: taskResult.status,
          message: taskResult.message,
          points: taskResult.points
        }
      });

      if (taskResult.status === 'pass') {
        totalScore += task.points;
      }
    }

    // Update attempt score
    const status = results.every(r => r.status === 'pass') ? 'passed' : 
                  results.some(r => r.status === 'pass') ? 'in_progress' : 'in_progress';

    await prisma.attempt.update({
      where: { id: attempt.id },
      data: {
        score: totalScore,
        status: status === 'passed' ? 'passed' : attempt.status,
        finishedAt: status === 'passed' ? new Date() : null
      }
    });

    return { results, score: totalScore };
  } catch (error) {
    console.error('Grader error:', error);
    throw new Error('Failed to run checks');
  }
}

async function runTaskChecks(attempt: any, task: any) {
  const results = [];

  for (const check of task.checks) {
    try {
      const result = await runSingleCheck(attempt, check);
      results.push(result);
    } catch (error) {
      results.push({
        type: check.type,
        status: 'fail',
        message: `Error running check: ${error.message}`
      });
    }
  }

  const allPassed = results.every(r => r.status === 'pass');
  return {
    taskId: task.id,
    status: allPassed ? 'pass' : 'fail',
    message: allPassed ? 'All checks passed' : 'Some checks failed',
    points: allPassed ? task.points : 0,
    details: results
  };
}

async function runSingleCheck(attempt: any, check: any) {
  switch (check.type) {
    case 'commandExitCode':
      try {
        // In production, this would execute in the container
        const { stdout, stderr } = await execAsync(check.command, {
          timeout: 10000,
          cwd: '/tmp' // Safe directory for demo
        });
        
        const expectedCode = check.expect || 0;
        return {
          type: check.type,
          status: 'pass', // Simplified for demo
          message: `Command executed successfully`
        };
      } catch (error: any) {
        return {
          type: check.type,
          status: error.code === check.expect ? 'pass' : 'fail',
          message: error.code === check.expect ? 'Expected exit code' : `Unexpected exit code: ${error.code}`
        };
      }

    case 'fileContains':
      // Simulate file check
      return {
        type: check.type,
        status: 'fail', // Demo: always fail for now
        message: `File check not implemented in demo`
      };

    case 'httpStatus':
      // Simulate HTTP check
      return {
        type: check.type,
        status: 'fail',
        message: 'HTTP check not implemented in demo'
      };

    default:
      return {
        type: check.type,
        status: 'fail',
        message: `Unknown check type: ${check.type}`
      };
  }
}

export function setupGraderService() {
  console.log('🔍 Grader service initialized');
}