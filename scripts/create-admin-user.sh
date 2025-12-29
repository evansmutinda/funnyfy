#!/bin/bash
# Bash script to create an admin user
# Run: bash scripts/create-admin-user.sh

API_URL="${API_URL:-https://funnyfyapp.vercel.app}"

echo "Creating admin user..."
echo "API URL: $API_URL"
echo ""

response=$(curl -s -X POST "$API_URL/api/admin/create-admin-user" \
  -H "Content-Type: application/json" \
  -d '{}')

# Check if curl was successful
if [ $? -eq 0 ]; then
  # Extract user ID (requires jq or manual parsing)
  if command -v jq &> /dev/null; then
    userId=$(echo $response | jq -r '.userId')
    echo "✅ User created successfully!"
    echo ""
    echo "Your Admin User ID: $userId"
    echo ""
    echo "Next steps:"
    echo "1. Copy the User ID above"
    echo "2. Go to Vercel Dashboard → Settings → Environment Variables"
    echo "3. Add ADMIN_USER_IDS with your User ID"
    echo "4. Redeploy your project"
    echo "5. Visit: $API_URL/admin/login"
  else
    echo "Response: $response"
    echo ""
    echo "Install 'jq' for better output: brew install jq (Mac) or apt-get install jq (Linux)"
  fi
else
  echo "❌ Error: Failed to create user"
  echo "Response: $response"
fi

