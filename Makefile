.PHONY: coverage
coverage: test
	@deno coverage cov
	@rm -rf cov

.PHONY: run-mock
run-mock:
	@cd mock && node index.js &

.PHONY: test-local
test-local: run-mock
	@deno run -A waiter.ts && \
		DENOPS_PATH=$$GHQ_ROOT/github.com/vim-denops/denops.vim \
		DENOPS_TEST_NVIM=$$(which nvim) \
		DENOPS_TEST_VIM=$$(which vim) \
		deno test -A --unstable --coverage=cov denops/gh/ || \
		lsof -i:4000 | awk '{print $$2}' | tail -n 1 | xargs kill -9 && \
		lsof -i:4000 | awk '{print $$2}' | tail -n 1 | xargs kill -9

.PHONY: test
test: run-mock
	@deno run -A waiter.ts && \
		deno test -A --unstable --coverage=cov denops/gh/ && \
		lsof -i:4000 | awk '{print $$2}' | tail -n 1 | xargs kill -9

.PHONY: update-deps
update-deps:
	@udd denops/template/deps.ts
