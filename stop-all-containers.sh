#!/bin/bash

# Print out all running containers
echo "Currently running containers:"
docker ps

# Stop any containers with names matching our test containers
echo "Stopping any running containers related to tests..."
for container in $(docker ps -a --filter "name=*frontend*" --filter "name=*backend*" --filter "name=*database*" --filter "name=*cypress*" -q); do
  echo "Stopping container: $(docker ps -a --filter "id=$container" --format "{{.Names}}")"
  docker stop $container
done

# Remove all containers
echo "Removing all stopped containers..."
for container in $(docker ps -a --filter "name=*frontend*" --filter "name=*backend*" --filter "name=*database*" --filter "name=*cypress*" -q); do
  echo "Removing container: $(docker ps -a --filter "id=$container" --format "{{.Names}}")"
  docker rm $container
done

# Remove all networks
echo "Removing networks..."
for network in $(docker network ls --filter "name=*cypress*" --filter "name=*discussions*" --filter "name=*events*" --filter "name=*comments*" -q); do
  echo "Removing network: $(docker network ls --filter "id=$network" --format "{{.Name}}")"
  docker network rm $network
done

# Check if any processes are using ports we need
echo "Checking for processes using our required ports..."
ports=(3000 3001 3002 4000 4001 4002 4003 7474 7475 7476 7687 7688 7689)
for port in "${ports[@]}"; do
  pid=$(lsof -ti:$port)
  if [ ! -z "$pid" ]; then
    echo "Process $pid is using port $port"
    read -p "Do you want to kill this process? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      echo "Killing process $pid"
      kill -9 $pid
    fi
  fi
done

echo "All test-related containers have been stopped and removed!"
echo "You can now try running tests again."