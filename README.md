# DevLab - Interactive DevOps Learning Platform

DevLab is a comprehensive learning platform for DevOps skills, featuring interactive labs with real-time terminal access, automated grading, and progress tracking. Similar to KodeKloud, it provides hands-on experience in containerized environments.

## Features

### 🚀 Core Functionality
- **Interactive Lab Catalog** - Browse labs by topic (Docker, Git, Linux, Kubernetes, etc.)
- **Real-time Terminal** - WebSocket-powered terminal access to containerized environments
- **Automated Grading** - Multi-type validation system (commands, files, HTTP, Kubernetes)
- **Progress Tracking** - User profiles, badges, attempt history, and scoring
- **Admin Interface** - Create and manage labs with YAML-based authoring

### 🎯 Lab Features
- **Containerized Environments** - Isolated Docker containers for each lab session
- **Step-by-step Instructions** - Collapsible instruction panels with hints
- **Multiple Check Types** - Command exit codes, file contents, HTTP status, port checks
- **Real-time Feedback** - Instant validation and scoring
- **Lab Reset** - Clean slate functionality for retrying labs

### 🛡️ Security & Safety
- **Namespaced Containers** - Isolated execution environments
- **Resource Limits** - CPU and memory constraints
- **Session TTL** - Automatic cleanup of inactive sessions
- **No Host Mounts** - Sandboxed execution for security

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for development and building
- **Tailwind CSS** for styling
- **React Router** for navigation
- **xterm.js** for terminal interface
- **Socket.IO Client** for real-time communication

### Backend
- **Node.js** with TypeScript and Express
- **Prisma ORM** with SQLite database
- **Socket.IO** for WebSocket communication
- **JWT** for authentication
- **bcryptjs** for password hashing
- **js-yaml** for lab specification parsing

### Infrastructure
- **Docker** for containerization
- **Docker Compose** for local development
- **WebSocket** for real-time terminal streaming
- **RESTful APIs** for data operations

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Docker and Docker Compose
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd devlab
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env if needed for your environment
   ```

3. **Start with Docker Compose**
   ```bash
   docker-compose up --build
   ```

4. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001

### Important Notes for Local Docker Environment

- The backend container mounts your local Docker socket (`/var/run/docker.sock`) to create lab containers
- Lab containers run on your local Docker daemon alongside the DevLab services
- Containers are automatically cleaned up after 30 minutes or when sessions end
- Make sure Docker is running on your host system before starting DevLab

### Demo Account
- **Email:** admin@devlab.io
- **Password:** admin123
- **Role:** Admin (can create and manage labs)

## Lab Authoring

Labs are defined using YAML specifications with the following structure:

```yaml
environment:
  baseImage: ubuntu:22.04
  setup:
    - apt update && apt install -y curl

tasks:
  - id: create_file
    title: Create a file
    description: |
      Create a file called `hello.txt` with content "Hello DevLab"
    hint: Use echo "Hello DevLab" > hello.txt
    points: 50
    checks:
      - type: fileContains
        file: hello.txt
        contains: "Hello DevLab"
      - type: commandExitCode
        command: test -f hello.txt
        expect: 0
```

### Supported Check Types
- `commandExitCode` - Verify command execution and exit codes
- `fileContains` - Check if files contain specific content
- `httpStatus` - Test HTTP endpoints and response codes
- `kubeResource` - Validate Kubernetes resources (requires kubectl)
- `portOpen` - Check if ports are listening
- `gitBranch` - Verify Git branch operations
- `terraformPlanNoChanges` - Terraform plan validation

## Sample Labs Included

1. **Docker Fundamentals** (30 min) - Dockerfile creation, image building, container management
2. **Git Branching Strategies** (25 min) - Branch creation, merging, collaborative workflows
3. **Linux Command Line Essentials** (20 min) - File operations, permissions, navigation

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Labs
- `GET /api/labs` - List published labs with filtering
- `GET /api/labs/:slug` - Get lab details
- `POST /api/labs` - Create lab (admin only)
- `PUT /api/labs/:id` - Update lab (admin only)

### Lab Sessions
- `POST /api/attempts` - Start new lab attempt
- `GET /api/attempts/mine` - Get user's attempts
- `POST /api/attempts/:id/check` - Run grading checks
- `POST /api/attempts/:id/reset` - Reset lab environment

### User Management
- `GET /api/users/me` - Get user profile and stats
- `GET /api/users/me/badges` - Get user badges

## Development

### Manual Setup (Alternative to Docker)

1. **Backend Setup**
   ```bash
   cd backend
   npm install
   npx prisma db push
   npx tsx src/seed.ts
   npm run dev
   ```

2. **Frontend Setup**
   ```bash
   npm install
   npm run dev
   ```

   **Note**: For manual setup, ensure Docker is available in your PATH and the Docker daemon is running.
### Database Management
```bash
# Push schema changes
npx prisma db push

# View database
npx prisma studio

# Reset and reseed
npx prisma db push --force-reset
npx tsx backend/src/seed.ts
```

## Architecture

### Docker Integration
- **Host Docker Access**: Backend container mounts `/var/run/docker.sock` for container management
- **Lab Isolation**: Each lab attempt gets its own Docker container with resource limits
- **Container Lifecycle**: Automatic creation, monitoring, and cleanup of lab containers
- **Security**: Containers run with limited privileges and automatic TTL cleanup

### Container Architecture
- **Lab Containers**: Ephemeral Docker containers for each attempt
- **Base Images**: Support for various environments (Ubuntu, Alpine, Docker-in-Docker)
- **Security**: Namespaced execution with resource limits
- **Cleanup**: Automatic container removal on session end

### Grading System
- **Multi-step Validation**: Each task can have multiple check types
- **Real-time Execution**: Commands run in the user's container namespace
- **Flexible Scoring**: Point-based system with partial credit
- **Detailed Feedback**: Comprehensive error messages and hints

### Real-time Communication
- **WebSocket Streaming**: Live terminal I/O via Socket.IO
- **Session Management**: Container lifecycle tied to WebSocket connections
- **Error Handling**: Graceful degradation and reconnection logic

## Deployment

### Production Considerations
- Set strong JWT secrets
- Configure proper database (PostgreSQL recommended)
- Set up container orchestration (Kubernetes/Docker Swarm)
- Implement proper logging and monitoring
- Configure SSL/TLS termination
- Set up backup strategies for user data
- Consider using Docker-in-Docker or dedicated container runtime for enhanced security

### Environment Security
- Container runtime security
- Network isolation
- Resource quotas and limits
- Regular security updates for base images
- User session monitoring
- Docker socket access should be restricted in production environments

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by KodeKloud's interactive learning approach
- Built with modern web technologies for optimal performance
- Designed with security and scalability in mind
- Community-driven lab content and improvements

---

**Note**: This is an MVP implementation focused on core functionality. Production deployments should include additional security hardening, monitoring, and scalability considerations.