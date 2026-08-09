const fs = require('fs');
const file = 'src/components/layout/RoleRedirect.tsx';
let content = fs.readFileSync(file, 'utf8');

const replacement = `  if (!user || !profile) {
    return <Navigate to="/login" replace />;
  }

  // Map roles to their respective dashboards
  let dashboardPath = \`/\${profile.role}/dashboard\`;
  if (profile.role === 'customer') {
    dashboardPath = '/buyer/dashboard';
  }

  return <Navigate to={dashboardPath} replace />;
`;

content = content.replace(`  if (!user || !profile) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={\`/\${profile.role}/dashboard\`} replace />;`, replacement);

fs.writeFileSync(file, content);
