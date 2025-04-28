# Running Cypress Tests in Parallel

This project includes a Docker Compose setup that allows running Cypress tests in parallel with isolated environments to prevent test interference.

## Overview

The setup creates three separate, isolated environments:

1. **Discussions Environment**: For running tests in `cypress/e2e/discussions/`
2. **Events Environment**: For running tests in `cypress/e2e/events/`
3. **Comments Environment**: For running tests in `cypress/e2e/comments/` and `cypress/e2e/channels/`

Each environment has its own:
- Neo4j database
- Backend server
- Frontend application
- Cypress test runner

This isolation ensures that tests running in one environment don't interfere with tests in another environment, allowing true parallelization.

## Prerequisites

- Docker and Docker Compose installed on your system
- Environment variables configured (see `.env.cypress.example`)

## Setting Up the Environment

1. Copy the example environment file and customize it:
   ```
   cp .env.cypress.example .env.cypress
   ```

2. Edit `.env.cypress` with your actual values:
   - Auth0 credentials
   - API keys
   - Test user credentials
   - Database passwords
   - Other configuration values

## Running Parallel Tests

Use the provided script to run tests in parallel:

```bash
./run-parallel-tests.sh
```

### Options

- **Run specific test groups**:
  ```bash
  ./run-parallel-tests.sh -t discussions  # Only run discussion tests
  ./run-parallel-tests.sh -t events       # Only run event tests
  ./run-parallel-tests.sh -t comments     # Only run comment and channel tests
  ```

- **Force rebuild of Docker images**:
  ```bash
  ./run-parallel-tests.sh -b
  ```

- **Force kill processes using required ports**:
  ```bash
  ./run-parallel-tests.sh -f
  ```

- **Use a different environment file**:
  ```bash
  ./run-parallel-tests.sh --env-file .env.custom
  ```

- **Get help with all options**:
  ```bash
  ./run-parallel-tests.sh -h
  ```

### Troubleshooting Script

If you encounter issues with ports or containers not stopping properly, you can use the included cleanup script:

```bash
./stop-all-containers.sh
```

This script will:
1. Stop all relevant containers (frontend, backend, database, cypress)
2. Remove these containers
3. Remove related Docker networks
4. Check for processes using required ports and offer to kill them

## Test Results

After the tests complete:

- **Videos** are saved to:
  - `cypress/videos/discussions/`
  - `cypress/videos/events/`
  - `cypress/videos/comments/`

- **Screenshots** (on failure) are saved to:
  - `cypress/screenshots/discussions/`
  - `cypress/screenshots/events/`
  - `cypress/screenshots/comments/`

## Performance Considerations

- Each environment requires significant system resources
- Running all three in parallel might be resource-intensive on some machines
- Consider using `-t` to run only one test group at a time if you experience performance issues

## Troubleshooting

1. **Port conflicts**:
   - The script automatically checks for port conflicts before starting
   - Required ports: 3000-3002, 4001-4003, 7474-7476, 7687-7689
   - If you have port conflicts, you can:
     - Stop services using those ports
     - Edit docker-compose.cypress.yml to use different ports
     - Run with only one test group at a time: `./run-parallel-tests.sh -t events`

2. **Container startup failures**:
   - Check the logs for specific errors: `docker-compose -f docker-compose.cypress.yml logs`
   - Ensure all required environment variables are set
   - Verify that Docker has enough resources allocated (memory, CPU)

3. **Test failures**:
   - Check the Cypress videos and screenshots for visual evidence of failures
   - Examine the container logs for each service
   - Verify your Auth0 test credentials are correct

4. **Database issues**:
   - To reset databases, remove the volumes:
     ```bash
     docker-compose -f docker-compose.cypress.yml down -v
     ```

5. **Auth0 authentication issues**:
   - Verify your Auth0 configuration
   - Check that your test users have the necessary permissions
   - Ensure your Auth0 domain is configured correctly

## Example: Whole Test Workflow

```bash
# 1. Set up environment
cp .env.cypress.example .env.cypress
# Edit .env.cypress with your credentials

# 2. Run all tests in parallel
./run-parallel-tests.sh -b  # Force rebuild on first run

# 3. Check the results
open cypress/videos/  # View the test videos
```