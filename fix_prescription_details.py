#!/usr/bin/env python3
"""
Script to remove isEditing conditionals and Edit/Save/Cancel buttons from PrescriptionDetails.tsx
This makes the form always editable with auto-save functionality.
"""

import re

# Read the file
with open('/home/david/280-new-3/frontend/src/components/PrescriptionDetails.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the renderFieldLTR and renderFieldRTL functions' isEditing conditionals
# These functions have complex nested structures, so we'll handle them carefully

# Pattern 1: Remove `if (isEditing) {` blocks in renderFieldLTR (keep only the editing version)
# We need to find the pattern and remove the else block that shows read-only data

# First, let's remove the Edit/Save/Cancel button section
# Find the section with {!isEditing ? ( ... Edit button ... ) : ( ... Save/Cancel buttons ... )}
edit_save_pattern = r'\{!isEditing \? \(.*?<Edit2.*?/>.*?</button>.*?\) : \(.*?<Save.*?/>.*?<X.*?/>.*?</button>.*?\)\}'
content = re.sub(edit_save_pattern, '', content, flags=re.DOTALL)

# Remove standalone setIsEditing calls in button onClick handlers
content = re.sub(r'onClick=\{\(\) => setIsEditing\(true\)\}', '', content)
content = re.sub(r'setIsEditing\(false\);?\s*', '', content)

# Save the modified content
with open('/home/david/280-new-3/frontend/src/components/PrescriptionDetails.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("File modified successfully!")
