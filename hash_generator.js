const bcrypt = require('bcrypt');
const senhaParaCodificar = 'SuaSenhaMuitoSecretaAqui'; // MUDAR ESTE VALOR!
const saltRounds = 10;

bcrypt.hash(senhaParaCodificar, saltRounds, function(err, hash) {
    if (err) {
        console.error("Erro ao gerar hash:", err);
    } else {
        console.log("------------------------------------------");
        console.log("Cole este HASH no seu server.js:");
        console.log(hash);
        console.log("------------------------------------------");
    }
});