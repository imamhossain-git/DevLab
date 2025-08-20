import { exec } from 'child_process';
import { promisify } from 'util';
import yaml from 'js-yaml';
import { PrismaClient, Attempt } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

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
      url?: string;
      status?: number;
    }>;
  }>;
}

export async function createLabContainer(yamlSpec: string): Promise<string> {
  try {
    const spec = yaml.load(yamlSpec) as LabSpec;
    const baseImage = spec.environment?.baseImage || 'ubuntu:22.04';
    
    // Generate unique container name
    const containerId = `devlab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`Creating container ${containerId} with image ${baseImage}`);
    
    // Pull the base image if not exists
    try {
      await execAsync(`docker pull ${baseImage}`);
    } catch (error) {
      console.warn(`Failed to pull image ${baseImage}, using local version`);
    }
    
    // Create and start the container
    const createCommand = [
      'docker run -d',
      `--name ${containerId}`,
      '--rm',
      '--privileged', // Required for Docker-in-Docker
      '-v /var/run/docker.sock:/var/run/docker.sock', // Mount Docker socket
      '--memory=512m',
      '--cpus=1',
      '--network=bridge',
      baseImage,
      'tail -f /dev/null' // Keep container running
    ].join(' ');
    
    await execAsync(createCommand);
    
    // Run setup commands if specified
    if (spec.environment?.setup) {
      for (const setupCmd of spec.environment.setup) {
        try {
          await execAsync(`docker exec ${containerId} sh -c "${setupCmd}"`);
        } catch (error) {
          console.warn(`Setup command failed: ${setupCmd}`, error);
        }
      }
    }
    
    console.log(`Container ${containerId} created and configured successfully`);
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
    } catch (error: any) {
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
  const containerId = attempt.containerId;
  
  switch (check.type) {
    case 'commandExitCode':
      try {
        const command = `docker exec ${containerId} sh -c "${check.command}"`;
        const { stdout, stderr } = await execAsync(command, {
          timeout: 30000
        });
        
        return {
          type: check.type,
          status: 'pass',
          message: `Command executed successfully: ${check.command}`
        };
      } catch (error: any) {
        const expectedCode = check.expect || 0;
        const actualCode = error.code || 1;
        
        return {
          type: check.type,
          status: actualCode === expectedCode ? 'pass' : 'fail',
          message: actualCode === expectedCode 
            ? `Command returned expected exit code ${expectedCode}`
            : `Command failed with exit code ${actualCode}, expected ${expectedCode}`
        };
      }

    case 'fileContains':
      try {
        const command = `docker exec ${containerId} cat "${check.file}"`;
        const { stdout } = await execAsync(command, { timeout: 10000 });
        
        const contains = stdout.includes(check.contains);
        return {
          type: check.type,
          status: contains ? 'pass' : 'fail',
          message: contains 
            ? `File ${check.file} contains expected content`
            : `File ${check.file} does not contain "${check.contains}"`
        };
      } catch (error: any) {
        return {
          type: check.type,
          status: 'fail',
          message: `Could not read file ${check.file}: ${error.message}`
        };
      }

    case 'fileExists':
      try {
        const command = `docker exec ${containerId} test -f "${check.file}"`;
        await execAsync(command, { timeout: 10000 });
        
        return {
          type: check.type,
          status: 'pass',
          message: `File ${check.file} exists`
        };
      } catch (error) {
        return {
          type: check.type,
          status: 'fail',
          message: `File ${check.file} does not exist`
        };
      }

    case 'httpStatus':
      try {
        const command = `docker exec ${containerId} curl -s -o /dev/null -w "%{http_code}" "${check.url}"`;
        const { stdout } = await execAsync(command, { timeout: 15000 });
        
        const statusCode = parseInt(stdout.trim());
        const expectedStatus = check.status || 200;
        
        return {
          type: check.type,
          status: statusCode === expectedStatus ? 'pass' : 'fail',
          message: statusCode === expectedStatus
            ? `HTTP request returned expected status ${expectedStatus}`
            : `HTTP request returned ${statusCode}, expected ${expectedStatus}`
        };
      } catch (error: any) {
        return {
          type: check.type,
          status: 'fail',
          message: `HTTP check failed: ${error.message}`
        };
      }

    case 'portOpen':
      try {
        const port = check.port || 80;
        const command = `docker exec ${containerId} netstat -tuln | grep ":${port} "`;
        await execAsync(command, { timeout: 10000 });
        
        return {
          type: check.type,
          status: 'pass',
          message: `Port ${port} is open and listening`
        };
      } catch (error) {
        return {
          type: check.type,
          status: 'fail',
          message: `Port ${check.port || 80} is not open`
        };
      }

    case 'dockerImageExists':
      try {
        const imageName = check.image;
        const command = `docker exec ${containerId} docker images -q "${imageName}"`;
        const { stdout } = await execAsync(command, { timeout: 15000 });
        
        return {
          type: check.type,
          status: stdout.trim() ? 'pass' : 'fail',
          message: stdout.trim() 
            ? `Docker image ${imageName} exists`
            : `Docker image ${imageName} not found`
        };
      } catch (error: any) {
        return {
          type: check.type,
          status: 'fail',
          message: `Docker image check failed: ${error.message}`
        };
      }

    default:
      return {
        type: check.type,
        status: 'fail',
        message: `Unknown check type: ${check.type}`
      };
  }
}

export async function cleanupContainer(containerId: string) {
  try {
    await execAsync(`docker stop ${containerId}`);
    console.log(`Container ${containerId} stopped and removed`);
  } catch (error) {
    console.warn(`Failed to cleanup container ${containerId}:`, error);
  }
}

export function setupGraderService() {
  console.log('🔍 Grader service initialized with Docker integration');
  
  // Cleanup orphaned containers on startup
  cleanupOrphanedContainers();
  
  // Setup periodic cleanup
  setInterval(cleanupOrphanedContainers, 5 * 60 * 1000); // Every 5 minutes
}

async function cleanupOrphanedContainers() {
  try {
    const { stdout } = await execAsync('docker ps -a --filter "name=devlab_" --format "{{.Names}}"');
    const containers = stdout.trim().split('\n').filter(name => name);
    
    for (const container of containers) {
      // Check if container is older than 30 minutes
      try {
        const { stdout: created } = await execAsync(`docker inspect --format='{{.Created}}' ${container}`);
        const createdTime = new Date(created.trim());
        const now = new Date();
        const ageMinutes = (now.getTime() - createdTime.getTime()) / (1000 * 60);
        
        if (ageMinutes > 30) {
          await execAsync(`docker stop ${container}`);
          console.log(`Cleaned up old container: ${container}`);
        }
      } catch (error) {
        // Container might already be removed
      }
    }
  } catch (error) {
    // No containers to cleanup
  }
}