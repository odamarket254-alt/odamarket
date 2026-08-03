const fs = require('fs');
const file = 'src/components/layout/NotificationBell.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /const markAllAsRead = async \(\) => \{[\s\S]*?if \(!error\) \{/g,
  `const markAllAsRead = async () => {
    if (unreadCount === 0) return;
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    
    if (unreadIds.length === 0) return;
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .in("id", unreadIds)
        .eq("user_id", user!.id);
      if (!error) {`
);

content = content.replace(
  /setUnreadCount\(0\);\n    \}\n  \};/g,
  `setUnreadCount(0);
      }
    } catch(err) {
      console.error(err);
    }
  };`
);

fs.writeFileSync(file, content);
console.log("Fixed NotificationBell");
