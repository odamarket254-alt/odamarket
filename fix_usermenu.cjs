const fs = require('fs');
const file = 'src/components/layout/admin/UserMenu.tsx';
let content = fs.readFileSync(file, 'utf8');

// The UserMenu doesn't have useAuthStore imported, let's just use the profile role instead of user_metadata
content = content.replace(
  /import React, \{ useState, useRef, useEffect \} from 'react';/,
  "import React, { useState, useRef, useEffect } from 'react';\nimport { useAuthStore } from '../../../store/useAuthStore';"
);

content = content.replace(
  /export default function UserMenu\(\{ user \}: UserMenuProps\) \{/,
  "export default function UserMenu({ user }: UserMenuProps) {\n  const { profile } = useAuthStore();"
);

content = content.replace(
  /\{user\?\.user_metadata\?\.role \|\| 'Administrator'\}/,
  "{profile?.role || 'Administrator'}"
);

content = content.replace(
  /\{user\?\.user_metadata\?\.full_name \|\| 'Admin User'\}/g,
  "{profile?.first_name ? `${profile.first_name} ${profile.last_name || ''}` : 'Admin User'}"
);

content = content.replace(
  /\{user\?\.user_metadata\?\.full_name\?.charAt\(0\) \|\| 'A'\}/g,
  "{profile?.first_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'A'}"
);

content = content.replace(
  /\{user\?\.user_metadata\?\.full_name\}/g,
  "{profile?.first_name ? `${profile.first_name} ${profile.last_name || ''}` : user?.email}"
);

fs.writeFileSync(file, content);
