// Here we export some useful types and functions for interacting with the Anchor program.
import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { Cluster, PublicKey } from '@solana/web3.js'
import BlogIDL from '../target/idl/blog.json'
import type { Blog } from '../target/types/blog'

// Re-export the generated IDL and type
export { Blog, BlogIDL }

// The programId is imported from the program IDL.
export const BLOG_PROGRAM_ID = new PublicKey(BlogIDL.address)

// This is a helper function to get the Blog Anchor program.
export function getBlogProgram(provider: AnchorProvider, address?: PublicKey) {
  return new Program({ ...BlogIDL, address: address ? address.toBase58() : BlogIDL.address } as Blog, provider)
}

// This is a helper function to get the program ID for the Blog program depending on the cluster.
export function getBlogProgramId(cluster: Cluster) {
  switch (cluster) {
    case 'devnet':
    case 'testnet':
      // This is the program ID for the Blog program on devnet and testnet.
      return new PublicKey('59Zq8Bdg2wviDFyYCprbAWX93u1kbAPjKcWTeLzayzCY')
    case 'mainnet-beta':
    default:
      return BLOG_PROGRAM_ID
  }
}
