'use client'

import { getBlogProgram, getBlogProgramId } from '@project/anchor'
import { useConnection } from '@solana/wallet-adapter-react'
import { Cluster, Keypair, PublicKey } from '@solana/web3.js'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import toast from 'react-hot-toast'
import { useCluster } from '../cluster/cluster-data-access'
import { useAnchorProvider } from '../solana/solana-provider'
import { useTransactionToast } from '../ui/ui-layout'

interface CreateBlogArgs {
  id: string;
  title: string;
  content: string;
}

export function useBlogProgram() {
  const { connection } = useConnection()
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const provider = useAnchorProvider()
  const programId = useMemo(() => getBlogProgramId(cluster.network as Cluster), [cluster])
  const program = useMemo(() => getBlogProgram(provider, programId), [provider, programId])

  const accounts = useQuery({
    queryKey: ['blog', 'all', { cluster }],
    queryFn: () => program.account.blog.all(),
  })

  const getProgramAccount = useQuery({
    queryKey: ['get-program-account', { cluster }],
    queryFn: () => connection.getParsedAccountInfo(programId),
  })

  const createBlog = useMutation<string, Error, CreateBlogArgs>({
    mutationKey: [`blog`, `create`, {cluster} ],
    mutationFn: async ({id, title, content}) => {
      return program.methods.create(id, title, content).rpc();
    },
    onSuccess: (signature) => {
      transactionToast(signature);
      accounts.refetch();
    },
    onError: (error) => {
      toast.error(`Error creating blog: ${error.message}`)
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

  const updateBlog = useMutation<string, Error, CreateBlogArgs>({
    mutationKey: [`blog`, `update`, {cluster} ],
    mutationFn: async ({id, title, content}) => {
      return program.methods.update(id, title, content).rpc();
    },
    onSuccess: (signature) => {
      transactionToast(signature);
      accounts.refetch();
    },
    onError: (error) => {
      toast.error(`Error updating blog: ${error.message}`)
    }
  })

  const deleteBlog = useMutation<string, Error, string>({
    mutationKey: [`blog`, `delete`, {cluster} ],
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
