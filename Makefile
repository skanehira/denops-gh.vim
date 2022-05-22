ARG = denops/gh

.PHONY: mock_graphql_server
mock_graphql_server:
	@if [ "$$(docker network ls --filter "name=gh_graphql" --format "{{.Name}}")" = "" ]; then docker network create gh_graphql ;fi
	@docker run --rm -p 8080:8080 -v $$PWD/denops/gh/github/graphql:/root/graphql \
		-v /Users/skanehira/Library/Caches/deno/deps:/deno-dir/deps \
		--name gh_graphql_server \
		-w /root/graphql \
		--entrypoint=deno \
		--net=gh_graphql \
		-d \
		denoland/deno:latest \
		run -A server.ts
	@docker run --rm --net=gh_graphql jwilder/dockerize -wait tcp://gh_graphql_server:8080 -timeout 60s

.PHONY: test-local
test-local: mock_graphql_server
	@DENOPS_PATH=$$GHQ_ROOT/github.com/vim-denops/denops.vim \
		DENOPS_TEST_NVIM=$$(which nvim) \
		DENOPS_TEST_VIM=$$(which vim) \
		GITHUB_ENDPOINT=http://localhost:8080 \
		deno test -A --unstable --ignore=denops/gh/github/graphql ${ARG}; docker stop gh_graphql_server

.PHONY: test
test: mock_graphql_server
	@GITHUB_ENDPOINT=http://localhost:8080 \
		deno test -A --unstable --ignore=denops/gh/github/graphql --coverage=cov denops/ ; docker stop gh_graphql_server

.PHONY: update-deps
update-deps:
	@udd denops/gh/deps.ts
