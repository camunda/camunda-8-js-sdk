#!/usr/bin/env bash

# Runs the given command 100 times and counts failures.
# Useful for stress testing or ensuring stability of tests.
# Usage: npm run stress -- <command>
# Example: npm run stress -- "npx jest publishMessage"

# Check if a command was passed
if [ $# -eq 0 ]; then
  echo "Usage: npm run stress -- <command>"
  exit 1
fi

# Compose the command
CMD="$@"
FAILURES=0

for i in $(seq 1 100); do
  echo -ne "Running [$i/100]...\r"
  
  # Run the command and check exit code
  $CMD
  if [ $? -ne 0 ]; then
    ((FAILURES++))
  fi
done

echo ""
echo "$FAILURES/100 failures"