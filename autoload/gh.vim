function! gh#def_highlight() abort
  hi! gh_blue ctermfg=110 guifg=#84a0c6
  hi! gh_green ctermfg=150 guifg=#b4be82
  hi! gh_orange ctermfg=216 guifg=#e2a478
  hi! gh_red cterm=bold ctermfg=203
  hi! link gh_purple Constant

  hi! link gh_issue_number gh_blue
  hi! link gh_issue_open gh_green
  hi! link gh_issue_closed gh_red
  hi! link gh_issue_user gh_purple
  hi! link gh_issue_labels gh_orange

  hi! link gh_issue_comment_user gh_purple
  hi! link gh_issue_comment_number gh_blue

  hi! link gh_pull_number gh_blue
  hi! link gh_pull_open gh_green
  hi! link gh_pull_closed gh_red
  hi! link gh_pull_user gh_purple
  hi! link gh_pull_labels gh_orange
endfunction

function! gh#_action(type) abort
  if a:type ==# "issues:edit"
    if empty(b:gh_action_ctx.args)
      echoerr("b:gh_action_ctx.args is empty")
      return
    endif
    let issue = b:gh_action_ctx.args[line(".")-1]
    let schema = b:gh_action_ctx.schema
    execute(printf("new gh://%s/%s/issues/%d", schema.owner, schema.repo, issue.number))
  elseif a:type ==# "issues:update"
    call denops#notify("gh", "doAction", [])
  endif
endfunction
