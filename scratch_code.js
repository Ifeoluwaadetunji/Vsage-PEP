const crypto = require('crypto');

function getDailyAdminCode(offsetDays = 0) {
  const secret = 'default_dev_secret_change_me_in_prod';
  
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + offsetDays);
  
  // Format: YYYY-MM-DD (UTC)
  const dateString = date.toISOString().split('T')[0];
  
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(dateString);
  
  const hashHex = hmac.digest('hex');
  const hashInt = parseInt(hashHex.substring(0, 8), 16);
  const code = (hashInt % 1000000).toString().padStart(6, '0');
  
  return code;
}

console.log(getDailyAdminCode());
