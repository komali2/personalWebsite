#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting Personal Website deployment process...${NC}"

# Get FTP credentials from pass
echo -e "${YELLOW}Retrieving FTP credentials from pass...${NC}"
FTP_HOST=$(pass Bluehost/host)
FTP_USER=$(pass Bluehost/user)
FTP_PASS=$(pass Bluehost/password)
PUBLIC_DIR="."

if [ -z "$FTP_HOST" ] || [ -z "$FTP_USER" ] || [ -z "$FTP_PASS" ]; then
    echo -e "${RED}Error: Could not retrieve complete FTP credentials from pass.${NC}"
    echo "Please ensure you have entries for Bluehost/host, Bluehost/user, and Bluehost/password"
    exit 1
fi

# Create a temporary script for lftp
LFTP_SCRIPT=$(mktemp)

cat > "$LFTP_SCRIPT" << EOF
# Set options
set ftp:ssl-allow true
set ssl:verify-certificate no
set ftp:list-options -a
set net:max-retries 3
set net:timeout 10

# Connect to the server
open -u "$FTP_USER","$FTP_PASS" "$FTP_HOST"

# Mirror the local directory to the remote server
# -R: reverse mirror (upload)
# --only-newer: skip files that are newer on the target
# --ignore-time: compare by size and checksum, not timestamp
# --parallel=5: upload 5 files simultaneously
# --verbose: show what's happening
mirror -R --only-newer --ignore-time --parallel=5 --verbose \
    -X .git/ -X .git \
    -X node_modules/ \
    -X .vscode/ \
    -X package.json -X package-lock.json \
    -X .gitignore -X .prettierrc -X README.md \
    -X deploy.sh \
    "$PUBLIC_DIR/" .

# Exit
bye
EOF

# Upload files using lftp
echo -e "${YELLOW}Uploading files to Bluehost via FTP...${NC}"
lftp -f "$LFTP_SCRIPT"

# Check if upload was successful
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: FTP upload failed.${NC}"
    rm "$LFTP_SCRIPT"
    exit 1
fi

# Clean up
rm "$LFTP_SCRIPT"

echo -e "${GREEN}Deployment completed successfully!${NC}"
