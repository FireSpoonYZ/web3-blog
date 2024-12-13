#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;

declare_id!("59Zq8Bdg2wviDFyYCprbAWX93u1kbAPjKcWTeLzayzCY");

#[program]
pub mod blog {
    use super::*;

    pub fn create(
        ctx: Context<CreateBlog>,
        id: String,
        title: String,
        content: String,
    ) -> Result<()> {
        msg!("Blog created.");
        msg!("id: {}", id);
        msg!("title: {}", title);
        msg!("content: {}", content);

        let blog = &mut ctx.accounts.blog;
        blog.id = id;
        blog.title = title;
        blog.content = content;
        Ok(())
    }

    pub fn update(
        ctx: Context<UpdateBlog>,
        id: String,
        title: String,
        content: String,
    ) -> Result<()> {
        msg!("Blog updated.");
        msg!("id: {}", id);
        msg!("title: {}", title);
        msg!("content: {}", content);

        let blog = &mut ctx.accounts.blog;
        blog.title = title;
        blog.content = content;
        Ok(())
    }

    pub fn delete(
        _ctx: Context<DeleteBlog>,
        id: String,
    ) -> Result<()> {
        msg!("Blog deleted.");
        msg!("id: {}", id);

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
        seeds = [b"firespoon_blog", signer.key().as_ref(), id.as_bytes()],
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
        seeds = [b"firespoon_blog", signer.key().as_ref(), id.as_bytes()],
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
        seeds = [b"firespoon_blog", signer.key().as_ref(), id.as_bytes()],
        bump,
        close = signer,
    )]
    pub blog: Account<'info, Blog>,
    pub system_program: Program<'info, System>,
}


#[account]
#[derive(InitSpace)]
pub struct Blog {
    #[max_len(32)]
    id: String,
    #[max_len(50)]
    title: String,
    #[max_len(2000)]
    content: String,
}
