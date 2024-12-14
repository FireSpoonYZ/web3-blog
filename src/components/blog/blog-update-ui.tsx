'use client'

import { useEffect, useState } from 'react'
import { useBlogProgram, useBlogProgramAccount } from './blog-data-access'
import { useWallet } from '@solana/wallet-adapter-react'
import * as uuid from 'uuid'
import { PublicKey } from '@solana/web3.js'
import { useRouter, useSearchParams } from 'next/navigation'
import MDEditor from '@uiw/react-md-editor';

export function BlogUpdate() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const account_s = searchParams.get("account")
  const account = account_s ? new PublicKey(account_s) : undefined

  const { accountQuery, updateBlog } = account
    ? useBlogProgramAccount({ account })
    : { accountQuery: undefined, updateBlog: undefined }

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  const { publicKey } = useWallet()
  const { createBlog } = useBlogProgram()

  const isFormValid = title.trim() != '' && content.trim() != '';

  if (account) {
    const { accountQuery } = useBlogProgramAccount({ account })
    useEffect(() => {
      if (accountQuery.data) {
        setContent(accountQuery.data.content.join("") ?? "");
        setTitle(accountQuery.data.title ?? "");
      }
    }, [accountQuery.data]); // 只有在accountQuery.data更新时才会执行
  }

  const handleSubmit = async () => {
    if (publicKey && isFormValid) {
      if (account) {
        await updateBlog!.mutateAsync({ title, content, id: accountQuery!.data!.id });
      } else {
        await createBlog.mutateAsync({ title, content, id: uuid.v4().replace(/-/g, '') });
        router.push(`/blog-list`)
      }
    }
  }

  if (!publicKey) {
    return <p>Connect Your wallet.</p>
  }

  return (
    <div className="container mx-auto p-4 min-h-screen">
      <div className="mb-4 sticky top-0 bg-white z-10">
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input input-bordered w-full"
        />
      </div>
      <div className="mb-4">
        <MDEditor
          value={content}
          onChange={(value) => setContent(value ?? '')}
          height={500}
          className="textarea textarea-bordered w-full h-screen"
        />
      </div>
      <div className="text-right">
        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={createBlog.isPending || !isFormValid}
        >
          {account ? 'Update Blog' : 'Create Blog'} {createBlog.isPending && "..."}
        </button>
      </div>
    </div>
  ); 
}
