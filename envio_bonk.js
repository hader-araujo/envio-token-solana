const bs58 = require('bs58');
const splToken = require('@solana/spl-token');

const wallet1PrivateKeyBase58 = 'private_key_de_onde_vai_sair';

const wallet2Address = 'public_key_para_onde_vai_enviar';

// Endereço do token SPL BONK
const tokenAddress = 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263';

const { Connection, Keypair, PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction } = require('@solana/web3.js');

// Configure a conexão com a rede da Solana
const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');

// Função para verificar e enviar tokens SPL
async function verificarEEnviarSPL() {
    try {
        // Decodifica a chave privada e cria um par de chaves (Keypair)
        const wallet1PrivateKeyBytes = bs58.decode(wallet1PrivateKeyBase58);
        const wallet1Keypair = Keypair.fromSecretKey(wallet1PrivateKeyBytes);

        const wallet1PublicKey = wallet1Keypair.publicKey;
        const wallet2PublicKey = new PublicKey(wallet2Address);

        // Criar instância do token SPL
        const tokenPublicKey = new PublicKey(tokenAddress);

        // Pegar a conta associada do token para a wallet1
        const wallet1TokenAccount = await splToken.getOrCreateAssociatedTokenAccount(
            connection,
            wallet1Keypair,
            tokenPublicKey,
            wallet1PublicKey
        );
        const wallet2TokenAccount = await splToken.getOrCreateAssociatedTokenAccount(
            connection,
            wallet1Keypair,
            tokenPublicKey,
            wallet2PublicKey
        );

        // Obtém o saldo do token na wallet1
        const wallet1TokenBalance = await connection.getTokenAccountBalance(wallet1TokenAccount.address);
        console.log(`Saldo do token na Wallet 1: ${wallet1TokenBalance.value.uiAmount} tokens`);

        // Se houver saldo, enviar para wallet2
        if (wallet1TokenBalance.value.uiAmount > 0) {
            // Construir a transação para enviar tokens SPL para a wallet2
            const transaction = new Transaction().add(
                splToken.createTransferInstruction(
                    wallet1TokenAccount.address,
                    wallet2TokenAccount.address,
                    wallet1PublicKey,
                    wallet1TokenBalance.value.amount,
                    [],
                    splToken.TOKEN_PROGRAM_ID
                )
            );

            // Assinar e enviar a transação
            const signature = await sendAndConfirmTransaction(connection, transaction, [wallet1Keypair]);
            console.log(`Transação de token enviada: ${signature}`);
        }
    } catch (error) {
        console.error('Erro ao executar a transação:', error);
    }
}

// Executar a função
verificarEEnviarSPL();
setInterval(verificarEEnviarSPL, 5000);
