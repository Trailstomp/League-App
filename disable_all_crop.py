#!/usr/bin/env python3
import re

# Read the file
with open('/app/frontend/src/App.js', 'r') as f:
    content = f.read()

# Replace all enableCrop={true} with enableCrop={false}
content = re.sub(r'enableCrop\s*=\s*\{true\}', 'enableCrop={false}', content)

# Write back to file
with open('/app/frontend/src/App.js', 'w') as f:
    f.write(content)

print("Successfully disabled all crop functionality")