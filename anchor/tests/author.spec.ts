import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { PublicKey } from '@solana/web3.js'
import { Blog } from '../target/types/blog'

const programId = new PublicKey("AF2tVrJGVjLn87v1d4x1frrCSNbBRKumonhmvgjM2T3f")

async function aensure_error_occurs<T>(fn: Promise<T>): Promise<void> {
  try {
    await fn;
  } catch (e) {
    return;
  }
  throw new Error("No error occured, which is needed");
}

class MyAuthor {
  public provider: anchor.AnchorProvider;
  public payer: anchor.Wallet;
  public program: Program<Blog>;

  constructor() {
    this.provider = anchor.AnchorProvider.env()
    anchor.setProvider(this.provider)
    this.payer = this.provider.wallet as anchor.Wallet
    this.program = anchor.workspace.Blog as Program<Blog>
  }

  async createAuthorInfo(intro: string) {
    await this.program.methods
      .createAuthorInfo(intro)
      .accounts({ signer: this.payer.publicKey })
      .rpc();
  }

  async updateAuthorInfo(intro: string) {
    await this.program.methods
      .updateAuthorInfo(intro)
      .accounts({ signer: this.payer.publicKey })
      .rpc();
  }

  async deleteAuthorInfo() {
    await this.program.methods
      .deleteAuthorInfo()
      .accounts({ signer: this.payer.publicKey })
      .rpc();
  }

  async fetchAuthorInfo(signer: PublicKey = this.payer.publicKey) {
    const [author_info_address] = PublicKey.findProgramAddressSync(
      [
        new TextEncoder().encode("author_info"),
        signer.toBuffer(),
      ],
      programId
    )
    return await this.program.account.authorInfo.fetch(author_info_address);
  }
}

describe('author', () => {
  const myAuthor = new MyAuthor()

  it('Create Author Info', async () => {
    const intro = "Here's an introduction"

    await myAuthor.createAuthorInfo(intro)
    const authorInfo = await myAuthor.fetchAuthorInfo()

    console.log("Create Author Info: created author info: {}", authorInfo)

    expect(authorInfo.intro).toEqual(intro)
  })

  it('Update Author Info', async () => {
    const intro = "Here's an introduction"

    await myAuthor.createAuthorInfo(intro)
    const originalAuthorInfo = await myAuthor.fetchAuthorInfo()

    console.log("Update Author Info: created author info: {}", originalAuthorInfo)

    const new_intro = "Here's an updated introduction"

    await myAuthor.updateAuthorInfo(new_intro)
    const updatedAuthorInfo = await myAuthor.fetchAuthorInfo()

    console.log("Update Author Info: updated author info: {}", updatedAuthorInfo)

    expect(updatedAuthorInfo.intro).toEqual(new_intro)
  })

  it('Delete Author Info', async () => {
    const intro = "Here's an introduction"

    await myAuthor.createAuthorInfo(intro)
    const authorInfo = await myAuthor.fetchAuthorInfo()

    console.log("Delete Author Info: created author info: {}", authorInfo)

    await myAuthor.deleteAuthorInfo()

    console.log("Delete Author Info: deleted the author info")

    await aensure_error_occurs(
      myAuthor.fetchAuthorInfo()
    )

    console.log("Cannot visit the author info again.")
  })
})
