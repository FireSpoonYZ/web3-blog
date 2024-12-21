#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;

declare_id!("AF2tVrJGVjLn87v1d4x1frrCSNbBRKumonhmvgjM2T3f");

#[program]
pub mod blog {
    use super::*;

    pub fn create_blog(
        ctx: Context<CreateBlog>,
        id: String,
        title: String,
        content: String,
    ) -> Result<()> {
        msg!("Blog chunk created.");
        msg!("id: {}", id);
        msg!("title: {}", title);
        msg!("content: {}", content);

        let blog = &mut ctx.accounts.blog;
        blog.owner = *ctx.accounts.signer.key;
        blog.id = id;
        blog.title = title;
        blog.content = vec![String::new(); 20];
        blog.content[0] = content;
        Ok(())
    }

    pub fn update_blog(
        ctx: Context<UpdateBlog>,
        id: String,
        title: String,
        content: String,
        idx: u64,
    ) -> Result<()> {
        msg!("Blog updated.");
        msg!("id: {}", id);
        msg!("title: {}", title);
        msg!("content: {}", content);

        let blog = &mut ctx.accounts.blog;
        blog.title = title;
        blog.content[idx as usize] = content;
        Ok(())
    }

    pub fn delete_blog(
        _ctx: Context<DeleteBlog>,
        id: String,
    ) -> Result<()> {
        msg!("Blog deleted.");
        msg!("id: {}", id);

        Ok(())
    }

    pub fn create_comment(
        ctx: Context<CreateComment>,
        id: String,
        blog_id: String,
        content: String,
    ) -> Result<()> {
        msg!("Comment created.");
        msg!("id: {}", id);
        msg!("blog_id: {}", blog_id);
        msg!("content: {}", content);

        let comment = &mut ctx.accounts.comment;
        comment.owner = *ctx.accounts.signer.key;
        comment.id = id;
        comment.blog_id = blog_id;
        comment.content = content;
        Ok(())
    }

    pub fn update_comment(
        ctx: Context<UpdateComment>,
        id: String,
        content: String,
    ) -> Result<()> {
        msg!("Comment updated.");
        msg!("id: {}", id);
        msg!("content: {}", content);

        let comment = &mut ctx.accounts.comment;
        comment.content = content;
        Ok(())
    }

    pub fn delete_comment(
        _ctx: Context<DeleteComment>,
        id: String,
    ) -> Result<()> {
        msg!("Comment deleted.");
        msg!("id: {}", id);

        Ok(())
    }

    pub fn create_author_info(
        ctx: Context<CreateAuthorInfo>,
        intro: String,
    ) -> Result<()> {
        msg!("Author info created.");
        msg!("intro: {}", intro);

        let author_info = &mut ctx.accounts.author_info;
        author_info.owner = *ctx.accounts.signer.key;
        author_info.intro = intro;
        Ok(())
    }

    pub fn update_author_info(
        ctx: Context<UpdateAuthorInfo>,
        intro: String,
    ) -> Result<()> {
        msg!("Author info updated.");
        msg!("intro: {}", intro);

        let author_info = &mut ctx.accounts.author_info;
        author_info.intro = intro;
        Ok(())
    }

    pub fn delete_author_info(
        _ctx: Context<DeleteAuthorInfo>,
    ) -> Result<()> {
        msg!("Author info deleted.");

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(id: String, title: String, content: String)]
pub struct CreateBlog<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        init,
        space = 8 + Blog::INIT_SPACE,
        payer = signer,
        seeds = [b"blog", signer.key().as_ref(), id.as_bytes()],
        bump
    )]
    pub blog: Account<'info, Blog>,
    pub system_program: Program<'info, System>,
}


#[derive(Accounts)]
#[instruction(id: String, title: String, content: String)]
pub struct UpdateBlog<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        mut,
        realloc = 8 + Blog::INIT_SPACE,
        realloc::payer = signer, 
        realloc::zero = true,
        seeds = [b"blog", signer.key().as_ref(), id.as_bytes()],
        bump
    )]
    pub blog: Account<'info, Blog>,
    pub system_program: Program<'info, System>,
}


#[derive(Accounts)]
#[instruction(id: String)]
pub struct DeleteBlog<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account( 
        mut,
        seeds = [b"blog", signer.key().as_ref(), id.as_bytes()],
        bump,
        close = signer,
    )]
    pub blog: Account<'info, Blog>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(id: String, blog_id: String, content: String)]
pub struct CreateComment<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        init,
        space = 8 + Comment::INIT_SPACE,
        payer = signer,
        seeds = [b"comment", signer.key().as_ref(), id.as_bytes()],
        bump
    )]
    pub comment: Account<'info, Comment>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(id: String, content: String)]
pub struct UpdateComment<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        mut,
        realloc = 8 + Comment::INIT_SPACE,
        realloc::payer = signer, 
        realloc::zero = true,
        seeds = [b"comment", signer.key().as_ref(), id.as_bytes()],
        bump
    )]
    pub comment: Account<'info, Comment>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(id: String)]
pub struct DeleteComment<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account( 
        mut,
        seeds = [b"comment", signer.key().as_ref(), id.as_bytes()],
        bump,
        close = signer,
    )]
    pub comment: Account<'info, Comment>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateAuthorInfo<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        init,
        space = 8 + AuthorInfo::INIT_SPACE,
        payer = signer,
        seeds = [b"author_info", signer.key().as_ref()],
        bump
    )]
    pub author_info: Account<'info, AuthorInfo>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateAuthorInfo<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        mut,
        realloc = 8 + AuthorInfo::INIT_SPACE,
        realloc::payer = signer, 
        realloc::zero = true,
        seeds = [b"author_info", signer.key().as_ref()],
        bump
    )]
    pub author_info: Account<'info, AuthorInfo>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DeleteAuthorInfo<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account( 
        mut,
        seeds = [b"author_info", signer.key().as_ref()],
        bump,
        close = signer,
    )]
    pub author_info: Account<'info, AuthorInfo>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct Blog {
    owner: Pubkey,
    #[max_len(32)]
    id: String,
    #[max_len(50)]
    title: String,
    #[max_len(20, 500)]
    content: Vec<String>, 
}


#[account]
#[derive(InitSpace)]
pub struct Comment {
    owner: Pubkey,
    #[max_len(32)]
    id: String,
    #[max_len(32)]
    blog_id: String,
    #[max_len(500)]
    content: String,
}

#[account]
#[derive(InitSpace)]
pub struct AuthorInfo {
    owner: Pubkey,
    #[max_len(500)]
    intro: String,
}
