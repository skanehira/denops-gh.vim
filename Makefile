.PHONY: coverage
coverage: test
	@deno coverage cov
	@rm -rf cov

.PHONY: test-local
test-local:
	@DENOPS_PATH=$$GHQ_ROOT/github.com/vim-denops/denops.vim \
		DENOPS_TEST_NVIM=$$(which nvim) \
		DENOPS_TEST_VIM=$$(which vim) \
		deno test -A --unstable --coverage=cov denops/gh/

.PHONY: test
test:
	@deno test -A --unstable --coverage=cov denops/gh/

.PHONY: update-deps
update-deps:
	@udd denops/template/deps.ts
