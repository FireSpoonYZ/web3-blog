import * as anchor from '@coral-xyz/anchor'
import * as uuid from "uuid";
import { Program } from '@coral-xyz/anchor'
import { PublicKey, Keypair, Connection } from '@solana/web3.js'
import { Blog } from '../target/types/blog'
import { BN } from 'bn.js';

const programId = new PublicKey("AF2tVrJGVjLn87v1d4x1frrCSNbBRKumonhmvgjM2T3f")

const chunkSize = 500;

async function aensure_error_occurs<T>(fn: Promise<T>): Promise<void> {
  try {
    await fn;
  } catch (e) {
    return;
  }
  throw new Error("No error occured, which is needed");
}

function chunk(str: string, chunkSize: number): string[] {
  const chunks = [];
  for (let i = 0; i < str.length; i += chunkSize) {
    chunks.push(str.substring(i, i + chunkSize));
  }
  return chunks;
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

  async updateInner(id: string, title: string, content: string, idx: number) {
    await this.program.methods
      .updateBlog(id, title, content, new BN(idx))
      .accounts({ signer: this.payer.publicKey })
      .rpc();
  }

  async createBlog(id: string, title: string, content: string) {
    const chunks = chunk(content, chunkSize)

    await this.program.methods
      .createBlog(id, title, chunks[0])
      .accounts({ signer: this.payer.publicKey })
      .rpc();

    for (let i = 1; i < chunks.length; i++) {
      await this.updateInner(id, title, chunks[i], i)
    }
  }

  async updateBlog(id: string, title: string, content: string) {
    const chunks = chunk(content, chunkSize)

    for (let i = 0; i < chunks.length; i++) {
      await this.updateInner(id, title, chunks[i], i)
    }
  }

  async deleteBlog(id: string) {
    await this.program.methods
      .deleteBlog(id)
      .accounts({ signer: this.payer.publicKey })
      .rpc();
  }

  async fetchBlog(id: string, signer: PublicKey = this.payer.publicKey) {
    const [blog_address] = PublicKey.findProgramAddressSync(
      [
        new TextEncoder().encode("blog"),
        signer.toBuffer(),
        new TextEncoder().encode(id),
      ],
      programId
    )
    let blog = await this.program.account.blog.fetch(blog_address);
    let content = []

    for (let i = 0; i < blog.content.length; i++) {
      if (blog.content[i] == "") {
        break
      }
      content.push(blog.content[i])
    }
    blog.content = content
    return blog
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
    expect(blog.content.join("")).toEqual(content)

    const blogKeypair = Keypair.generate()
    await aensure_error_occurs(
      myBlog.fetchBlog(id, blogKeypair.publicKey)
    )
  })

  it('Update Blog', async () => {
    const id = uuid.v4().replace(/-/g, '')
    const title = "Here's original title";
    const content = "Here's original content"; // This will be split into multiple chunks

    await myBlog.createBlog(id, title, content)
    const originalContent = await myBlog.fetchBlog(id)

    console.log("Update Blog: created a blog with content: {}", originalContent)

    const new_title = "Here's new title";
    const new_content = "Here's new content"; // This will be split into multiple chunks

    await myBlog.updateBlog(id, new_title, new_content)
    const updatedContent = await myBlog.fetchBlog(id)

    console.log("Update Blog: updated blog with content: {}", updatedContent)

    expect(updatedContent.title).toEqual(new_title)
    expect(updatedContent.content.join("")).toEqual(new_content)
  })

  it('Delete Blog', async () => {
    const id = uuid.v4().replace(/-/g, '')
    const title = "Here's title";
    const content = "Here's content"; // This will be split into multiple chunks

    await myBlog.createBlog(id, title, content)
    const blog = await myBlog.fetchBlog(id)

    console.log("Delete Blog: created a blog with content: {}", blog)

    await myBlog.deleteBlog(id)

    console.log("Delete Blog: deleted the blog")

    await aensure_error_occurs(
      myBlog.fetchBlog(id)
    )

    console.log("Cannot visit the blog again.")
  })

  it('All Blog', async () => {
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
      const fullContent = await myBlog.fetchBlog(id)

      console.log("All Blog: created a blog with content: {}", fullContent)

      expect(fullContent.title).toEqual(title)
      expect(fullContent.content.join("")).toEqual(content)
    }

    const filter = [
      {
        memcmp: {
          offset: 8,
          bytes: myBlog.payer.publicKey.toBase58(),
        },
      },
    ]
    const allBlogs = await myBlog.program.account.blog.all(filter)
    console.log(allBlogs)
  })

  it('Create Long Blog', async () => {
    const id = uuid.v4().replace(/-/g, '')
    const title = "Here's title";
    const content = "Here's content".repeat(10); // This will be split into multiple chunks

    await myBlog.createBlog(id, title, content)
    const fullContent = await myBlog.fetchBlog(id)

    console.log("Create Long Blog: created a blog with content: {}", fullContent)

    expect(fullContent.title).toEqual(title)
    expect(fullContent.content.join("")).toEqual(content)
  })

  it('Update Long Blog', async () => {
    const id = uuid.v4().replace(/-/g, '')
    const title = "Here's original title";
    const content = "Here's original content".repeat(10); // This will be split into multiple chunks

    await myBlog.createBlog(id, title, content)
    const originalContent = await myBlog.fetchBlog(id)

    console.log("Update Long Blog: created a blog with content: {}", originalContent)

    const new_title = "Here's new title";
    const new_content = "Here's new content".repeat(10); // This will be split into multiple chunks

    await myBlog.updateBlog(id, new_title, new_content)
    const updatedContent = await myBlog.fetchBlog(id)

    console.log("Update Long Blog: updated blog with content: {}", updatedContent)

    expect(updatedContent.title).toEqual(new_title)
    expect(updatedContent.content.join("")).toEqual(new_content)
  })
})
