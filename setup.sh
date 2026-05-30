#!/bin/bash
echo ""
echo "=== SmartVerses AI Setup ==="
echo ""

# Check if .env exists and has real key
if [ ! -f .env ]; then
  echo "Creating .env file..."
  cat > .env << 'ENVEOF'
ANTHROPIC_API_KEY=PASTE_YOUR_KEY_HERE
BIBLE_API_KEY=fyhclwtr2sTw3Qsczmcdn
PORT=3000
ENVEOF
  echo "✅ .env file created"
  echo ""
  echo "⚠️  NOW: open .env and replace PASTE_YOUR_KEY_HERE with your Anthropic key"
  echo "   Get key from: https://console.anthropic.com"
  exit 1
fi

# Check key is set
if grep -q "PASTE_YOUR_KEY_HERE" .env; then
  echo "❌ You still need to add your Anthropic API key to .env"
  echo "   Get it from: https://console.anthropic.com"
  exit 1
fi

echo "✅ .env looks good"
echo "✅ Installing packages..."
npm install --silent

echo ""
echo "✅ All ready! Starting server..."
echo ""
node server.js
