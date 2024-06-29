const bs58 = require('bs58');

const wallet1PrivateKeyBase58 = 'private_key_de_onde_vai_sair';

const wallet2Address = 'public_key_para_onde_vai_enviar';

const { Connection, Keypair, PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction } = require('@solana/web3.js');

// Configure a conexão com a rede da Solana
const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');

// Função para verificar e enviar SOL
async function verificarEEnviarSOL() {
    try {
        // Decodifica a chave privada e cria um par de chaves (Keypair)
        const wallet1PrivateKeyBytes = bs58.decode(wallet1PrivateKeyBase58);
        const wallet1Keypair = Keypair.fromSecretKey(wallet1PrivateKeyBytes);

        const wallet1PublicKey = wallet1Keypair.publicKey;
        const wallet2PublicKey = new PublicKey(wallet2Address);

        // Obtém o saldo da wallet1
        const wallet1Balance = await connection.getBalance(wallet1PublicKey);
        console.log(`Saldo da Wallet 1: ${wallet1Balance} lamports`);

        // Se houver saldo, enviar para wallet2
        if (wallet1Balance > 0) {
            // Obter o recentBlockhash
            const { blockhash } = await connection.getRecentBlockhash('confirmed');

            // Estima a taxa de transação
            const transaction = new Transaction({
                recentBlockhash: blockhash,
                feePayer: wallet1PublicKey,
            }).add(
                SystemProgram.transfer({
                    fromPubkey: wallet1PublicKey,
                    toPubkey: wallet2PublicKey,
                    lamports: 1, // Temporariamente usar 1 lamport para calcular a taxa
                })
            );

            const estimatedFee = await connection.getFeeForMessage(transaction.compileMessage(), 'confirmed');

            // Construir a transação para enviar SOL para a wallet2 subtraindo a taxa estimada
            const transactionWithFee = new Transaction({
                recentBlockhash: blockhash,
                feePayer: wallet1PublicKey,
            }).add(
                SystemProgram.transfer({
                    fromPubkey: wallet1PublicKey,
                    toPubkey: wallet2PublicKey,
                    lamports: wallet1Balance - estimatedFee.value, // Enviar saldo menos a taxa
                })
            );

            // Assinar e enviar a transação
            const signature = await sendAndConfirmTransaction(connection, transactionWithFee, [wallet1Keypair]);
            console.log(`Transação enviada: ${signature}`);
        }
    } catch (error) {
        console.error('Erro ao executar a transação:', error);
    }
}

// Executar a função
verificarEEnviarSOL();
setInterval(verificarEEnviarSOL, 5000);
