// FILE: scripts/disable-signup.mjs
// DESCRIPTION: Disable autoSignUpEmail after users are created

import fs from "fs";
import path from "path";

const authFilePath = path.join(
  process.cwd(),
  "src",
  "lib",
  "auth.js"
);

try {
  let content = fs.readFileSync(authFilePath, "utf-8");
  
  // Replace autoSignUpEmail: true with false
  content = content.replace(
    /autoSignUpEmail: true/g,
    "autoSignUpEmail: false"
  );
  
  fs.writeFileSync(authFilePath, content, "utf-8");
  
  console.log("✅ autoSignUpEmail disabled in src/lib/auth.js");
  console.log("\n📝 Restart your dev server to apply changes:");
  console.log("   npm run dev");
} catch (error) {
  console.error("❌ Error:", error.message);
  process.exit(1);
}
