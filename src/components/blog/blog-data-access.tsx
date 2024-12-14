'use client'

import { getBlogProgram, getBlogProgramId } from '@project/anchor'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { Cluster, Keypair, PublicKey } from '@solana/web3.js'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import toast from 'react-hot-toast'
import { useCluster } from '../cluster/cluster-data-access'
import { useAnchorProvider } from '../solana/solana-provider'
import { useTransactionToast } from '../ui/ui-layout'
import BN from 'bn.js'

interface CreateBlogArgs {
  id: string;
  title: string;
  content: string;
}

const chunkSize = 500;

function chunk(str: string, chunkSize: number): string[] {
  const chunks = [];
  for (let i = 0; i < str.length; i += chunkSize) {
    chunks.push(str.substring(i, i + chunkSize));
  }
  return chunks;
}

export function useBlogProgram() {
  const { connection } = useConnection()
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const provider = useAnchorProvider()
  const { publicKey } = useWallet()
  const programId = useMemo(() => getBlogProgramId(cluster.network as Cluster), [cluster])
  const program = useMemo(() => getBlogProgram(provider, programId), [provider, programId])

  const accounts = useQuery({
    queryKey: ['blog', 'all', { cluster, publicKey }],
    queryFn: () => {
      if (!publicKey) {
        throw new Error('Wallet not connected');
      }
      const filter = [
        {
          memcmp: {
            offset: 8,
            bytes: publicKey.toBase58(),
          },
        },
      ]
      return program.account.blog.all(filter);
    },
  })

  const getProgramAccount = useQuery({
    queryKey: ['get-program-account', { cluster }],
    queryFn: () => connection.getParsedAccountInfo(programId),
  })

  const createBlog = useMutation<string[], Error, CreateBlogArgs>({
    mutationKey: [`blog`, `create`, { cluster }],
    mutationFn: async ({ id, title, content }) => {
      let signatures = []
      const chunks = chunk(content, chunkSize);
      signatures.push(
        await program.methods.create(id, title, chunks[0]).rpc()
      );
      for (let i = 1; i < chunks.length; i++) {
        signatures.push(
          await program.methods.update(id, title, chunks[i], new BN(i)).rpc()
        );
      }
      return signatures;
    },
    onSuccess: (signatures) => {
      transactionToast(signatures);
      accounts.refetch();
    },
    onError: (error) => {
      toast.error(`Error creating blog: ${error.message}`);
    }
  })

  return {
    program,
    programId,
    accounts,
    getProgramAccount,
    createBlog
  }
}

export function useBlogProgramAccount({ account }: { account: PublicKey }) {
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const { program, accounts } = useBlogProgram()

  const accountQuery = useQuery({
    queryKey: ['blog', 'fetch', { cluster, account }],
    queryFn: () => program.account.blog.fetch(account),
  })

  const updateBlog = useMutation<string[], Error, CreateBlogArgs>({
    mutationKey: [`blog`, `update`, { cluster }],
    mutationFn: async ({ id, title, content }) => {
      let signatures = []
      const chunks = chunk(content, chunkSize);

      console.log(`chunks: ${chunks}`)
      console.log(`chunks_length: ${chunks.length}`)

      for (let i = 0; i < chunks.length; i++) {
        signatures.push(
          await program.methods.update(id, title, chunks[i], new BN(i)).rpc()
        );
        console.log(`update: ${i}: ${chunks[i]}`)
      }
      return signatures
    },
    onSuccess: (signatures) => {
      transactionToast(signatures);
      accounts.refetch();
    },
    onError: (error) => {
      toast.error(`Error updating blog: ${error.message}`);
    }
  })

  const deleteBlog = useMutation<string, Error, string>({
    mutationKey: [`blog`, `delete`, { cluster }],
    mutationFn: async (id) => {
      return program.methods.delete(id).rpc();
    },
    onSuccess: (signature) => {
      transactionToast(signature);
      accounts.refetch();
    },
    onError: (error) => {
      toast.error(`Error deleting blog: ${error.message}`)
    }
  })

  return {
    accountQuery,
    updateBlog,
    deleteBlog,
  }
}
