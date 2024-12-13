'use client'

import { Keypair, Message, PublicKey } from '@solana/web3.js'
import { useEffect, useMemo, useState } from 'react'
import { ellipsify } from '../ui/ui-layout'
import { ExplorerLink } from '../cluster/cluster-ui'
import { useBlogProgram, useBlogProgramAccount } from './blog-data-access'
import { useWallet } from '@solana/wallet-adapter-react'
import * as uuid from 'uuid'

export function BlogCreate() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  const { publicKey } = useWallet()
  const { createBlog } = useBlogProgram()

  const isFormValid = title.trim() != '' && content.trim() != '';

  const handleSubmit = () => {
    if (publicKey && isFormValid) {
      createBlog.mutateAsync({ title, content, id: uuid.v4().replace(/-/g, '') })
    }
  }

  if (!publicKey) {
    return <p>Connect Your wallet.</p>
  }

  return (
    <div>
      <p>
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input input-bordered w-full max-w-xs"
        />
      </p>
      <p>
        <textarea
          placeholder="Content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="textarea textarea-bordered w-full max-w-xs"
        />
        <br></br>
        <button
          className="btn btn-xs lg:btn-md btn-primary"
          onClick={handleSubmit}
          disabled={createBlog.isPending || !isFormValid}
        >
          Create Blog {createBlog.isPending && "..."}
        </button>
      </p>
    </div>
  );
}

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
        <div className="grid md:grid-cols-2 gap-4">
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
  const { accountQuery, updateBlog, deleteBlog } = useBlogProgramAccount({
    account,
  })

  const { publicKey } = useWallet();
  const id = accountQuery.data?.id;
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");

  useEffect(() => {
    if (accountQuery.data) {
      setContent(accountQuery.data.content ?? "");
      setTitle(accountQuery.data.title ?? "");
    }
  }, [accountQuery.data]); // 只有在accountQuery.data更新时才会执行

  const isFormValid = title.trim() != '' && content.trim() != '';

  const handleSubmit = () => {
    if (publicKey && isFormValid && id) {
      updateBlog.mutateAsync({ id, title, content });
    }
  };

  if (!publicKey) {
    return <p>Connect your wallet</p>;
  }



  return accountQuery.isLoading ? (
    <span className="loading loading-spinner loading-lg"></span>
  ) : (
    <div className="card card-bordered border-base-300 border-4 text-neutral-content">
      <div className="card-body items-center text-center">
        <div className="space-y-6">
          <h2
            className="card-title justify-center text-3xl cursor-pointer"
            onClick={() => accountQuery.refetch()}
          >
            <input
              placeholder="Update content here"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="textarea textarea-bordered w-full max-w-xs"
            />
          </h2>
          <div className="card-actions justify-around">
            <textarea
              placeholder="Update content here"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="textarea textarea-bordered w-full max-w-xs"
            />
            <button
              className="btn btn-xs lg:btn-md btn-primary"
              onClick={() => {
                handleSubmit()
                accountQuery.refetch()
              }}
              disabled={updateBlog.isPending || !isFormValid}
            >
              Update Blog {updateBlog.isPending && "..."}
            </button>
          </div>
          <div className="text-center space-y-4">
            <p>
              <ExplorerLink
                path={`account/${account}`}
                label={ellipsify(account.toString())}
              />
            </p>
            <button
              className="btn btn-xs btn-secondary btn-outline"
              onClick={() => {
                if (
                  !window.confirm(
                    "Are you sure you want to close this account?"
                  )
                ) {
                  return;
                }
                const id = accountQuery.data?.id;
                if (id) {
                  return deleteBlog.mutateAsync(id);
                }
              }}
              disabled={deleteBlog.isPending}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
