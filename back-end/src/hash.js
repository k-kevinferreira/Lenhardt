const bcrypt = require('bcryptjs');

(async () => {
  const senha = '123456'; 
  const hash = await bcrypt.hash(senha, 10);
  console.log('HASH GERADO:', hash);
})();
