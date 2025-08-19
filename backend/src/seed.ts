import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const sampleLabs = [
  {
    slug: 'docker-basics',
    title: 'Docker Fundamentals',
    topic: 'docker',
    level: 'beginner',
    durationMins: 30,
    summary: 'Learn the basics of Docker containers, images, and the Dockerfile.',
    markdownIntro: `# Docker Fundamentals

Welcome to Docker Fundamentals! In this lab, you'll learn:

- How to create a Dockerfile
- Building Docker images  
- Running containers
- Basic Docker commands

## Prerequisites
- Basic command line knowledge
- Understanding of applications and services

Let's get started!`,
    yamlSpec: `
environment:
  baseImage: docker:24-dind
  setup:
    - apk add --no-cache bash curl git
    - dockerd-entrypoint.sh & sleep 3

tasks:
  - id: create_dockerfile
    title: Create a Dockerfile
    description: |
      Create a Dockerfile that uses Alpine Linux as base image and prints "Hello DevLab".
      
      Use the \`echo\` command to output the message.
    hint: Use FROM alpine and CMD echo "Hello DevLab"
    points: 25
    checks:
      - type: fileContains
        file: Dockerfile
        contains: "FROM alpine"
      - type: fileContains  
        file: Dockerfile
        contains: "Hello DevLab"

  - id: build_image
    title: Build the Docker image
    description: |
      Build your Dockerfile into an image tagged as \`devlab:1.0\`.
    hint: Use docker build -t devlab:1.0 .
    points: 25
    checks:
      - type: commandExitCode
        command: docker build -t devlab:1.0 .
        expect: 0

  - id: run_container
    title: Run the container
    description: |
      Run the \`devlab:1.0\` image and verify it outputs "Hello DevLab".
    hint: Use docker run --rm devlab:1.0
    points: 25
    checks:
      - type: commandExitCode
        command: docker run --rm devlab:1.0 | grep "Hello DevLab"
        expect: 0

  - id: list_images
    title: List Docker images
    description: |
      Use Docker commands to list all images and confirm \`devlab:1.0\` exists.
    hint: Use docker images or docker image ls
    points: 25
    checks:
      - type: commandExitCode
        command: docker images devlab:1.0 | grep "devlab"
        expect: 0`
  },
  {
    slug: 'git-branching',
    title: 'Git Branching Strategies',
    topic: 'git',
    level: 'intermediate', 
    durationMins: 25,
    summary: 'Master Git branching, merging, and collaborative workflows.',
    markdownIntro: `# Git Branching Strategies

Learn essential Git branching techniques:

- Creating and switching branches
- Merging strategies
- Resolving conflicts
- Best practices for team collaboration

## What You'll Build
A sample project with feature branches, merges, and conflict resolution.`,
    yamlSpec: `
environment:
  baseImage: alpine/git:latest
  setup:
    - apk add --no-cache bash
    - git config --global user.email "student@devlab.io"
    - git config --global user.name "DevLab Student"

tasks:
  - id: init_repo
    title: Initialize Git repository
    description: |
      Create a new Git repository and add an initial README file.
    hint: Use git init, create README.md, then git add and git commit
    points: 20
    checks:
      - type: commandExitCode
        command: test -d .git
        expect: 0
      - type: fileContains
        file: README.md
        contains: "DevLab"

  - id: create_branch
    title: Create feature branch
    description: |
      Create and switch to a new branch called \`feature/login\`.
    hint: Use git checkout -b feature/login
    points: 20
    checks:
      - type: commandExitCode
        command: git branch | grep "feature/login"
        expect: 0

  - id: make_changes
    title: Make changes and commit
    description: |
      Create a file called \`login.js\` with some JavaScript code and commit it.
    hint: Create the file, git add, then git commit
    points: 30
    checks:
      - type: fileContains
        file: login.js
        contains: "function"
      - type: commandExitCode
        command: git log --oneline | grep -i login
        expect: 0

  - id: merge_branch
    title: Merge feature branch
    description: |
      Switch back to main branch and merge the feature branch.
    hint: git checkout main, then git merge feature/login
    points: 30
    checks:
      - type: commandExitCode
        command: git log --oneline | wc -l | grep -E "^[2-9]"
        expect: 0`
  },
  {
    slug: 'linux-basics',
    title: 'Linux Command Line Essentials',
    topic: 'linux',
    level: 'beginner',
    durationMins: 20,
    summary: 'Master essential Linux commands for file manipulation, permissions, and system navigation.',
    markdownIntro: `# Linux Command Line Essentials

Get comfortable with the Linux terminal:

- File system navigation
- File and directory operations  
- Permissions and ownership
- Text processing commands

## Learning Objectives
By the end of this lab, you'll be proficient with core Linux commands used in DevOps workflows.`,
    yamlSpec: `
environment:
  baseImage: ubuntu:22.04
  setup:
    - apt update && apt install -y bash curl wget

tasks:
  - id: navigate_filesystem
    title: Navigate the filesystem
    description: |
      Navigate to the \`/tmp\` directory and create a directory called \`devlab\`.
    hint: Use cd /tmp && mkdir devlab
    points: 25
    checks:
      - type: commandExitCode
        command: test -d /tmp/devlab
        expect: 0

  - id: create_files
    title: Create and edit files
    description: |
      In the devlab directory, create a file called \`servers.txt\` with three server names (one per line).
    hint: Use echo or cat with redirection
    points: 25
    checks:
      - type: fileContains
        file: /tmp/devlab/servers.txt
        contains: "server"
      - type: commandExitCode
        command: wc -l /tmp/devlab/servers.txt | grep "3"
        expect: 0

  - id: file_permissions
    title: Set file permissions
    description: |
      Make the servers.txt file readable and writable by owner only (600).
    hint: Use chmod 600 /tmp/devlab/servers.txt
    points: 25
    checks:
      - type: commandExitCode
        command: ls -l /tmp/devlab/servers.txt | grep "^-rw-------"
        expect: 0

  - id: find_files
    title: Search for files
    description: |
      Use find command to locate all .txt files in the /tmp directory.
    hint: Use find /tmp -name "*.txt"
    points: 25
    checks:
      - type: commandExitCode
        command: find /tmp -name "*.txt" | grep servers.txt
        expect: 0`
  }
];

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPasswordHash = await bcrypt.hash('admin123', 12);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@devlab.io' },
    update: {},
    create: {
      email: 'admin@devlab.io',
      passwordHash: adminPasswordHash,
      role: 'admin'
    }
  });

  console.log('✅ Created admin user:', adminUser.email);

  // Create sample labs
  for (const labData of sampleLabs) {
    const lab = await prisma.lab.upsert({
      where: { slug: labData.slug },
      update: { ...labData, createdById: adminUser.id, isPublished: true },
      create: { ...labData, createdById: adminUser.id, isPublished: true }
    });
    console.log('✅ Created lab:', lab.title);
  }

  // Create sample badges
  const badges = [
    {
      name: 'Docker Novice',
      description: 'Completed first Docker lab',
      criteriaJson: JSON.stringify({ topic: 'docker', count: 1 })
    },
    {
      name: 'Git Master',
      description: 'Completed 3 Git labs',
      criteriaJson: JSON.stringify({ topic: 'git', count: 3 })
    },
    {
      name: 'Linux Guru',
      description: 'Mastered Linux fundamentals',
      criteriaJson: JSON.stringify({ topic: 'linux', count: 5 })
    }
  ];

  for (const badgeData of badges) {
    await prisma.badge.upsert({
      where: { name: badgeData.name },
      update: badgeData,
      create: badgeData
    });
    console.log('✅ Created badge:', badgeData.name);
  }

  console.log('🎉 Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });