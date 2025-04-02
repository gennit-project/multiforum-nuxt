#!/bin/bash

echo "This script will attempt to restart Docker and clean up resources."
echo "It requires administrative privileges to restart the Docker daemon."

# Stop all Docker containers first
echo "Stopping all running Docker containers..."
docker stop $(docker ps -q) 2>/dev/null || echo "No containers to stop"

# Check if Docker Desktop is running (macOS)
if pgrep -x "Docker" > /dev/null; then
    echo "Docker Desktop is running. Attempting to restart it..."
    osascript -e 'quit app "Docker"'
    sleep 5
    echo "Starting Docker Desktop again..."
    open -a Docker
    
    echo "Waiting for Docker to start (this may take a minute)..."
    # Wait for Docker to be ready
    while ! docker info > /dev/null 2>&1; do
        echo "Waiting for Docker daemon to start..."
        sleep 5
    done
    
    echo "Docker has been restarted!"
else
    # For non-macOS systems or Docker daemon running without Docker Desktop
    echo "Docker Desktop not detected. Trying to restart Docker daemon."
    echo "This may require your password for sudo access."
    
    if command -v systemctl > /dev/null; then
        # systemd-based systems
        sudo systemctl restart docker
    elif command -v service > /dev/null; then
        # init.d-based systems
        sudo service docker restart
    else
        echo "Could not detect method to restart Docker daemon."
        echo "Please restart Docker manually and try again."
        exit 1
    fi
fi

# Clean up any dangling resources
echo "Cleaning up Docker resources..."
docker system prune -f

echo "Docker restart completed. You can now try running the tests again."
echo "Run: ./run-parallel-tests.sh -f -b"