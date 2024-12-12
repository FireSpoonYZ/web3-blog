import * as anchor from '@coral-xyz/anchor'
import {Program} from '@coral-xyz/anchor'
import {Keypair} from '@solana/web3.js'
import {Blog} from '../target/types/blog'

describe('blog', () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider)
  const payer = provider.wallet as anchor.Wallet

  const program = anchor.workspace.Blog as Program<Blog>

  const blogKeypair = Keypair.generate()

  it('Initialize Blog', async () => {
    await program.methods
      .initialize()
      .accounts({
        blog: blogKeypair.publicKey,
        payer: payer.publicKey,
      })
      .signers([blogKeypair])
      .rpc()

    const currentCount = await program.account.blog.fetch(blogKeypair.publicKey)

    expect(currentCount.count).toEqual(0)
  })

  it('Increment Blog', async () => {
    await program.methods.increment().accounts({ blog: blogKeypair.publicKey }).rpc()

    const currentCount = await program.account.blog.fetch(blogKeypair.publicKey)

    expect(currentCount.count).toEqual(1)
  })

  it('Increment Blog Again', async () => {
    await program.methods.increment().accounts({ blog: blogKeypair.publicKey }).rpc()

    const currentCount = await program.account.blog.fetch(blogKeypair.publicKey)

    expect(currentCount.count).toEqual(2)
  })

  it('Decrement Blog', async () => {
    await program.methods.decrement().accounts({ blog: blogKeypair.publicKey }).rpc()

    const currentCount = await program.account.blog.fetch(blogKeypair.publicKey)

    expect(currentCount.count).toEqual(1)
  })

  it('Set blog value', async () => {
    await program.methods.set(42).accounts({ blog: blogKeypair.publicKey }).rpc()

    const currentCount = await program.account.blog.fetch(blogKeypair.publicKey)

    expect(currentCount.count).toEqual(42)
  })

  it('Set close the blog account', async () => {
    await program.methods
      .close()
      .accounts({
        payer: payer.publicKey,
        blog: blogKeypair.publicKey,
      })
      .rpc()

    // The account should no longer exist, returning null.
    const userAccount = await program.account.blog.fetchNullable(blogKeypair.publicKey)
    expect(userAccount).toBeNull()
  })
})
