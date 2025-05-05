#!/bin/bash

# Generate a 4096-bit RSA private key
openssl genrsa -out localhost.key 

# Create a certificate signing request (CSR)
openssl req -new -key localhost.key -out localhost.csr -subj "/CN=localhost/O=YourOrganization/C=US"

# Create the self-signed certificate with 100 years validity
# 36500 days = 100 years (essentially "forever" for practical purposes)
openssl x509 -req -days 36500 -in localhost.csr -signkey localhost.key -out localhost.crt

echo "Created self-signed certificate valid for 100 years"
echo "  - Private key: localhost.key"
echo "  - Certificate: localhost.crt"

