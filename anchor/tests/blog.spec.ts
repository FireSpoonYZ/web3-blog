import * as anchor from '@coral-xyz/anchor'
import * as uuid from "uuid";
import { Program } from '@coral-xyz/anchor'
import { PublicKey, Keypair, Connection } from '@solana/web3.js'
import { Blog } from '../target/types/blog'

const programId = new PublicKey("59Zq8Bdg2wviDFyYCprbAWX93u1kbAPjKcWTeLzayzCY")

async function aensure_error_occurs<T>(fn: Promise<T>): Promise<void> {
  try {
    await fn;
  } catch (e) {
    // 如果有异常抛出，什么都不做
    return;
  }
  // 如果没有异常抛出，显式抛出一个新的异常
  throw new Error("No error occured, which is needed");
}

class MyBlog {
  public provider: anchor.AnchorProvider;
  public payer: anchor.Wallet;
  public program: Program<Blog>;

  constructor() {
    this.provider = anchor.AnchorProvider.env()
    anchor.setProvider(this.provider)
    this.payer = this.provider.wallet as anchor.Wallet
    this.program = anchor.workspace.Blog as Program<Blog>
  }

  async createBlog(id: string, title: string, content: string) {
    await this.program.methods
      .create(id, title, content)
      .accounts({ signer: this.payer.publicKey })
      .rpc()
  }

  async updateBlog(id: string, title: string, content: string) {
    await this.program.methods
      .update(id, title, content)
      .accounts({ signer: this.payer.publicKey })
      .rpc()
  }

  async deleteBlog(id: string) {
    await this.program.methods
      .delete(id)
      .accounts({ signer: this.payer.publicKey })
      .rpc()
  }

  async fetchBlog(id: string, signer: PublicKey = this.payer.publicKey) {
    const [blog_address] = PublicKey.findProgramAddressSync(
      [
        new TextEncoder().encode("firespoon_blog"),
        signer.toBuffer(),
        new TextEncoder().encode(id),
      ],
      programId
    )

    return await this.program.account.blog.fetch(blog_address)
  }
}

describe('blog', () => {
  const myBlog = new MyBlog()

  it('Create Blog', async () => {
    const id = uuid.v4().replace(/-/g, '')
    const title = "Here's title";
    const content = "Here's content"

    await myBlog.createBlog(id, title, content)
    const blog = await myBlog.fetchBlog(id)

    console.log("Create Blog: created a blog: {}", blog)

    expect(blog.title).toEqual(title)
    expect(blog.content).toEqual(content)

    // ensure any other users cannot get this blog
    const blogKeypair = Keypair.generate()
    await aensure_error_occurs(
      myBlog.fetchBlog(id, blogKeypair.publicKey)
    )
  })


  it('Update Blog', async () => {
    // create a blog first
    const id = uuid.v4().replace(/-/g, '')
    const title = "Here's original title";
    const content = "Here's original content"

    await myBlog.createBlog(id, title, content)
    const blog = await myBlog.fetchBlog(id)

    console.log("Update Blog: created a blog: {}", blog)

    // then update
    const new_title = "Here's new title";
    const new_content = "Here's new content"

    await myBlog.updateBlog(id, new_title, new_content)
    const updatedBlog = await myBlog.fetchBlog(id)

    console.log("Update Blog: new blog: {}", updatedBlog)

    expect(updatedBlog.title).toEqual(new_title)
    expect(updatedBlog.content).toEqual(new_content)
  })


  it('Delete Blog', async () => {
    // create a blog first
    const id = uuid.v4().replace(/-/g, '')
    const title = "Here's title";
    const content = "Here's content"

    await myBlog.createBlog(id, title, content)
    const blog = await myBlog.fetchBlog(id)

    console.log("Delete Blog: created a blog: {}", blog)

    await myBlog.deleteBlog(id)

    console.log("Delete Blog: deleted the blog")

    // ensure cannot delete
    await aensure_error_occurs(
      myBlog.fetchBlog(id)
    )

    console.log("Cannot visit the blog again.")
  })
  it('All Blog', async () => {
    // create 2 blogs first
    const ids = [
      uuid.v4().replace(/-/g, ''),
      uuid.v4().replace(/-/g, ''),
    ]
    const titles = [
      "Here's title",
      "Here's title2",
    ]
    const contents = [
      "Here's content",
      "Here's content2",
    ]

    for (let i = 0; i < 2; i++) {
      const id = ids[i];
      const title = titles[i];
      const content = contents[i];

      await myBlog.createBlog(id, title, content)
      const blog = await myBlog.fetchBlog(id)

      console.log("All Blog: created a blog: {}", blog)
    }

    const all_blogs = await myBlog.program.account.blog.all()
    console.log(all_blogs)
  })
})
