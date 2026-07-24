import crypto from 'crypto';
const hash = crypto.createHash('sha256').update('123456').digest('hex');
console.log(hash);
