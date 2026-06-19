import fs from "fs";

const date = new Date().toISOString().split('T')[0];
const commit = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'local';

fs.writeFileSync(
  './src/lib/build-info.json',  // adjust if needed
  JSON.stringify({ date, commit }, null, 2)
);
