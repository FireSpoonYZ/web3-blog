#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;

declare_id!("coUnmi3oBUtwtd9fjeAvSsJssXh5A5xyPbhpewyzRVF");

#[program]
pub mod blog {
    use super::*;

  pub fn close(_ctx: Context<CloseBlog>) -> Result<()> {
    Ok(())
  }

  pub fn decrement(ctx: Context<Update>) -> Result<()> {
    ctx.accounts.blog.count = ctx.accounts.blog.count.checked_sub(1).unwrap();
    Ok(())
  }

  pub fn increment(ctx: Context<Update>) -> Result<()> {
    ctx.accounts.blog.count = ctx.accounts.blog.count.checked_add(1).unwrap();
    Ok(())
  }

  pub fn initialize(_ctx: Context<InitializeBlog>) -> Result<()> {
    Ok(())
  }

  pub fn set(ctx: Context<Update>, value: u8) -> Result<()> {
    ctx.accounts.blog.count = value.clone();
    Ok(())
  }
}

#[derive(Accounts)]
pub struct InitializeBlog<'info> {
  #[account(mut)]
  pub payer: Signer<'info>,

  #[account(
  init,
  space = 8 + Blog::INIT_SPACE,
  payer = payer
  )]
  pub blog: Account<'info, Blog>,
  pub system_program: Program<'info, System>,
}
#[derive(Accounts)]
pub struct CloseBlog<'info> {
  #[account(mut)]
  pub payer: Signer<'info>,

  #[account(
  mut,
  close = payer, // close account and return lamports to payer
  )]
  pub blog: Account<'info, Blog>,
}

#[derive(Accounts)]
pub struct Update<'info> {
  #[account(mut)]
  pub blog: Account<'info, Blog>,
}

#[account]
#[derive(InitSpace)]
pub struct Blog {
  count: u8,
}
