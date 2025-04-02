#!/bin/bash

set -e  # Exit on error

# Display help information
function show_help {
  echo "Usage: ./run-parallel-tests.sh [options]"
  echo ""
  echo "Run Cypress tests in parallel using Docker Compose"
  echo ""
  echo "Options:"
  echo "  -h, --help               Show this help message"
  echo "  -t, --type TYPE          Run specific test type (discussions, events, comments, or all)"
  echo "  -b, --build              Force rebuild of Docker images"
  echo "  -f, --force              Force kill processes using required ports"
  echo "  --env-file FILE          Specify an environment file to use (default: .env)"
  echo ""
  echo "Examples:"
  echo "  ./run-parallel-tests.sh              # Run all tests in parallel"
  echo "  ./run-parallel-tests.sh -t events    # Run only event tests"
  echo "  ./run-parallel-tests.sh -b           # Force rebuild of all images"
  echo "  ./run-parallel-tests.sh -f           # Force kill processes using required ports"
}

# Function to check if port is in use
function check_port_in_use {
  local port=$1
  if lsof -i :$port >/dev/null 2>&1; then
    echo "⚠️  Port $port is already in use."
    if [[ "$FORCE_KILL" == true ]]; then
      echo "Attempting to kill process using port $port..."
      pid=$(lsof -ti:$port)
      if [ ! -z "$pid" ]; then
        kill -9 $pid
        echo "Process $pid killed."
        return 0
      else
        echo "Could not find process using port $port."
        return 1
      fi
    else
      return 1
    fi
  fi
  return 0
}

# Function to check required ports
function check_ports {
  local ports=("3000" "3001" "3002" "4003" "4001" "4002" "7474" "7475" "7476" "7687" "7688" "7689")
  local failed=0
  
  echo "Checking if required ports are available..."
  for port in "${ports[@]}"; do
    if ! check_port_in_use $port; then
      echo "Consider using the -f flag to automatically kill processes using required ports."
      failed=1
    fi
  done
  
  if [ $failed -eq 1 ]; then
    if [[ "$FORCE_KILL" == true ]]; then
      echo "Some processes could not be killed automatically."
      echo "Please manually stop services using the conflicting ports."
      return 1
    else
      echo "❌ Some required ports are already in use."
      echo "Use -f flag to automatically kill processes using these ports."
      return 1
    fi
  fi
  
  echo "✅ All required ports are available."
  return 0
}

# Default values
TEST_TYPE="all"
REBUILD=false
ENV_FILE=".env"
FORCE_KILL=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help)
      show_help
      exit 0
      ;;
    -t|--type)
      TEST_TYPE="$2"
      shift 2
      ;;
    -b|--build)
      REBUILD=true
      shift
      ;;
    --env-file)
      ENV_FILE="$2"
      shift 2
      ;;
    -f|--force)
      FORCE_KILL=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      show_help
      exit 1
      ;;
  esac
done

# Validate test type
if [[ "$TEST_TYPE" != "all" && "$TEST_TYPE" != "discussions" && "$TEST_TYPE" != "events" && "$TEST_TYPE" != "comments" ]]; then
  echo "Error: Invalid test type '$TEST_TYPE'. Must be 'discussions', 'events', 'comments', or 'all'."
  exit 1
fi

# Check if the env file exists
if [[ ! -f "$ENV_FILE" ]]; then
  echo "Error: Environment file '$ENV_FILE' not found."
  echo "Please create this file with the required environment variables."
  exit 1
fi

echo "🚀 Starting parallel Cypress tests with Docker Compose"
echo "Test type: $TEST_TYPE"
echo "Using environment file: $ENV_FILE"

# Create output directories if they don't exist
mkdir -p cypress/videos/discussions cypress/videos/events cypress/videos/comments
mkdir -p cypress/screenshots/discussions cypress/screenshots/events cypress/screenshots/comments

# Run the script to stop all containers and free ports if needed
echo "Cleaning up existing containers and networks..."
./stop-all-containers.sh

# Check required ports before starting
if ! check_ports; then
  echo "Would you like to proceed anyway? This might cause errors. (y/n)"
  read -r proceed
  if [[ "$proceed" != "y" && "$proceed" != "Y" ]]; then
    echo "Aborting. Please resolve port conflicts and try again."
    exit 1
  fi
  echo "Proceeding despite port conflicts..."
fi

# Determine which services to run based on the test type
if [[ "$TEST_TYPE" == "all" ]]; then
  SERVICES="cypress-discussions cypress-events cypress-comments"
  echo "Running all test groups in parallel"
else
  SERVICES="cypress-$TEST_TYPE"
  echo "Running only $TEST_TYPE tests"
fi

# Run Docker Compose
BUILD_ARG=""
if [[ "$REBUILD" == true ]]; then
  BUILD_ARG="--build"
  echo "Forcing rebuild of Docker images"
fi

# Start the tests
echo "Starting tests..."
docker-compose -f docker-compose.cypress.yml --env-file "$ENV_FILE" up $BUILD_ARG --abort-on-container-exit $SERVICES

# Shut down containers when done
echo "Tests completed, shutting down containers..."
docker-compose -f docker-compose.cypress.yml down

echo "✅ Test run completed. Results are saved in cypress/videos and cypress/screenshots directories."