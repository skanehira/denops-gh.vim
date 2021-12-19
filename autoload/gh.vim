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
  let b:gh_action_ctx.schema.actionType = a:type

  if a:type ==# "issues:edit"
    if empty(b:gh_action_ctx.args)
      echoerr("b:gh_action_ctx.args is empty")
      return
    endif
    let issue = b:gh_action_ctx.args[line(".")-1]
    let schema = b:gh_action_ctx.schema
    let opencmd = gh#_chose_action([
          \ {"text": "(e)dit", "value": "edit"},
          \ {"text": "(n)ew", "value": "new"},
          \ {"text": "(v)new", "value": "vnew"},
          \ {"text": "(t)abnew", "value": "tabnew"},
          \ ])
    echo "" | redraw
    if opencmd ==# ""
      return
    endif
    execute(printf("%s gh://%s/%s/issues/%d", opencmd, schema.owner, schema.repo, issue.number))
    return
  endif
  call denops#notify("gh", "doAction", [])
endfunction

function! gh#_message(msg) abort
  echohl Directory
  echo a:msg
  echohl None
endfunction

" returns chosed action
" actions must be object array liek bellow
" [
"   {"text": "(e)dit", value: "edit"}
"   {"text": "(n)ew", value: "new"}
" ]
" NOTE: text must contains '()' to detect input and its must be 1 character
function! gh#_chose_action(actions) abort
  call gh#_message(join(map(copy(a:actions), { _, v -> v.text }), ", ") .. ": ")
  let result = getcharstr()
  let result = filter(a:actions, { _, v -> v.text =~# printf(".*\(%s\).*", result)})
  return len(result) ? result[0].value : ""
endfunction

function! gh#_menu_callback(idx, result) abort
  if has('nvim')
    call nvim_win_close(a:idx, v:true)
    call denops#notify("gh", "menu_callback", [a:result])
  else
    if a:idx ==# -1
      return
    endif
    let text = trim(win_execute(a:idx, "echo getline('.')"))
    call denops#notify("gh", "menu_callback", [text])
  endif
endfunction

function! gh#_nvim_on_exit_terminal(jobid, exit_code, type) abort
  call denops#notify("gh", "on_exit_terminal_" .. a:jobid, [a:exit_code])
endfunction

function! gh#_vim_on_exit_terminal(job, exit_code) abort
  call denops#notify("gh", "on_exit_terminal_" .. bufnr(), [a:exit_code])
endfunction
