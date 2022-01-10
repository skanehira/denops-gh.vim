" gh
" Author: skanehira
" License: MIT

if exists('loaded_gh')
  finish
endif
let g:loaded_gh = 1

augroup gh-define-highlight
  autocmd ColorScheme * call gh#_define_highlight()
augroup END

call gh#_define_highlight()
call gh#_define_signs()
