#!/bin/bash

# Check if the SQLite database file exists
if [ ! -f "brukarSystem.db" ]; then
	echo "Error: SQLite database file 'brukarSystem.db' not found."
	exit 1
fi

# Set role for the user with username 'gaute' to 1 using SQLite
sqlite3 brukarSystem.db <<EOF
UPDATE users SET role = 1 WHERE username = 'gaute';
EOF

echo "Role for user 'gaute' set to 1 successfully."
