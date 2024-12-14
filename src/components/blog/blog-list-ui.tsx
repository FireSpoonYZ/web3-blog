'use client'

import { PublicKey } from '@solana/web3.js'
import { useBlogProgram, useBlogProgramAccount } from './blog-data-access'
import { useWallet } from '@solana/wallet-adapter-react'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'

export function BlogList() {
  const { accounts, getProgramAccount } = useBlogProgram()

  if (getProgramAccount.isLoading) {
    return <span className="loading loading-spinner loading-lg"></span>
  }

  if (!getProgramAccount.data?.value) {
    return (
      <div className="alert alert-info flex justify-center">
        <span>Program account not found. Make sure you have deployed the program and are on the correct cluster.</span>
      </div>
    )
  }
  return (
    <div className={'space-y-6'}>
      {accounts.isLoading ? (
        <span className="loading loading-spinner loading-lg"></span>
      ) : accounts.data?.length ? (
        <div className="space-y-4">
          {accounts.data?.map((account) => (
            <BlogCard key={account.publicKey.toString()} account={account.publicKey} />
          ))}
        </div>
      ) : (
        <div className="text-center">
          <h2 className={'text-2xl'}>No accounts</h2>
          No accounts found. Create one above to get started.
        </div>
      )}
    </div>
  )
}

function BlogCard({ account }: { account: PublicKey }) {
  const { accountQuery, deleteBlog } = useBlogProgramAccount({
    account,
  })
  const router = useRouter()
  const { publicKey } = useWallet()
  const { getProgramAccount } = useBlogProgram()

  const handleUpdateClick = () => {
    router.push(`/blog-update?account=${account.toString()}`)
  }

  const handleDeleteClick = async () => {
    if (!window.confirm("Are you sure you want to close this account?")) {
      return
    }
    const id = accountQuery.data?.id
    if (id) {
      await deleteBlog.mutateAsync(id)
      getProgramAccount.refetch()
    }
  }

  const truncateContent = (content: string, maxLength: number) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength - 3) + '...';
  };

  if (!publicKey) {
    return <p>Connect your wallet</p>
  }

  return accountQuery.isLoading ? (
    <span className="loading loading-spinner loading-lg"></span>
  ) : (
    <div className="card card-bordered border-base-300 border-4 text-neutral-content w-full p-6 shadow-lg rounded-lg">
      <div className="card-body">
        <h2 className="card-title text-3xl mb-4 font-bold">
          {accountQuery.data?.title}
        </h2>
        <div className="text-left mb-4 text-gray-700 line-clamp-3 overflow-hidden">
          <ReactMarkdown>
            {truncateContent(accountQuery.data?.content.join("") ?? "", 100)}
          </ReactMarkdown>
        </div>
        <div className="flex justify-between items-center mb-4">
          <button
            className="btn btn-xs btn-secondary btn-outline"
            onClick={handleDeleteClick}
            disabled={deleteBlog.isPending}
          >
            Delete
          </button>
          <button onClick={handleUpdateClick} className="btn btn-primary">
            Update Blog
          </button>
        </div>
      </div>
    </div>
  )
}
