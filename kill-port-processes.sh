#!/bin/bash

# List of ports that need to be free
PORTS=(3000 3001 3002 4003 4001 4002 7474 7475 7476 7687 7688 7689)

echo "Checking for processes using required ports..."

for PORT in "${PORTS[@]}"; do
  # Find PIDs using this port
  PIDS=$(lsof -t -i:$PORT 2>/dev/null)
  
  if [[ -n "$PIDS" ]]; then
    echo "Port $PORT is used by processes: $PIDS"
    echo "Killing processes on port $PORT..."
    
    for PID in $PIDS; do
      # Get process info before killing it (so you know what you're killing)
      PROCESS_INFO=$(ps -p $PID -o comm= 2>/dev/null)
      echo "Killing $PROCESS_INFO (PID: $PID) on port $PORT"
      kill -9 $PID
    done
  else
    echo "Port $PORT is free."
  fi
done

echo "Done. All processes on specified ports should now be terminated."