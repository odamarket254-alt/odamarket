const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /const fetchProfile = async \(userId: string, retries = 3\) => \{[\s\S]*?setLoading\(false\);\n    \} catch \(e\) \{\n      console\.error\(e\);\n      setLoading\(false\);\n    \}\n  \};/;

const replacement = `const fetchProfile = async (userId: string, retries = 3) => {
    console.log("[Auth] fetchProfile called for userId:", userId);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select('*').limit(100)
        .eq("id", userId)
        .single();
        
      console.log("[Auth] Profiles query result:", { data, error });

      if (error && retries > 0 && error.code === "PGRST116") {
        console.log("[Auth] Profile not found yet, retrying...");
        // PostgREST 116 is "Rows count does not match the expected 1" (not found)
        setTimeout(() => fetchProfile(userId, retries - 1), 500);
        return;
      }

      if (!error && data) {
        console.log("[Auth] Profile role from DB:", data.role);
        // Fallback for legacy setups
        const normalizedRole = data.role === "supplier" ? "seller" : data.role;
        console.log("[Auth] Normalized role:", normalizedRole);
        setProfile({ ...data, role: normalizedRole });
      }

      setLoading(false);
    } catch (e) {
      console.error("[Auth] fetchProfile exception:", e);
      setLoading(false);
    }
  };`;

if (regex.test(code)) {
    code = code.replace(regex, replacement);
    fs.writeFileSync('src/App.tsx', code);
    console.log("Replaced successfully.");
} else {
    console.log("Regex did not match.");
}
