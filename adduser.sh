#!/bin/bash

# Function to generate random username
generate_username() {
	echo "user$(shuf -i 1000-9999 -n 1)"
}

# Function to generate random email
generate_email() {
	echo "$(shuf -i 1000-9999 -n 1)@example.com"
}

# Function to generate random password
generate_password() {
	echo "$(openssl rand -base64 12)"
}

# Function to generate random role (0 or 1)
generate_role() {
	echo "$(shuf -i 0-1 -n 1)"
}

# Check if the correct number of arguments are provided
if [ "$#" -ne 1 ]; then
	echo "Usage: $0 <number_of_users>"
	exit 1
fi

# Check if the SQLite database file exists
if [ ! -f "brukarSystem.db" ]; then
	echo "Error: SQLite database file 'brukarSystem.db' not found."
	exit 1
fi

# Assign the number of users to add
num_users=$1

# Loop to add users
for ((i = 1; i <= $num_users; i++)); do
	# Generate random user information
	username=$(generate_username)
	email=$(generate_email)
	password=$(generate_password)
	role=$(generate_role)

	# Insert user into the database using SQLite
	sqlite3 brukarSystem.db <<EOF
    INSERT INTO users (username, email, password, role) VALUES ('$username', '$email', '$password', '0');
EOF

	echo "User $i added successfully:"
	echo "Username: $username"
	echo "Email: $email"
	echo "Password: $password"
	echo "Role: 0"
	echo
done
