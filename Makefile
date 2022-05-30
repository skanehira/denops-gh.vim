ARG = denops

.PHONY: start_graphql_server
start_graphql_server:
	@cd denops/gh/github/graphql && deno run -A --no-check server.ts &
	@cd denops/gh/github/graphql && deno run -A wait.ts

.PHONY: stop_graphql_server
stop_graphql_server:
	@lsof -i:8080 | tail -n 1 | awk '{print $$2}' | xargs kill -9

.PHONY: test-local
test-local: stop_graphql_server start_graphql_server
	@DENOPS_PATH=$$GHQ_ROOT/github.com/vim-denops/denops.vim \
		DENOPS_TEST_NVIM=$$(which nvim) \
		DENOPS_TEST_VIM=$$(which vim) \
		TEST_LOCAL=true \
		GITHUB_ENDPOINT=http://localhost:8080 \
		deno test -A --unstable --ignore=denops/gh/github/graphql ${ARG}

.PHONY: gen
gen:
	@cd denops/gh/github/graphql && npm run gen

.PHONY: test
test: start_graphql_server
	@GITHUB_ENDPOINT=http://localhost:8080 \
		deno test -A --unstable --ignore=denops/gh/github/graphql --coverage=cov denops/

.PHONY: update-deps
update-deps:
	@udd denops/gh/deps.ts
