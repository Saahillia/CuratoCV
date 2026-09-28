const fs = require('fs');
const path = require('path');

const BE_FILES = [
  'platform/backend/package.json',
  'platform/backend/src/configs/db.js',
  'platform/backend/src/configs/multer.js',
  'platform/backend/src/middlewares/authMiddleware.js',
  'platform/backend/src/models/User.js',
  'platform/backend/src/models/OTP.js',
  'platform/backend/src/models/PasswordResetToken.js',
  'platform/backend/src/models/Payment.js',
  'platform/backend/src/models/Subscription.js',
  'platform/backend/src/repositories/userRepository.js',
  'platform/backend/src/repositories/paymentRepository.js',
  'platform/backend/src/repositories/subscriptionRepository.js',
  'platform/backend/src/services/billingService.js',
  'platform/backend/src/services/otpService.js',
  'platform/backend/src/services/paymentService.js'
];

const FE_FILES = [
  'platform/frontend/package.json',
  'platform/frontend/src/app/features/authSlice.js',
  'platform/frontend/src/configs/api.js',
  'platform/frontend/src/configs/products.js',
  ...fs.readdirSync('platform/frontend/src/pages', { recursive: true })
    .filter(f => f.endsWith('.jsx')).map(f => 'platform/frontend/src/pages/' + f),
  ...fs.readdirSync('platform/frontend/src/components', { recursive: true })
    .filter(f => f.endsWith('.jsx')).map(f => 'platform/frontend/src/components/' + f)
];

function analyze(files) {
  let output = "";
  for (const file of files) {
    if (!fs.existsSync(file)) continue;
    const content = fs.readFileSync(file, 'utf8');
    output += `### ${file}\n`;
    
    if (file.endsWith('.json')) {
      const pkg = JSON.parse(content);
      output += `- **Purpose:** Package definition\n`;
      output += `- **Dependencies:** ${Object.keys(pkg.dependencies || {}).join(', ')}\n`;
    } else {
      // Very basic static analysis
      const imports = [];
      const exportsList = [];
      let purpose = "Provides logic/components for " + path.basename(file, path.extname(file));
      
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('import ')) {
          imports.push(line.replace(/import\s+/, '').split('from')[0].trim());
        } else if (line.startsWith('const ') && line.includes('require(')) {
          imports.push(line);
        } else if (line.startsWith('export default ')) {
          exportsList.push(line.replace('export default ', '').replace(';', '').trim());
        } else if (line.startsWith('export const ') || line.startsWith('export function ') || line.startsWith('export class ')) {
          const match = line.match(/export (const|function|class) ([a-zA-Z0-9_]+)/);
          if (match) exportsList.push(match[2]);
        } else if (line.startsWith('module.exports =')) {
          exportsList.push("module.exports");
        }
      }
      
      output += `- **Purpose:** ${purpose}\n`;
      output += `- **Imports:** ${imports.length > 0 ? imports.slice(0, 5).join(', ') + (imports.length > 5 ? '...' : '') : 'None'}\n`;
      output += `- **Exports:** ${exportsList.join(', ') || 'None'}\n`;
    }
    output += '\n';
  }
  return output;
}

const res = "## Platform Backend\n\n" + analyze(BE_FILES) + "## Platform Frontend\n\n" + analyze(FE_FILES);
fs.writeFileSync('platform_inventory.md', res);
console.log("Done");
