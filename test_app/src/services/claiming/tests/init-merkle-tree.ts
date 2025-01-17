import * as anchor from '@project-serum/anchor';
import * as serumCmn from "@project-serum/common";
import { TokenInstructions } from '@project-serum/serum';
import * as spl from "@solana/spl-token";
import { Keypair, Signer, SystemProgram, Transaction } from "@solana/web3.js";
import { Token, MintLayout, TOKEN_PROGRAM_ID } from "@solana/spl-token";

import * as merkle from './merkle-tree';

export const provider = anchor.AnchorProvider.env();

export async function createMint(
  provider: anchor.AnchorProvider,
  payer: Signer,
  authority?: anchor.web3.PublicKey
): Promise<Token> {
  if (authority === undefined) {
    authority = provider.wallet.publicKey;
  }

  // Generate new mint keypair
  const mintKeypair = Keypair.generate();

  // Create token instance
  const token = new Token(
    provider.connection,
    mintKeypair.publicKey,
    TOKEN_PROGRAM_ID,
    payer
  );

  // Create account
  const createAccountInstruction = SystemProgram.createAccount({
    fromPubkey: payer.publicKey,
    newAccountPubkey: mintKeypair.publicKey,
    space: MintLayout.span,
    lamports: await provider.connection.getMinimumBalanceForRentExemption(MintLayout.span),
    programId: TOKEN_PROGRAM_ID,
  });

  // Initialize mint
  const tx = new Transaction();
  tx.add(createAccountInstruction);
  tx.add(
    Token.createInitMintInstruction(
      TOKEN_PROGRAM_ID,
      mintKeypair.publicKey,
      6, // decimals
      authority,
      null // freeze authority (none)
    )
  );

  tx.recentBlockhash = (await provider.connection.getLatestBlockhash("finalized")).blockhash;
  tx.feePayer = payer.publicKey;
  tx.partialSign(mintKeypair);

  // Send transaction
  await provider.sendAndConfirm(tx, [mintKeypair]);

  return token;
}

export async function generateMerkle(mint: any) {
    const data = [];
    for (var i = 0; i < 5; i++) {
        const address = await serumCmn.createTokenAccount(provider as any, mint.publicKey, provider.wallet.publicKey);
        data.push({ address, amount: i });
    }
    return merkle.getMerkleProof(data);
}

// (async () => {
//     const mint = await createMint(provider);
//     const merkleData = await generateMerkle(mint);
//
//     console.log("Mint", mint.publicKey.toString());
//     console.log("Root", JSON.stringify(merkleData.root));
//     for (const data of merkleData.proofs) {
//         console.log("======================");
//         console.log("User", data.address.toString());
//         console.log("Amount", data.amount.toNumber());
//         console.log("Proofs");
//         for (const proof of data.proofs) {
//             console.log(JSON.stringify(proof));
//         }
//     }
// })();
