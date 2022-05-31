" utils
" Author: skanehira
" License: MIT

let s:clipboard_register = has("linux") || has("unix") ? "+" : "*"
let s:newline = has("win32") ? "\r\n" : "\n"

" arg type can be array or string
function! utils#yank(arg) abort
  if type(a:arg) ==# v:t_list
    call setreg(s:clipboard_register, join(a:arg, s:newline))
  else
    call setreg(s:clipboard_register, a:arg)
  endif
endfunction

" delete buffer line in silent
function! utils#deletebufline(bufnr, start, end) abort
  silent call deletebufline(a:bufnr, a:start, a:end)
endfunction
