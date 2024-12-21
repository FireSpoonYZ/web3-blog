import * as anchor from '@coral-xyz/anchor'
import * as uuid from "uuid";
import { Program } from '@coral-xyz/anchor'
import { PublicKey, Keypair } from '@solana/web3.js'
import { Blog } from '../target/types/blog'
import { BN } from 'bn.js';

const programId = new PublicKey("AF2tVrJGVjLn87v1d4x1frrCSNbBRKumonhmvgjM2T3f")

async function aensure_error_occurs<T>(fn: Promise<T>): Promise<void> {
  try {
    await fn;
  } catch (e) {
    return;
  }
  throw new Error("No error occured, which is needed");
}

class MyComment {
  public provider: anchor.AnchorProvider;
  public payer: anchor.Wallet;
  public program: Program<Blog>;

  constructor() {
    this.provider = anchor.AnchorProvider.env()
    anchor.setProvider(this.provider)
    this.payer = this.provider.wallet as anchor.Wallet
    this.program = anchor.workspace.Blog as Program<Blog>
  }

  async createComment(id: string, blog_id: string, content: string) {
    await this.program.methods
      .createComment(id, blog_id, content)
      .accounts({ signer: this.payer.publicKey })
      .rpc();
  }

  async updateComment(id: string, content: string) {
    await this.program.methods
      .updateComment(id, content)
      .accounts({ signer: this.payer.publicKey })
      .rpc();
  }

  async deleteComment(id: string) {
    await this.program.methods
      .deleteComment(id)
      .accounts({ signer: this.payer.publicKey })
      .rpc();
  }

  async fetchComment(id: string, signer: PublicKey = this.payer.publicKey) {
    const [comment_address] = PublicKey.findProgramAddressSync(
      [
        new TextEncoder().encode("comment"),
        signer.toBuffer(),
        new TextEncoder().encode(id),
      ],
      programId
    )
    return await this.program.account.comment.fetch(comment_address);
  }
}

describe('comment', () => {
  const myComment = new MyComment()

  it('Create Comment', async () => {
    const id = uuid.v4().replace(/-/g, '')
    const blog_id = uuid.v4().replace(/-/g, '')
    const content = "Here's a comment"

    await myComment.createComment(id, blog_id, content)
    const comment = await myComment.fetchComment(id)

    console.log("Create Comment: created a comment: {}", comment)

    expect(comment.content).toEqual(content)
  })

  it('Update Comment', async () => {
    const id = uuid.v4().replace(/-/g, '')
    const blog_id = uuid.v4().replace(/-/g, '')
    const content = "Here's a comment"

    await myComment.createComment(id, blog_id, content)
    const originalComment = await myComment.fetchComment(id)

    console.log("Update Comment: created a comment: {}", originalComment)

    const new_content = "Here's an updated comment"

    await myComment.updateComment(id, new_content)
    const updatedComment = await myComment.fetchComment(id)

    console.log("Update Comment: updated comment: {}", updatedComment)

    expect(updatedComment.content).toEqual(new_content)
  })

  it('Delete Comment', async () => {
    const id = uuid.v4().replace(/-/g, '')
    const blog_id = uuid.v4().replace(/-/g, '')
    const content = "Here's a comment"

    await myComment.createComment(id, blog_id, content)
    const comment = await myComment.fetchComment(id)

    console.log("Delete Comment: created a comment: {}", comment)

    await myComment.deleteComment(id)

    console.log("Delete Comment: deleted the comment")

    await aensure_error_occurs(
      myComment.fetchComment(id)
    )

    console.log("Cannot visit the comment again.")
  })
})
